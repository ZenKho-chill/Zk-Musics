import { EmbedBuilder, Message, TextChannel } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["update"];
  public description = "Gửi thông báo cập nhật cho bot";
  public category = "Admin";
  public accessableby = data.COMMANDS_ACCESS.ADMIN.Update;
  public usage = "[description]";
  public aliases = ["up"];
  public lavalink = true;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    try {
      await handler.deferReply();

      const channelToSendId = client.config.logchannel.UpdateChannelId;
      const channelToSend = client.channels.cache.get(channelToSendId) as TextChannel | undefined;

      if (!channelToSend) {
        throw new Error(`Không tìm thấy kênh với ID ${channelToSendId}.`);
      }

      const filter = (msg: Message) => msg.author.id === handler.user?.id;
      const embed = new EmbedBuilder()
        .setColor(client.color_main)
        .setDescription(client.i18n.get(handler.language, "commands.admin", "update_provide_desc")); // Mô tả lấy từ i18n

      const messagePrompt = await handler.editReply({ embeds: [embed] });

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
                `${client.i18n.get(handler.language, "commands.admin", "update_cancelled")}`
              );
            await handler.editReply({ embeds: [embed] });
            return;
          }

          const description = msg.content.replace(/\\n/g, "\n").replace(/\\n\\n/g, "\n\n");

          if (description.length > 2000) {
            const embed = new EmbedBuilder()
              .setColor(client.color_main)
              .setDescription(
                `${client.i18n.get(handler.language, "commands.admin", "update_length_exceeded")}`
              );
            await handler.editReply({ embeds: [embed] });

            // Xóa tin nhắn do người dùng gửi sau khi họ trả lời
            await msg.delete();

            return;
          }

          const sentMessage = await channelToSend.send(description);
          const embed = new EmbedBuilder()
            .setColor(client.color_main)
            .setDescription(
              `${client.i18n.get(handler.language, "commands.admin", "update_success")}`
            );
          await handler.editReply({ embeds: [embed] });

          // Xóa tin nhắn do người dùng gửi
          await msg.delete();
        } catch (err) {
          client.logger.warn(import.meta.url, `Không thể gửi tin nhắn cập nhật`);
          const embed = new EmbedBuilder()
            .setColor(client.color_main)
            .setDescription(
              `${client.i18n.get(handler.language, "commands.admin", "update_failure")}`
            );
          await handler.editReply({ embeds: [embed] });
        }
      });

      collector?.on("end", (collected, reason): void => {
        if (reason === "time") {
          const embed = new EmbedBuilder()
            .setColor(client.color_main)
            .setDescription(
              client.i18n.get(handler.language, "commands.admin", "update_timeout_failure")
            );

          handler.editReply({ embeds: [embed] });
        }
        // @ts-ignore
        collector?.removeAllListeners();
      });
    } catch (error) {
      client.logger.warn("Update", `Không thể gửi thông báo cập nhật`);

      const embed = new EmbedBuilder()
        .setColor(client.color_main)
        .setDescription(
          `${client.i18n.get(handler.language, "commands.admin", "update_timeout_failure")}`
        );

      await handler.editReply({ embeds: [embed] });
    }
  }
}
