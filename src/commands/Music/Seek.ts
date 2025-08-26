import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { FormatDuration } from "../../utilities/FormatDuration.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ZkslinkPlayer, ZkslinkTrack } from "../../zklink/main.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;
const time_regex = /(^[0-9][\d]{0,3}):(0[0-9]{1}$|[1-5]{1}[0-9])/;

// Mã chính
export default class implements Command {
  public name = ["seek"];
  public description = "Di chuyển tới vị trí trong bài hát";
  public category = "Âm nhạc";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.Seek;
  public usage = "<định_dạng_thời_gian. VD: 999:59>";
  public aliases = [];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [
    {
      name: "time",
      description: "Đặt vị trí cho track đang phát. Ví dụ: 0:10 hoặc 120:10",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    let value;
    const time = handler.args[0];

    if (!time_regex.test(time))
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.music",
                "seek_invalid"
              )}`
            )
            .setColor(client.color_main),
        ],
      });
    else {
      const [m, s] = time.split(/:/);
      const min = Number(m) * 60;
      const sec = Number(s);
      value = min + sec;
    }

    const player = client.zklink.players.get(
      handler.guild!.id
    ) as ZkslinkPlayer;
    const currentTrack = player.queue.current;

    if (!currentTrack) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.music",
                "no_songs_playing",
                {
                  user: handler.user!.displayName || handler.user!.tag,
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    if (value * 1000 >= player.queue.current!.duration! || value < 0)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.music",
                "seek_beyond",
                {
                  user: handler.user!.displayName || handler.user!.tag,
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });

    if (!currentTrack || !currentTrack.isSeekable) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.music",
                "seek_not_seekable",
                {
                  user: handler.user!.displayName || handler.user!.tag,
                  title: this.getTitle(client, currentTrack),
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    await player.seek(value * 1000);

    const song_position = player.position;

    let final_res;

    if (song_position < value * 1000) final_res = song_position + value * 1000;
    else final_res = value * 1000;

    const Duration = new FormatDuration().parse(final_res);

    const seeked = new EmbedBuilder()
      .setDescription(
        `${client.i18n.get(handler.language, "commands.music", "seek_msg", {
          duration: Duration,
          user: handler.user!.displayName || handler.user!.tag,
          title: this.getTitle(client, currentTrack),
        })}`
      )
      .setColor(client.color_main);

    handler.editReply({ content: " ", embeds: [seeked] });
  }

  getTitle(client: Manager, tracks: ZkslinkTrack): string {
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
