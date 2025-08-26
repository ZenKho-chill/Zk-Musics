import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import axios from "axios";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["quote"];
  public description = "Gửi một câu trích dẫn ngẫu nhiên";
  public category = "Utils";
  public accessableby = data.COMMANDS_ACCESS.UTILS.Quotes;
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    try {
      await handler.SilentDeferReply();

      // Lấy một câu trích dẫn ngẫu nhiên từ API
      const response = await axios.get(`https://api.api-ninjas.com/v1/quotes`, {
        headers: {
          "X-Api-Key": client.config.utilities.CatAndQuotes.ApiKey,
        },
      });

      if (response.data && response.data.length > 0) {
        const quoteData = response.data[0];

        const quoteEmbed = new EmbedBuilder()
          .setTitle("Trích dẫn ngẫu nhiên")
          .setColor(client.color_main)
          .setDescription(`❝**${quoteData.quote} • Bởi ${quoteData.author}**❞`)
          .setFooter({ text: `Danh mục: ${quoteData.category.toUpperCase()}` });

        await handler.editReply({
          embeds: [quoteEmbed],
        });
      } else {
        client.logger.warn("Quotes", "Định dạng phản hồi API không hợp lệ");
        await handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(
                  handler.language,
                  "commands.utils",
                  "quote_error"
                )}`
              )
              .setColor(client.color_main),
          ],
        });
      }
    } catch (error) {
      client.logger.warn("Quotes", "Lỗi khi lấy trích dẫn, kiểm tra API KEY");
      await handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.utils",
                "quote_error"
              )}`
            )
            .setColor(client.color_main),
        ],
      });
    }
  }
}
