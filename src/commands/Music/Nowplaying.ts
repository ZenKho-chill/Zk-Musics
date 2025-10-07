import { Manager } from "../../manager.js";
import { EmbedBuilder, User } from "discord.js";
import { FormatDuration } from "../../utilities/FormatDuration.js";
import { ProgressBar } from "../../utilities/ProgressBar.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ZklinkPlayer, ZklinkTrack } from "../../Zklink/main.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { NowPlayingUpdateService } from "../../services/NowPlayingUpdateService.js";
import { log } from "../../utilities/LoggerHelper.js";
const data: Config = ConfigData.getInstance().data;
// Mã chính
export default class implements Command {
  public name = ["nowplaying"];
  public description = "Hiển thị bài hát đang phát.";
  public category = "Music";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.NowPlaying;
  public usage = "";
  public aliases = ["np"];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.SilentDeferReply();

    const player = client.Zklink.players.get(handler.guild!.id) as ZklinkPlayer;
    const currentTrack = player.queue.current;

    if (!currentTrack) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.music", "no_songs_playing", {
                user: handler.user!.displayName || handler.user!.tag,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    const song = player.queue.current;
    const position = player.position;
    const CurrentDuration = new FormatDuration().parse(position);
    const TotalDuration = new FormatDuration().parse(song!.duration);
    const bar = ProgressBar(position, song!.duration, 20);
    const Part = Math.floor((position / song!.duration!) * 30);
    const requester = song?.requester as User;
    const requesterName =
      requester?.displayName || requester?.username || client.user?.username || "N/A";

    let requesterAvatarURL;
    if (requester && requester.displayAvatarURL) {
      requesterAvatarURL = requester.displayAvatarURL();
    } else {
      requesterAvatarURL = client.user?.displayAvatarURL();
    }

    const source = player.queue.current?.source || "unknown";
    let src = client.config.PLAYER_SOURCENAME.UNKNOWN; // Mặc định là UNKNOWN nếu nguồn không xác định
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

    const fieldDataGlobal = [
      {
        name: `${client.config.TRACKS_EMOJI.Author} ${song?.author} ♪`,
        value: `${
          client.config.TRACKS_EMOJI.Timers
        } **${new FormatDuration().parse(song!.duration)}**`,
        inline: true,
      },
      {
        name: `**${
          player!.data.get("autoplay")
            ? `${client.config.TRACKS_EMOJI.Autoplay} Tự phát`
            : `${client.config.TRACKS_EMOJI.Volume} ${player.volume}%`
        }**`,
        value: `**${src}**`,
        inline: true,
      },
      {
        name: `**Thời lượng hiện tại**`,
        value: `\`${CurrentDuration} / ${new FormatDuration().parse(song!.duration)}\n${bar}\``,
        inline: false,
      },
    ];

    const embeded = new EmbedBuilder();
    embeded.setAuthor({
      name: `${client.i18n.get(handler.language, "commands.music", "nowplaying_title")}`,
    });
    embeded.setColor(client.color_second);
    if (new FormatDuration().parse(song!.duration) !== "Live Stream") {
      embeded.setDescription(`**${this.getTitle(client, song!)}**`);
    }
    embeded.setThumbnail(
      source === "soundcloud"
        ? (client.user?.displayAvatarURL() as string)
        : (song?.artworkUrl ?? `https://img.youtube.com/vi/${song?.identifier}/hqdefault.jpg`)
    );
    embeded.addFields(fieldDataGlobal);
    embeded.setFooter({
      text: `Yêu cầu từ ${requesterName.toUpperCase()}`,
      iconURL: requesterAvatarURL,
    });

    const reply = await handler.editReply({
      content: " ",
      embeds: [embeded],
      files: [],
    });

    // Bắt đầu tracking cập nhật nowplaying
    if (reply && reply.id && currentTrack.identifier) {
      NowPlayingUpdateService.getInstance().startTracking(
        client,
        handler.guild!.id,
        handler.channel!.id,
        reply.id,
        currentTrack.identifier,
        handler.language
      );
    }
  }

  getTitle(client: Manager, tracks: ZklinkTrack): string {
    const truncate = (str: string, maxLength: number): string =>
      str.length > maxLength ? str.substring(0, maxLength - 3) + "..." : str;
    const title = truncate(tracks.title, 25);
    const author = truncate(tracks.author, 15);
    const supportUrl = client.config.bot.SERVER_SUPPORT_URL;

    if (new FormatDuration().parse(tracks.duration) === "Live Stream") {
      return `${author}`;
    }

    if (client.config.features.HIDE_LINK) {
      return `\`${title}\` bởi \`${author}\``;
    } else if (client.config.features.REPLACE_LINK) {
      return `[\`${title}\`](${supportUrl}) bởi \`${author}\``;
    } else {
      return `[\`${title}\`](${tracks.uri || supportUrl}) bởi \`${author}\``;
    }
  }
}
