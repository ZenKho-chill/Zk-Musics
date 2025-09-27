import { Manager } from "../../manager.js";
import { EmbedBuilder } from "discord.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ZklinkPlayer } from "../../Zklink/main.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

// Mã chính
export default class implements Command {
  public name = ["clearqueue"];
  public description = "Xóa bài trong hàng chờ";
  public category = "Music";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.ClearQueue;
  public usage = "";
  public aliases = ["clear", "cq"];
  public lavalink = true;
  public options = [];
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
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
              `${client.i18n.get(handler.language, "client.commands", "music.no_songs_playing", {
                user: handler.user!.displayName || handler.user!.tag,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    }
    player.queue.clear();

    const cleared = new EmbedBuilder()
      .setDescription(`${client.i18n.get(handler.language, "client.commands", "music.clearqueue_msg")}`)
      .setColor(client.color_main);
    await handler.editReply({ content: " ", embeds: [cleared] });

    client.wsl.get(handler.guild!.id)?.send({
      op: "playerClearQueue",
      guild: handler.guild!.id,
    });
  }
}
