import { EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ZklinkPlayer } from "../../Zklink/main.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

// Mã chính
export default class implements Command {
  public name = ["autoplay"];
  public description = "Tự phát nhạc (phát ngẫu nhiên các bài)";
  public category = "Music";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.Autoplay;
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

    if (!client.config.features.AUTOPLAY_SUPPORT) {
      const AutoplayDisabledEmbed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "commands.music", "autoplay_disabled", {
            user: String(handler.user?.displayName || handler.user?.tag),
            botname: client.user!.username || client.user!.displayName,
            serversupport: client.config.bot.SERVER_SUPPORT_URL,
          })}`
        )
        .setColor(client.color_main);

      return handler.editReply({
        content: " ",
        embeds: [AutoplayDisabledEmbed],
      });
    }

    const player = client.Zklink.players.get(handler.guild!.id) as ZklinkPlayer;

    if (player.data.get("autoplay") === true) {
      player.data.set("autoplay", false);
      player.data.set("identifier", null);
      player.data.set("requester", null);
      player.queue.clear();

      const off = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "commands.music", "autoplay_off", {
            mode: handler.modeLang.disable,
          })}`
        )
        .setColor(client.color_main);

      await handler.editReply({ content: " ", embeds: [off] });
    } else {
      // Kiểm tra nếu player.queue.current không rỗng trước khi truy cập thuộc tính identifier
      if (!player!.queue.current) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(
                  handler.language,
                  "commands.music",
                  "autoplay_no_songs_playing"
                )}`
              )
              .setColor(client.color_main),
          ],
        });
      }

      const identifier = player.queue.current!.identifier;

      player.data.set("autoplay", true);
      player.data.set("identifier", identifier);
      player.data.set("requester", handler.user);
      player.data.set("source", player.queue.current?.source);
      player.data.set("author", player.queue.current?.author);
      player.data.set("title", player.queue.current?.title);

      const on = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "commands.music", "autoplay_on", {
            mode: handler.modeLang.enable,
          })}`
        )
        .setColor(client.color_main);

      await handler.editReply({ content: " ", embeds: [on] });
    }
  }
}
