import { EmbedBuilder, Attachment, ApplicationCommandOptionType } from "discord.js";
import moment from "moment";
import { Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";


const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["suggestions"];
  public description = "Gửi gợi ý tới kênh hỗ trợ";
  public category = "Info";
  public accessableby = data.COMMANDS_ACCESS.INFO.Suggestions;
  public usage = "";
  public aliases = ["suggest", "sgt"];
  public lavalink = false;
  public options = [
    {
      name: "description",
      description: "Nội dung gợi ý cho bot",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "images",
      description: "Hình ảnh liên quan đến gợi ý (nếu có)",
      type: ApplicationCommandOptionType.Attachment,
      required: false,
    },
  ];
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    try {
      await handler.deferReply();

      // Sử dụng kênh hiện tại thay vì SuggestionChannelID đã bị xóa
      const channel = handler.channel;
      
      if (!channel || !channel.isTextBased()) {
        // Nếu kênh không tồn tại hoặc không phải kênh văn bản
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color_main)
              .setDescription(
                `${client.i18n.get(handler.language, "commands.info", "suggestions_failure")}`
              ),
          ],
        });
      }

      const images: Attachment = handler.attactments[0] || null;
      const description = handler.args.join(" ");

      if (!description || description.length === 0) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color_main)
              .setDescription(
                `${client.i18n.get(handler.language, "commands.info", "suggestions_provide_desc")}`
              ),
          ],
        });
      }

      const truncatedDescription =
        description.length > 2048 ? `${description.slice(0, 2045)}...` : description;

      const suggestionEmbed = new EmbedBuilder()
        .setAuthor({
          name: `${handler.user?.displayName} | Gợi ý!`,
          iconURL: handler.user?.displayAvatarURL(),
        })
        .setDescription(`**Mô tả**\n\`\`\`${truncatedDescription}\`\`\``)
        .addFields(
          {
            name: `Gợi ý bởi`,
            value:
              `<@${handler.user?.id}>` || handler.user?.displayName || "Người dùng không xác định",
            inline: true,
          },
          {
            name: `Thời gian`,
            value: `\`${moment(new Date()).format("dddd, Do MMMM YYYY")}\``,
            inline: true,
          }
        )
        .setColor(client.color_main);

      if (images && images.contentType === "image/png") {
        suggestionEmbed.setImage(images.url);
      }

      await (channel as any).send({ embeds: [suggestionEmbed] });

      const successEmbed = new EmbedBuilder()
        .setColor(client.color_main)
        .setDescription(
          `${client.i18n.get(handler.language, "commands.info", "suggestions_success")}`
        );

      return handler.editReply({ embeds: [successEmbed] });
    } catch (error) {
      // Log đã bị xóa - Cảnh báo lỗi khi thực thi lệnh suggestions
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color_main)
            .setDescription(
              `${client.i18n.get(handler.language, "commands.info", "suggestions_failure")}`
            ),
        ],
      });
    }
  }
}
