import { Manager } from "../../manager.js";
import { EmbedBuilder } from "discord.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ZklinkPlayer, ZklinkTrack } from "../../Zklink/main.js";
import { FormatDuration } from "../../utilities/FormatDuration.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

// Mã chính
export default class implements Command {
  public name = ["previous"];
  public description = "Phát bài trước đó trong hàng chờ.";
  public category = "Music";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.Previous;
  public usage = "";
  public aliases = ["pre"];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public options = [];
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const player = client.Zklink.players.get(handler.guild!.id) as ZklinkPlayer;
    const currentTrack = player.queue.current;

    if (!currentTrack) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands.music", "no_songs_playing", {
                user: handler.user!.displayName || handler.user!.tag,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    const previousIndex = player.queue.previous.length - 1;

    if (
      player.queue.previous.length == 0 ||
      player.queue.previous[0].uri == player.queue.current?.uri ||
      previousIndex < -1
    )
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands.music", "previous_notfound", {
                user: handler.user!.displayName || handler.user!.tag,
              })}`
            )
            .setColor(client.color_main),
        ],
      });

    const previousTrack = player.queue.previous[previousIndex];
    player.previous();

    player.data.set("endMode", "previous");

    const embed = new EmbedBuilder()
      .setDescription(
        `${client.i18n.get(handler.language, "client.commands.music", "previous_msg", {
          user: handler.user!.displayName || handler.user!.tag,
          title: this.getTitle(client, previousTrack),
        })}`
      )
      .setColor(client.color_main);

    handler.editReply({ content: " ", embeds: [embed] });
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
