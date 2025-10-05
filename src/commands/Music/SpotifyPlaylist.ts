import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuInteraction,
  ComponentType,
  TextChannel,
  MessageFlags,
} from "discord.js";
import { ZklinkPlayer, ZklinkTrack, ZklinkSearchResultType } from "../../Zklink/main.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { SpotifygetAccessToken } from "../../utilities/SpotifygetAccessToken.js";
import axios from "axios";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
const data: Config = new ConfigData().data;
let isCollectorActive = false;

export default class implements Command {
  public name = ["spotify", "playlist"];
  public description = "Hiển thị playlist Spotify của bạn & chọn một playlist để phát";
  public category = "Âm nhạc";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.SpotifyPlaylist;
  public usage = "";
  public aliases = ["spp"];
  public lavalink = true;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    if (isCollectorActive) {
      const responseEmbed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "commands.music", "spotify_playlist_active")}`
        )
        .setColor(client.color_main);

      if (handler.interaction) {
        return handler.interaction.replied || handler.interaction.deferred
          ? handler.interaction.editReply({
              embeds: [responseEmbed],
            })
          : handler.interaction.reply({
              embeds: [responseEmbed],
              flags: MessageFlags.Ephemeral,
            });
      } else {
        return handler.editReply({
          embeds: [responseEmbed],
        });
      }
    }

    let player = client.Zklink.players.get(handler.guild!.id) as ZklinkPlayer;

    const spotifyID = await client.db.SpotifyId.get(handler.user!.id);
    if (!spotifyID) {
      const noSpotifyIDEmbed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "commands.music", "spotify_playlist_not_connected")}`
        )
        .setColor(client.color_main);
      await handler.editReply({
        embeds: [noSpotifyIDEmbed],
        components: [],
      });
      return;
    }

    const { channel } = handler.member!.voice;
    if (!channel)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.music", "play_no_in_voice")}`
            )
            .setColor(client.color_main),
        ],
      });

    if (!player)
      player = await client.Zklink.create({
        guildId: handler.guild!.id,
        voiceId: handler.member!.voice.channel!.id,
        textId: handler.channel!.id,
        shardId: handler.guild?.shardId ?? 0,
        nodeName: (await client.Zklink.nodes.getLeastUsed()).options.name,
        deaf: true,
        volume: client.config.bot.DEFAULT_VOLUME ?? 100,
      });
    else if (player && !this.checkSameVoice(client, handler, handler.language)) {
      return;
    }

    player.textId = handler.channel!.id;

    try {
      const accessToken = await SpotifygetAccessToken(client);
      const response = await axios.get(`https://api.spotify.com/v1/users/${spotifyID}/playlists`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      let playlists = response.data.items;
      if (playlists.length > 25) {
        playlists = playlists.slice(0, 25);
      }

      if (!playlists || playlists.length === 0) {
        const noPlaylistsEmbed = new EmbedBuilder()
          .setDescription(
            `${client.i18n.get(handler.language, "commands.music", "spotify_playlist_empty")}`
          )
          .setColor(client.color_main);
        await handler.editReply({
          embeds: [noPlaylistsEmbed],
          components: [],
        });
        return;
      }

      const options = playlists.map((playlist: any) => {
        const name =
          playlist.name.length > 25 ? playlist.name.substring(0, 22) + "..." : playlist.name;
        const description =
          playlist.description && playlist.description.length > 25
            ? playlist.description.substring(0, 22) + "..."
            : playlist.description;

        return new StringSelectMenuOptionBuilder()
          .setLabel(name)
          .setDescription(description || "Không có mô tả")
          .setValue(playlist.id)
          .setEmoji(client.config.SEARCH_COMMANDS_EMOJI.SPOTIFY);
      });

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("spotify_pl")
          .setPlaceholder(
            client.i18n.get(handler.language, "commands.music", "spotify_playlist_placeholder")
          )
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(options)
      );

      // Tạo phần mô tả embed với liên kết playlist, số lượng bài và danh sách đánh số
      const AllPlaylist = playlists
        .map((playlist: any, index: number) => {
          return `\`${index + 1}\`. **[${
            playlist.name
          }](https://open.spotify.com/playlist/${playlist.id})** - \`${
            playlist.tracks.total
          } bài\``;
        })
        .join("\n");
      const SpotifyName = playlists[0].owner.display_name;

      const EmbedPlaylist = new EmbedBuilder()
        .setTitle(
          `${client.i18n.get(handler.language, "commands.music", "spotify_playlist_title", {
            SpotifyName: SpotifyName,
          })}`
        )
        .setColor(client.color_second)
        .setDescription(
          `${client.i18n.get(handler.language, "commands.music", "spotify_playlist_desc", {
            playlists: AllPlaylist,
          })}`
        )
        .setThumbnail(
          handler.user?.displayAvatarURL({ size: 1024 }) ||
            client.user!.displayAvatarURL({ size: 1024 })
        )
        .setFooter({
          text: `${client.i18n.get(handler.language, "commands.music", "spotify_playlist_footer", {
            username: client.user!.username,
            max: "25",
          })}`,
        });

      await handler.editReply({
        embeds: [EmbedPlaylist],
        components: [row],
      });

      isCollectorActive = true; // Đặt cờ true khi collector bắt đầu
      const collector = (handler?.channel! as TextChannel).createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        filter: (message) => {
          if (
            message.guild!.members.me!.voice.channel &&
            message.guild!.members.me!.voice.channelId === message.member!.voice.channelId
          )
            return true;
          else {
            message.reply({
              content: `${client.i18n.get(handler.language, "interaction", "no_same_voice")}`,
              flags: MessageFlags.Ephemeral,
            });
            return false;
          }
        },
        time: client.config.features.SEARCH_TIMEOUT,
      });

      collector.on("collect", async (interaction: StringSelectMenuInteraction) => {
        const selectedPlaylistId = interaction.values[0];
        const selectedPlaylist = playlists.find(
          (playlist: any) => playlist.id === selectedPlaylistId
        );

        if (!selectedPlaylist) {
          await interaction.update({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${client.i18n.get(
                    handler.language,
                    "commands.music",
                    "spotify_playlist_notfound"
                  )}`
                )
                .setColor(client.color_main),
            ],
            components: [],
          });
          return;
        }
        const selectedPlaylistUrl = `https://open.spotify.com/playlist/${selectedPlaylistId}`;
        const searchResults = await player.search(selectedPlaylistUrl, {
          requester: handler.user,
        });

        if (player) {
          player.queue.add(searchResults.tracks);
          if (!player.playing) await player.play();
          const embed = new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.music", "spotify_play_playlist", {
                title: this.getTitle(
                  client,
                  searchResults.type,
                  searchResults.tracks,
                  selectedPlaylist
                ),
                url: selectedPlaylist,
                playlistname: selectedPlaylist.name,
              })}`
            )
            .setThumbnail(selectedPlaylist.images[0]?.url)
            .setColor(client.color_second);

          await interaction.update({
            embeds: [embed],
            components: [],
          });
          collector?.stop();
        } else {
          await interaction.update({
            embeds: [
              new EmbedBuilder()
                .setDescription(`${client.i18n.get(handler.language, "interaction", "no_player")}`)
                .setColor(client.color_main),
            ],
            components: [],
          });
        }
      });

      collector.on("end", async (_, reason) => {
        isCollectorActive = false;
        row.components[0].setDisabled(true);
        if (reason === "time") {
          await handler.editReply({
            embeds: [EmbedPlaylist],
            components: [row],
          });
        }
      });
    } catch (error) {
      logWarn("SpotifyPlaylist", `Lấy playlists từ Spotify thất bại: ${error}`);
      await handler.editReply({
        content: " ",
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.music", "spotify_playlist_error")}`
            )
            .setColor(client.color_main),
        ],
        components: [],
      });
    }
  }

  checkSameVoice(client: Manager, handler: CommandHandler, language: string) {
    if (handler.member!.voice.channel !== handler.guild!.members.me!.voice.channel) {
      handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(language, "interaction", "no_same_voice")}`)
            .setColor(client.color_main),
        ],
      });
      return false;
    }
    return true;
  }

  getTitle(
    client: Manager,
    type: ZklinkSearchResultType,
    tracks: ZklinkTrack[],
    value?: string
  ): string {
    const truncate = (str: string, maxLength: number): string =>
      str.length > maxLength ? str.substring(0, maxLength - 3) + "..." : str;

    const title = truncate(tracks[0].title, 25);
    const author = tracks[0].author;

    if (client.config.features.HIDE_LINK) return `${title} bởi ${author}`;
    else {
      const supportUrl = client.config.bot.SERVER_SUPPORT_URL;
      if (type === "PLAYLIST") {
        return `${supportUrl}`;
      } else {
        return `[\`${title}\`](${supportUrl}) \`${author}\``;
      }
    }
  }
}
