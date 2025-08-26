import { Manager } from "../../manager.js";
import { EmbedBuilder } from "discord.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ZkslinkPlayer, ZkslinkTrack } from "../../zklink/main.js";
import { FormatDuration } from "../../utilities/FormatDuration.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["pause"];
  public description = "Tạm dừng nhạc";
  public category = "Music";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.Pause;
  public usage = "";
  public aliases = [];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

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

    await player.pause();

    const embed = new EmbedBuilder()
      .setDescription(
        `${client.i18n.get(handler.language, "commands.music", "pause_msg", {
          user: handler.user!.displayName || handler.user!.tag,
          title: this.getTitle(client, currentTrack),
        })}`
      )
      .setColor(client.color_main);

    handler.editReply({ content: " ", embeds: [embed] });
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
