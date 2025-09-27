import { EmbedBuilder, Message, TextChannel } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { logInfo, logWarn, logError } from "../../utilities/Logger.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["update"];
  public description = "Gửi thông báo cập nhật cho bot";
  public category = "Admin";
  public accessableby = data.COMMANDS_ACCESS.ADMIN.Update;
  public usage = "[description]";
  public aliases = ["up"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    try {
      await handler.deferReply();

      const channelToSendId = client.config.logchannel.UpdateChannelId;
      
      // Kiểm tra xem channel ID có được cấu hình không
      if (!channelToSendId || channelToSendId === "ID KÊNH CẬP NHẬT") {
        const embed = new EmbedBuilder()
          .setColor(client.color_main)
          .setDescription(client.i18n.get(handler.language, "client.commands", "admin.update_channel_not_configured"));
        return await handler.editReply({ embeds: [embed] });
      }

      const channelToSend = client.channels.cache.get(channelToSendId) as TextChannel | undefined;

      if (!channelToSend) {
        const embed = new EmbedBuilder()
          .setColor(client.color_main)
          .setDescription(client.i18n.get(handler.language, "client.commands", "admin.update_channel_not_found", {
            channelId: channelToSendId
          }));
        return await handler.editReply({ embeds: [embed] });
      }

      // Kiểm tra quyền của bot trong channel
      const botMember = channelToSend.guild.members.cache.get(client.user!.id);
      if (!botMember || !channelToSend.permissionsFor(botMember)?.has(['SendMessages', 'ViewChannel'])) {
        const embed = new EmbedBuilder()
          .setColor(client.color_main)
          .setDescription(client.i18n.get(handler.language, "client.commands", "admin.update_no_permissions", {
            channelName: channelToSend.name
          }));
        return await handler.editReply({ embeds: [embed] });
      }

      const filter = (msg: Message) => msg.author.id === handler.user?.id;
      const embed = new EmbedBuilder()
        .setColor(client.color_main)
        .setDescription(client.i18n.get(handler.language, "client.commands", "admin.update_provide_desc")); // Mô tả lấy từ i18n

      await handler.editReply({ embeds: [embed] });

      const collector = (handler?.channel! as TextChannel).createMessageCollector({
        filter,
        time: 60000,
        max: 1,
      });

      collector?.on("collect", async (msg: Message<boolean>): Promise<void> => {
        try {
          if (!msg.content) {
            const embed = new EmbedBuilder()
              .setColor(client.color_main)
              .setDescription(
                `${client.i18n.get(handler.language, "client.commands", "admin.update_cancelled")}`
              );
            await handler.editReply({ embeds: [embed] });
            return;
          }

          const description = msg.content.replace(/\\n/g, "\n").replace(/\\n\\n/g, "\n\n");

          if (description.length > 2000) {
            const embed = new EmbedBuilder()
              .setColor(client.color_main)
              .setDescription(
                `${client.i18n.get(handler.language, "client.commands", "admin.update_length_exceeded")}`
              );
            await handler.editReply({ embeds: [embed] });

            // Xóa tin nhắn do người dùng gửi sau khi họ trả lời
            await msg.delete();

            return;
          }

          const sentMessage = await channelToSend.send(description);
          
          // Log success
          logInfo("Update Command", client.i18n.get(handler.language, "client.commands", "admin.update_log_success", {
            channelName: channelToSend.name,
            channelId: channelToSend.id
          }));
          
          const embed = new EmbedBuilder()
            .setColor(client.color_main)
            .setDescription(
              `✅ ${client.i18n.get(handler.language, "client.commands", "admin.update_success")}\n` +
              `📤 **Kênh:** ${channelToSend.name}\n` +
              `🔗 **Link:** [Xem tin nhắn](${sentMessage.url})`
            );
          await handler.editReply({ embeds: [embed] });

          // Xóa tin nhắn do người dùng gửi
          await msg.delete().catch(() => {
            logWarn("Update Command", client.i18n.get(handler.language, "client.commands", "admin.update_log_delete_failed"));
          });
        } catch (err) {
          logError("Update Command", client.i18n.get(handler.language, "client.commands", "admin.update_log_send_error", {
            error: err instanceof Error ? err.message : "Unknown error"
          }));
          const embed = new EmbedBuilder()
            .setColor(client.color_main)
            .setDescription(
              `❌ ${client.i18n.get(handler.language, "client.commands", "admin.update_failure")}\n` +
              `📝 **Chi tiết:** ${err instanceof Error ? err.message : "Lỗi không xác định"}`
            );
          await handler.editReply({ embeds: [embed] });
        }
      });

      collector?.on("end", (collected, reason): void => {
        if (reason === "time") {
          const embed = new EmbedBuilder()
            .setColor(client.color_main)
            .setDescription(
              client.i18n.get(handler.language, "client.commands", "admin.update_timeout_failure")
            );

          handler.editReply({ embeds: [embed] });
        }
        // @ts-ignore
        collector?.removeAllListeners();
      });
    } catch (error) {
      logError("Update Command", client.i18n.get(handler.language, "client.commands", "admin.update_log_general_error", {
        error: error instanceof Error ? error.message : "Unknown error"
      }));

      const embed = new EmbedBuilder()
        .setColor(client.color_main)
        .setDescription(
          `❌ ${client.i18n.get(handler.language, "client.commands", "admin.update_failure")}\n` +
          `📝 **Chi tiết:** ${error instanceof Error ? error.message : "Lỗi không xác định"}`
        );

      await handler.editReply({ embeds: [embed] }).catch(() => {
        logError("Update Command", client.i18n.get(handler.language, "client.commands", "admin.update_log_reply_error"));
      });
    }
  }
}
