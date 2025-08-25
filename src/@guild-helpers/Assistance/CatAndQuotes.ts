import { Manager } from "../../manager.js";
import axios from "axios";
import cron from "node-cron";
import { TextChannel, EmbedBuilder, AttachmentBuilder, Embed } from "discord.js";

export class CatAndQuotes {
  client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }

  async execute() {
    try {
      const getRandomCatAttachmentBuilder = async () => {
        try {
          const response = await axios.get("https://api.thecatapi.com/v1/images/search");
          const catImageUrl = response.data[0].url;
          const attachment = new AttachmentBuilder(catImageUrl, {
            name: "cat.png",
          });
          return attachment;
        } catch (error) {
          this.client.logger.console.error((CatAndQuotes.name, "Lỗi khi lấy ảnh mèo: " + error));
          return null;
        }
      };

      const getQuoteFromAPI = async () => {
        try {
          const response = await axios.get("https://api.api-ninjas.com/v1/quotes", {
            headers: {
              "X-Api-Key": this.client.config.utilities.CatAndQuotes.ApiKey,
            };
          });

          if (response.data && response.data.length > 0) {
            return response.data[0];
          } else {
            throw new Error("Không tìm thấy trích dẫn");
          }
        } catch (error) {
          this.client.logger.error(CatAndQuotes.name, "Lỗi khi lấy trích dẫn: " + error);
          return null;
        }
      };

      const executeRandomCatAndQuote = async () => {
        const catChannel = await this.client.channels.fetch(
          this.client.config.utilities.CatAndQuotes.CatChannelId
        );
        const quoteChannel = await this.client.channels.fetch(
          this.client.config.utilities.CatAndQuotes.QuoteChannelId
        );

        if (!catChannel || !quoteChannel) {
          this.client.logger.error(CatAndQuotes.name, "Không tìm thấy kênh");
          return;
        }

        try {
          const attachment = await getRandomCatAttachmentBuilder();
          const quoteInfo = await getQuoteFromAPI();

          if (attachment) {
            const catEmbed = new EmbedBuilder()
              .setColor(this.client.color_main)
              .setDescription("🐱 Meo Meo! Đây là ảnh mèo ngẫu nhiên cho bạn!")
              .setImage(`attachment://${attachment.name}`)
              .setFooter({
                text: "Yêu mèo thì nhớ ghé kênh meo meo nhé!",
              });

            await (catChannel as TextChannel).send({
              embeds: [catEmbed],
              files: [attachment],
            });
          }

          if (quoteInfo) {
            const { quote, author, category } = quoteInfo;

            const quoteEmbed = new EmbedBuilder()
              .setTitle("💬 Trích dẫn ngẫu nhiên cho bạn!")
              .setColor(this.client.color_main)
              .setDescription(`***${quote} • Bởi ${author}***`)
              .setFooter({ text: `Chủ đề: ${category.toUpperCase()}` } );
          }
        } catch (error) {
          this.client.logger.error(CatAndQuotes.name, "Lỗi khi gửi tin nhắn: " + error);
        }
      };

      cron.schedule(
        "0 0 12, 0 * * *",
        async () => {
          await executeRandomCatAndQuote();
        },
        {timezone: "Asia/Ho_Chi_Minh"}
      );
    } catch (error) {
      this.client.logger.warn(CatAndQuotes.name, "Lỗi không xác định: " + error);
    }
  }
}