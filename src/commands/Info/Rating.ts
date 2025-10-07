import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { ApplicationCommandOptionType, EmbedBuilder, WebhookClient } from "discord.js";
import moment from "moment";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
// Log đã bị xóa - import Logger đã bị loại bỏ
const data: Config = ConfigData.getInstance().data;

export default class implements Command {
  public name = ["rating"];
  public description = "Đánh giá của bot";
  public category = "Info";
  public accessableby = data.COMMANDS_ACCESS.INFO.Rating;
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "rated",
      description: "Chọn đánh giá bạn muốn gửi",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "⭐⭐⭐⭐⭐", value: "⭐⭐⭐⭐⭐" },
        { name: "⭐⭐⭐⭐", value: "⭐⭐⭐⭐" },
        { name: "⭐⭐⭐", value: "⭐⭐⭐" },
        { name: "⭐⭐", value: "⭐⭐" },
        { name: "⭐", value: "⭐" },
      ],
    },
    {
      name: "category",
      description: "Chọn danh mục cho đánh giá",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Chất lượng âm thanh", value: "Audio Quality" },
        { name: "Độ phản hồi", value: "Responsiveness" },
        { name: "Tính năng", value: "Features" },
        { name: "Giao diện người dùng (UI)", value: "User Interface (UI)" },
        { name: "Độ ổn định", value: "Stability" },
        { name: "Hỗ trợ và Bảo trì", value: "Support and Maintenance" },
        { name: "Hiệu suất", value: "Performance" },
        { name: "Hài lòng người dùng", value: "User Satisfaction" },
      ],
    },
    {
      name: "description",
      description: "Nội dung mô tả cho đánh giá",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    try {
      if (!handler.interaction) return;
      await handler.deferReply();

      // Sử dụng kênh hiện tại thay vì RatingChannelID đã bị xóa
      const channel = handler.channel;

      // Tạo Embed cho lỗi
      const errorEmbed = new EmbedBuilder()
        .setColor(client.color_main)
        .setDescription(`${client.i18n.get(handler.language, "commands.info", "rating_failure")}`);

      // Log channel đã bị xóa - sử dụng kênh hiện tại để gửi đánh giá

      if (!channel || (channel && !channel.isTextBased())) {
        // Nếu kênh không tồn tại hoặc không phải kênh văn bản
        return handler.editReply({ embeds: [errorEmbed] });
      }

      const rating = handler.args[0];
      const category = handler.args[1];
      const description = handler.args[2] || "Không có mô tả";

      if (!rating || !category || !description) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(handler.language, "commands.info", "rating_failure", {
                  prefix: client.prefix,
                })}`
              )
              .setColor(client.color_main),
          ],
        });
      }

      const RatingEmbed = new EmbedBuilder()
        .setAuthor({
          name: `${handler.user?.displayName} | Đánh giá!`,
          iconURL: handler.user?.displayAvatarURL(),
        })
        .setDescription(
          `${client.i18n.get(handler.language, "commands.info", "rating_desc", {
            rating: rating,
            user:
              `<@${handler.user?.id ?? ""}>` ||
              handler.user?.displayName ||
              "Người dùng không xác định",
          })}`
        )
        .addFields(
          {
            name: `Đánh giá`,
            value: rating,
            inline: true,
          },
          {
            name: `Danh mục`,
            value: category,
            inline: true,
          },
          {
            name: `Thời gian`,
            value: `\`${moment(new Date()).format("dddd, Do MMMM YYYY")}\``,
            inline: true,
          },
          {
            name: `Mô tả`,
            value: `\`\`\`${description}\`\`\``,
            inline: false,
          }
        )
        .setColor(client.color_main);

      // Gửi Embed tới kênh
      (channel as any).send({ embeds: [RatingEmbed] });

      const successEmbed = new EmbedBuilder()
        .setColor(client.color_main)
        .setDescription(`${client.i18n.get(handler.language, "commands.info", "rating_succes")}`);
      handler.editReply({ embeds: [successEmbed] });
    } catch (error) {
      // Log đã bị xóa - Cảnh báo lỗi khi thực thi lệnh Rating
      const errorEmbed = new EmbedBuilder()
        .setColor(client.color_main)
        .setDescription(`${client.i18n.get(handler.language, "commands.info", "rating_failure")}`);

      handler.editReply({ embeds: [errorEmbed] });
    }
  }
}
