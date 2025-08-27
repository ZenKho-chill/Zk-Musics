import { EmbedBuilder } from "discord.js";
import { FormatDuration } from "../../utilities/FormatDuration.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ZklinkPlayer, ZklinkTrack } from "../../zklink/main.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;
const fastForwardNum = 10;

// Mã chính
export default class implements Command {
  public name = ["forward"];
  public description = "Tua tiến bài (10s)";
  public category = "Music";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.Forward;
  public usage = "";
  public aliases = [];
  public lavalink = true;
  public options = [];
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const player = client.zklink.players.get(handler.guild!.id) as ZklinkPlayer;
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
    const song_position = player.position;
    const CurrentDuration = new FormatDuration().parse(song_position + fastForwardNum * 1000);

    if (song_position + fastForwardNum * 1000 < song!.duration!) {
      player.send({
        guildId: handler.guild!.id,
        playerOptions: {
          position: song_position + fastForwardNum * 1000,
        },
      });

      const forward2 = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "commands.music", "forward_msg", {
            duration: CurrentDuration,
            user: handler.user!.displayName || handler.user!.tag,
            title: this.getTitle(client, currentTrack),
          })}`
        )
        .setColor(client.color_main);

      await handler.editReply({ content: " ", embeds: [forward2] });
    } else {
      return await handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.music", "forward_beyond")}`
            )
            .setColor(client.color_main),
        ],
      });
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