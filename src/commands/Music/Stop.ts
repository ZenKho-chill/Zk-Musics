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
  public name = ["stop"];
  public description = "Dừng phát nhạc và khiến bot rời kênh thoại";
  public category = "Âm nhạc";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.Stop;
  public usage = "";
  public aliases = [];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.SilentDeferReply();

    const player = client.Zklink.players.get(handler.guild!.id) as ZklinkPlayer;
    const currentTrack = player.queue.current;

    if (!currentTrack) {
      const skipped = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "client.commands.music", "no_songs_playing")}`
        )
        .setColor(client.color_main);

      handler.editReply({ content: " ", embeds: [skipped] });
      return;
    }

    const { channel } = handler.member!.voice;

    player.data.set("sudo-destroy", true);
    const is247 = await client.db.autoreconnect.get(`${handler.guild?.id}`);
    player.stop(is247 && is247.twentyfourseven ? false : true);

    const embed = new EmbedBuilder()
      .setDescription(
        `${client.i18n.get(handler.language, "client.commands.music", "stop.msg", {
          channel: channel!.name,
          user: handler.user!.displayName || handler.user!.tag,
          title: this.getTitle(client, currentTrack),
        })}`
      )
      .setColor(client.color_main);

    await handler.editReply({ content: " ", embeds: [embed] });
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
