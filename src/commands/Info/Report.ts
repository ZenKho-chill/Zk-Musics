import { EmbedBuilder, Attachment, ApplicationCommandOptionType } from "discord.js";
import moment from "moment";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["report"];
  public description = "Gửi báo cáo lỗi tới kênh hỗ trợ";
  public category = "Info";
  public accessableby = data.COMMANDS_ACCESS.INFO.Report;
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public options = [
    {
      name: "description",
      description: "Nội dung báo cáo lỗi của bạn",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "images",
      description: "Hình ảnh đính kèm cho báo cáo (nếu có)",
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

      const BugReportChannelID = client.config.logchannel.BugReportChannelID;

      if (!BugReportChannelID || BugReportChannelID.length === 0) {
        // Nếu BugReportChannelID không được cấu hình
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color_main)
              .setDescription(
                `${client.i18n.get(handler.language, "client.commands.info", "report_failure")}`
              ),
          ],
        });
      }

      const channel = await client.channels.fetch(BugReportChannelID).catch(() => undefined);
      if (!channel || !channel.isTextBased()) {
        // Nếu kênh không tồn tại hoặc không phải kênh văn bản
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color_main)
              .setDescription(
                `${client.i18n.get(handler.language, "client.commands.info", "report_failure")}`
              ),
          ],
        });
      }

      const images: Attachment = handler.attactments[0] || null;
      const description = handler.args.join(" ");

      if (!description || description.length === 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor(client.color_main)
          .setDescription(
            `${client.i18n.get(handler.language, "client.commands.info", "report_provide_desc")}`
          );
        await handler.editReply({
          embeds: [errorEmbed],
        });
        return;
      }

      const truncatedDescription =
        description.length > 2048 ? description.slice(0, 2045) + "..." : description;

      const reportEmbed = new EmbedBuilder()
        .setAuthor({
          name: `${handler.user?.displayName} | Báo cáo!`,
          iconURL: handler.user?.displayAvatarURL(),
        })
        .setDescription(`**Mô tả**\n\`\`\`${truncatedDescription}\`\`\``)
        .addFields(
          {
            name: `Báo cáo bởi`,
            value:
              `<@${handler.user?.id ?? ""}>` ||
              handler.user?.displayName ||
              "Người dùng không xác định",
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
        const attachmentURL = images.url;
        reportEmbed.setImage(attachmentURL);
      }

      await (channel as any).send({ embeds: [reportEmbed] });

      const successEmbed = new EmbedBuilder()
        .setColor(client.color_main)
        .setDescription(`${client.i18n.get(handler.language, "client.commands.info", "report_success")}`);

      return handler.editReply({ embeds: [successEmbed] });
    } catch (error) {
      logWarn("Report", "Lỗi khi thực thi lệnh Report");
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color_main)
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands.info", "report_failure")}`
            ),
        ],
      });
    }
  }
}
