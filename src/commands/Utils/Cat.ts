import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { EmbedBuilder } from "discord.js";
import axios from "axios";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["cat"];
  public description = "Gửi ảnh mèo ngẫu nhiên";
  public category = "Utils";
  public accessableby = data.COMMANDS_ACCESS.UTILS.Cat;
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.SilentDeferReply();

    try {
      const response = await axios.get(
        "https://api.thecatapi.com/v1/images/search"
      );
      const catImageUrl = response.data[0].url;

      const embed = new EmbedBuilder()
        .setColor(client.color_main)
        .setImage(catImageUrl);

      await handler.editReply({
        embeds: [embed.toJSON()],
      });
    } catch (error) {
      client.logger.info("Cat", "Lỗi khi lấy ảnh mèo");
      await handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.utils",
                "cat_error"
              )}`
            )
            .setColor(client.color_main),
        ],
      });
    }
  }
}
