import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel,
  User,
  MessageFlags,
} from "discord.js";
import { Manager } from "../manager.js";
import md5 from "md5";
import { ZklinkPlayer } from "../Zklink/main.js";
import Axios from "axios";

function generateApiSignature(
  client: Manager,
  params: { [key: string]: string }
) {
  const lastfmConfig = client.config.features.WebServer.LAST_FM_SCROBBLED;
  
  if (!lastfmConfig || !lastfmConfig.Secret) {
    throw new Error("Last.fm secret key not configured");
  }

  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("");

  const stringToHash = sortedParams + lastfmConfig.Secret;
  const apiSignature = md5(stringToHash); // Tạo hash MD5

  return apiSignature;
}
export async function ScrobbleToLastFM(client: Manager, player: ZklinkPlayer) {
  try {
    const lastfmConfig = client.config.features.WebServer.LAST_FM_SCROBBLED;
    
    if (!lastfmConfig || !lastfmConfig.Enable) {
      return;
    }

    if (!player.queue?.current) {
      return;
    }

    if (player.queue?.current.isStream) {
      return;
    }

    if (player.queue?.current.source == "soundcloud") {
      return;
    }

    const requester = player.queue?.current.requester as User;
    if (!requester) {
      return;
    }

    const requesterId = requester.id;
    const lastFmData = await client.db.LastFm.get(requesterId);
    if (!lastFmData || !lastFmData.sessionKey) {
      return;
    }
    const { sessionKey } = lastFmData;

    const response = await Axios.post(
      "http://ws.audioscrobbler.com/2.0/",
      null,
      {
        params: {
          method: "track.scrobble",
          api_key: lastfmConfig.ApiKey,
          sk: sessionKey,
          artist: player.queue.current.author,
          track: player.queue.current.title,
          timestamp: Math.floor(Date.now() / 1000),
          api_sig: generateApiSignature(client, {
            api_key: lastfmConfig.ApiKey,
            method: "track.scrobble",
            sk: sessionKey,
            artist: player.queue.current.author,
            track: player.queue.current.title,
            timestamp: Math.floor(Date.now() / 1000).toString(),
          }),
          format: "json",
        },
      }
    );
  } catch (error: any) {
    const lastfmConfig = client.config.features.WebServer.LAST_FM_SCROBBLED;
    
    client.logger.warn(
      ScrobbleToLastFM.name,
      `Lỗi khi scrobble lên LastFM: ${error}`
    );

    if (
      error.response &&
      error.response.data.error === 9 &&
      error.response.data.message ===
        "Invalid session key - Please re-authenticate"
    ) {
      const requesterUser = player.queue?.current?.requester as User;
      const requesterId = requesterUser.id;
      const LoginLastFM_Url = `https://www.last.fm/api/auth?api_key=${
        lastfmConfig.ApiKey
      }&cb=${encodeURIComponent(
        `${lastfmConfig.Callback}?user=${requesterId}`
      )}`;
      const channel = (await client.channels
        .fetch(player.textId)
        .catch(() => undefined)) as TextChannel;

      let guildModel = await client.db.language.get(`${channel.guild.id}`);
      if (!guildModel) {
        guildModel = await client.db.language.set(
          `${channel.guild.id}`,
          client.config.bot.LANGUAGE
        );
      }

      const language = guildModel;

      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(client.color_second)
          .setDescription(
            `${client.i18n.get(
              language,
              "events.player",
              "expired_login_session",
              {
                user: `<@${requesterId}>`,
              }
            )}`
          );

        const LastFMbutton =
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel("Đăng nhập")
              .setStyle(ButtonStyle.Link)
              .setURL(LoginLastFM_Url)
          );
        const msg = await channel.send({
          flags: MessageFlags.SuppressNotifications,
          content: " ",
          embeds: [embed],
          components: [LastFMbutton],
        });
        setTimeout(async () => {
          LastFMbutton.components[0].setDisabled(true);
          if (msg) {
            await msg.edit({
              components: [LastFMbutton],
            });
          }
        }, lastfmConfig.ExpiredLink);
        await client.db.LastFm.delete(requesterId);
      }
    }
  }
}
