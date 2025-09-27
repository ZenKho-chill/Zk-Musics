import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { ApplicationCommandOptionType, EmbedBuilder, WebhookClient } from "discord.js";
import moment from "moment";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
const data: Config = new ConfigData().data;

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

      const RatingChannelID = client.config.logchannel.RatingChannelID;

      // Tạo Embed cho lỗi
      const errorEmbed = new EmbedBuilder()
        .setColor(client.color_main)
        .setDescription(`${client.i18n.get(handler.language, "client.commands.info", "rating_failure")}`);

      if (!RatingChannelID || RatingChannelID.length === 0) {
        // Nếu RatingChannelID không được cấu hình
        return handler.editReply({ embeds: [errorEmbed] });
      }

      const channel = await client.channels.fetch(RatingChannelID).catch(() => undefined);

      if (!channel || (channel && !channel.isTextBased())) {
        // Nếu kênh không tồn tại hoặc không phải kênh văn bản
        return handler.editReply({ embeds: [errorEmbed] });
      }

      const rating = handler.args[0];
      const category = handler.args[1];
      const description = handler.args[2] || client.i18n.get(handler.language, "client.commands.info", "rating_no_description");

      if (!rating || !category || !description) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(handler.language, "client.commands.info", "rating_failure", {
                  prefix: client.prefix,
                })}`
              )
              .setColor(client.color_main),
          ],
        });
      }

      const RatingEmbed = new EmbedBuilder()
        .setAuthor({
          name: `${handler.user?.displayName} | ${client.i18n.get(handler.language, "client.commands.info", "rating_embed_author")}`,
          iconURL: handler.user?.displayAvatarURL(),
        })
        .setDescription(
          `${client.i18n.get(handler.language, "client.commands.info", "rating_desc", {
            rating: rating,
            user:
              `<@${handler.user?.id ?? ""}>` ||
              handler.user?.displayName ||
              "Người dùng không xác định",
          })}`
        )
        .addFields(
          {
            name: client.i18n.get(handler.language, "client.commands.info", "rating_field_rating"),
            value: rating,
            inline: true,
          },
          {
            name: client.i18n.get(handler.language, "client.commands.info", "rating_field_category"),
            value: category,
            inline: true,
          },
          {
            name: client.i18n.get(handler.language, "client.commands.info", "rating_field_time"),
            value: `\`${moment(new Date()).format("dddd, Do MMMM YYYY")}\``,
            inline: true,
          },
          {
            name: client.i18n.get(handler.language, "client.commands.info", "rating_field_description"),
            value: `\`\`\`${description}\`\`\``,
            inline: false,
          }
        )
        .setColor(client.color_main);

      // Gửi Embed tới kênh
      (channel as any).send({ embeds: [RatingEmbed] });

      const successEmbed = new EmbedBuilder()
        .setColor(client.color_main)
        .setDescription(`${client.i18n.get(handler.language, "client.commands.info", "rating_succes")}`);
      handler.editReply({ embeds: [successEmbed] });
    } catch (error) {
      logWarn("Rating", client.i18n.get(handler.language, "client.commands.info", "rating_log_error"));
      const errorEmbed = new EmbedBuilder()
        .setColor(client.color_main)
        .setDescription(`${client.i18n.get(handler.language, "client.commands.info", "rating_failure")}`);

      handler.editReply({ embeds: [errorEmbed] });
    }
  }
}
