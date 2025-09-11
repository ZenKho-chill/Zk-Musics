import { Manager } from "../../manager.js";
import {
  ComponentType,
  TextChannel,
  EmbedBuilder,
  User,
  AttachmentBuilder,
  MessageFlagsBitField,
  MessageFlags,
} from "discord.js";

import Axios from "axios";
import { UpdateMusicStatusChannel } from "../../utilities/UpdateStatusChannel.js";
import { ScrobbleToLastFM } from "../../utilities/ScrobbleToLastFM.js";
import { MilestoneTrack } from "../../utilities/MilestoneTrack.js";
import { TopArtist } from "../../utilities/TopArtist.js";
import { TopTrack } from "../../utilities/TopTrack.js";
import { TrackTitle } from "../../utilities/TrackTitle.js";
import { zkcard } from "zkcard";
import { FormatDuration } from "../../utilities/FormatDuration.js";
import {
  filterSelect,
  playerRowOne,
  playerRowTwo,
} from "../../utilities/PlayerControlButton.js";
import { Mode247Builder } from "../../services/Mode247Builder.js";
import { ControlButtonEnum } from "../../database/schema/ControlButton.js";
import { ZklinkPlayer, ZklinkTrack } from "../../Zklink/main.js";
import chalk from "chalk";
import { cli } from "winston/lib/winston/config/index.js";
export function scheduleScrobble(client: Manager, player: ZklinkPlayer) {
  const lastfmConfig = client.config.features.WebServer.LAST_FM_SCROBBLED;
  
  if (!lastfmConfig || !lastfmConfig.scheduleScrobble) {
    client.logger.warn("TrackStart", "Last.fm scrobble config không được cấu hình đúng cách");
    return;
  }
  
  setTimeout(() => {
    ScrobbleToLastFM(client, player);
  }, lastfmConfig.scheduleScrobble);
}
export default class {
  async execute(client: Manager, player: ZklinkPlayer, track: ZklinkTrack) {
    if (!client.isDatabaseConnected)
      return client.logger.warn(
        "DatabaseService",
        "Cơ sở dữ liệu chưa kết nối nên sự kiện này tạm thời sẽ không chạy. Vui lòng thử lại sau!"
      );

    const guild = await client.guilds
      .fetch(player.guildId)
      .catch(() => undefined);

    client.logger.info(
      "TrackStart",
      `${chalk.hex("#53ec53")("Player đã bắt đầu tại @ ")}${chalk.hex(
        "#53ec53"
      )(guild?.name)} / ${chalk.hex("#53ec53")(player.guildId)}`
    );

    let ControlButton = await client.db.ControlButton.get(`${player.guildId}`);
    if (!ControlButton)
      ControlButton = await client.db.ControlButton.set(
        `${player.guildId}`,
        ControlButtonEnum.Enable
      );

    if (!player) return;

    /////////// Cập nhật thiết lập nhạc ///////////
    await client.UpdateQueueMsg(player);
    /////////// Cập nhật thiết lập nhạc ///////////

    /////////// Cập nhật kênh trạng thái nhạc //////////
    await UpdateMusicStatusChannel(client, player);
    /////////// Cập nhật kênh trạng thái nhạc //////////

    /////////// Cập nhật lịch scrobble //////////
    if (client.config.features.WebServer.LAST_FM_SCROBBLED.Enable) {
      scheduleScrobble(client, player);
    }
    /////////// Cập nhật lịch scrobble //////////

    const channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel;
    if (!channel) return;

    client.emit("trackStart", player);

    if (client.config.features.AUTO_RESUME) {
      const autoreconnect = new Mode247Builder(client, player);
      const getData = await autoreconnect.get(player.guildId);
      if (!getData) await autoreconnect.playerBuild(player.guildId);
      else {
        player.queue.current
          ? await client.db.autoreconnect.set(
              `${player.guildId}.current`,
              player.queue.current?.uri
            )
          : true;
        await client.db.autoreconnect.set(
          `${player.guildId}.config.loop`,
          player.loop
        );

        function queueUri() {
          const res = [];
          for (let data of player.queue) {
            res.push(data.uri);
          }
          return res.length !== 0 ? res : [];
        }

        function previousUri() {
          const res = [];
          for (let data of player.queue.previous) {
            res.push(data.uri);
          }
          return res.length !== 0 ? res : [];
        }

        await client.db.autoreconnect.set(
          `${player.guildId}.queue`,
          queueUri()
        );
        await client.db.autoreconnect.set(
          `${player.guildId}.previous`,
          previousUri()
        );
      }
    }

    let data = await client.db.setup.get(`${channel.guild.id}`);
    if (data && player.textId === data.channel) return;

    let guildModel = await client.db.language.get(`${channel.guild.id}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(
        `${channel.guild.id}`,
        client.config.bot.LANGUAGE
      );
    }

    const language = guildModel;

    const song = player.queue.current;

    if (ControlButton == ControlButtonEnum.Disable) return;

    const UserThemes = song?.requester as User;
    let themeData = await client.db.Themes.get(UserThemes.id);
    let theme = client.config.features.MusicCard.Themes; // Chủ đề mặc định

    if (themeData) {
      theme = themeData.theme;
    }

    const source = player.queue.current?.source || "unknown";
    let src = client.config.PLAYER_SOURCENAME.UNKNOWN; // Mặc định UNKNOWN nếu nguồn không xác định
    if (source === "youtube") {
      src = client.config.PLAYER_SOURCENAME.YOUTUBE;
    } else if (source === "spotify") {
      src = client.config.PLAYER_SOURCENAME.SPOTIFY;
    } else if (source === "tidal") {
      src = client.config.PLAYER_SOURCENAME.TIDAL;
    } else if (source === "soundcloud") {
      src = client.config.PLAYER_SOURCENAME.SOUNDCLOUD;
    } else if (source === "deezer") {
      src = client.config.PLAYER_SOURCENAME.DEEZER;
    } else if (source === "twitch") {
      src = client.config.PLAYER_SOURCENAME.TWITCH;
    } else if (source === "apple") {
      src = client.config.PLAYER_SOURCENAME.APPLE_MUSIC;
    } else if (source === "applemusic") {
      src = client.config.PLAYER_SOURCENAME.APPLE_MUSIC;
    } else if (source === "youtube_music") {
      src = client.config.PLAYER_SOURCENAME.YOUTUBE_MUSIC;
    } else if (source === "http") {
      src = client.config.PLAYER_SOURCENAME.HTTP;
    }

    const durationString = new FormatDuration().parse(song?.duration);
    const originalTitle =
      durationString === "Live Stream"
        ? song?.author
        : song?.title || `♪ Những ai muốn hát sẽ luôn tìm thấy một bài.`;

    const title =
      originalTitle.length > 40
        ? `${originalTitle.slice(0, 40)}...`
        : originalTitle;
    const Author =
      (song?.author || guild!.name).length > 15
        ? `${(song?.author || guild!.name).slice(0, 15)}...`
        : song?.author || guild!.name;

    const card = new zkcard()
      .setName(
        String(
          title.replace(
            /(?:https?|ftp):\/\/[\n\S]+/g,
            `♪ Những ai muốn hát sẽ luôn tìm thấy một bài.`
          )
        )
      )
      .setAuthor(Author.toUpperCase())
      .setColor("auto")
      .setTheme(theme)
      .setBrightness(50)
      .setThumbnail(
        source === "soundcloud"
          ? (client.user?.displayAvatarURL() as string)
          : track.artworkUrl ??
              `https://img.youtube.com/vi/${track.identifier}/hqdefault.jpg`
      )
      .setRequester(
        (song?.requester as User)?.displayName.toUpperCase() ||
          (song?.requester as User)?.username.toUpperCase()
      );

    const cardBuffer = await card.build();
    const attachment = new AttachmentBuilder(cardBuffer, { name: "zk.png" });

    const embeded1 = new EmbedBuilder()
      .setAuthor({
        name: client.i18n.get(language, "events.player", "track_author"),
        iconURL: client.i18n.get(
          language,
          "events.player",
          "track_author_icon"
        ),
      })
      .setDescription(`**${TrackTitle(client, track)}**`)
      .setImage(`attachment://zk.png`)
      .setColor(client.color_second)
      .addFields(
        {
          name: `${client.config.TRACKS_EMOJI.Author} ${song?.author} ♪`,
          value: `**${
            client.config.TRACKS_EMOJI.Timers
          } ${new FormatDuration().parse(song?.duration)}**`,
          inline: true,
        },
        {
          name: `${client.config.TRACKS_EMOJI.Volume} **${player.volume}%**`,
          value: `**${
            player!.data.get("autoplay")
              ? `${client.config.TRACKS_EMOJI.Autoplay} Tự phát`
              : src
          }**`,
          inline: true,
        }
      );

    const embeded2 = new EmbedBuilder()
      .setAuthor({
        name: client.i18n.get(language, "events.player", "track_author"),
        iconURL: client.i18n.get(
          language,
          "events.player",
          "track_author_icon"
        ),
      })
      .setDescription(`**${TrackTitle(client, track)}**`)
      .setColor(client.color_second)
      .setFooter({
        text: `Tự phát ${
          player!.data.get("autoplay") ? "Bật" : "Tắt"
        } • Độ dài hàng chờ ${player.queue.length} bài`,
        iconURL:
          client.user?.displayAvatarURL() ||
          (song?.requester as User)?.displayAvatarURL() ||
          "",
      })
      .setThumbnail(
        source === "soundcloud"
          ? client.user?.displayAvatarURL({ size: 512 })
          : track.artworkUrl ??
              `https://img.youtube.com/vi/${track.identifier}/hqdefault.jpg`
      )
      .addFields(
        {
          name: client.i18n.get(language, "events.player", "track_song_author"),
          value: `[${
            Author || "Không xác định"
          }](https://google.com/search?q=${encodeURIComponent(
            song?.author || "Không xác định"
          )})`,
          inline: true,
        },
        {
          name: client.i18n.get(
            language,
            "events.player",
            "track_requested_by"
          ),
          value: `**${song?.requester || "Không xác định"}**`,
          inline: true,
        },
        {
          name: client.i18n.get(language, "events.player", "track_duration"),
          value: `\`${new FormatDuration().parse(song?.duration)}\``,
          inline: true,
        }
      );

    const embedToSend =
      client.config.features.MusicCard.Enable === true ? embeded1 : embeded2;

    const playing_channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel;

    const nplaying = playing_channel
      ? await playing_channel.send({
          flags: MessageFlags.SuppressNotifications,
          embeds: [embedToSend],
          components: [
            ...(client.config.features.FilterMenu ?? false
              ? [filterSelect(client)]
              : []),
            playerRowOne(client),
            playerRowTwo(client),
          ],
          files:
            client.config.features.MusicCard.Enable === true
              ? [attachment]
              : [],
        })
      : undefined;

    if (!nplaying) return;

    //////////// MilestoneTrackUser //////////
    await MilestoneTrack(client, player);
    //////////// MilestoneTrackUser //////////

    //////////// PlayedSongGlobal //////////
    let BotData = await client.db.PlayedSongGlobal.get("global");
    if (!BotData) {
      BotData = {
        SongsPlayed: 0,
      };
    }
    BotData.SongsPlayed += 1;
    await client.db.PlayedSongGlobal.set("global", BotData);
    //////////// PlayedSongGlobal //////////

    //////////// PlayedSongGuild //////////
    let GuildData = await client.db.PlayedSongGuild.get(`${player.guildId}`);
    if (!GuildData) {
      GuildData = {
        Count: 0,
        GuildName: guild.name,
      };
    } else {
      GuildData.GuildName = guild.name;
    }
    GuildData.Count += 1;
    await client.db.PlayedSongGuild.set(`${player.guildId}`, GuildData);
    //////////// PlayedSongGuild //////////

    //////////// TopArtistUser //////////
    await TopArtist(client, player);
    //////////// TopArtistUser //////////

    //////////// TopTrackUser //////////
    await TopTrack(client, player);
    //////////// TopTrackUser //////////

    const collector = nplaying.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (message) => {
        if (
          message.guild!.members.me!.voice.channel &&
          message.guild!.members.me!.voice.channelId ===
            message.member!.voice.channelId
        )
          return true;
        else {
          message.reply({
            content: `${client.i18n.get(
              language,
              "events.player",
              "no_same_voice"
            )}`,
            flags: MessageFlags.Ephemeral,
          });
          return false;
        }
      },
    });

    client.nplayingMsg.set(player.guildId, {
      coll: collector,
      msg: nplaying,
    });

    collector.on("collect", async (message): Promise<void> => {
      const id = message.customId;
      const button = client.plButton.get(id);

      const language = guildModel;

      if (button) {
        try {
          return button.run(
            client,
            message,
            String(language),
            player,
            nplaying,
            collector
          );
        } catch (err) {
          client.logger.warn("ButtonError", err as string);
        }
      }
    });

    collector.on("end", (): void => {
      // @ts-ignore
      collector.removeAllListeners();
    });
  }
}
