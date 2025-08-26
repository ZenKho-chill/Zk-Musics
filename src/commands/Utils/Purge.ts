import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  CommandInteractionOptionResolver,
  TextChannel,
  NewsChannel,
  MessageFlags,
} from "discord.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["purge"];
  public description = "Xóa tin nhắn hàng loạt trong kênh";
  public category = "Utils";
  public accessableby = data.COMMANDS_ACCESS.UTILS.Purge;
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [PermissionFlagsBits.ManageMessages];
  public options = [
    {
      name: "amount",
      description: "Số lượng tin nhắn muốn xóa (tối đa 99)",
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ];
  public async execute(client: Manager, handler: CommandHandler) {
    if (!handler.interaction) return;
    try {
      const amount = await (
        handler.interaction.options as CommandInteractionOptionResolver
      ).getInteger("amount");

      if (amount === null || isNaN(amount) || amount <= 0) {
        return handler.interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: client.i18n.get(
            handler.language,
            "commands.utils",
            "purge_invalid_amount"
          ),
        });
      }

      let msgAmount = Math.min(amount, 99); // Giới hạn msgAmount tới 99
      let channel = handler.interaction.channel;
      if (channel instanceof TextChannel || channel instanceof NewsChannel) {
        const messages = await channel.messages.fetch({ limit: msgAmount + 1 }); // Lấy các tin nhắn cần xóa
        const filteredMessages = messages.filter(
          (message) =>
            Date.now() - message.createdTimestamp < 14 * 24 * 60 * 60 * 1000
        ); // Lọc các tin nhắn cũ hơn 14 ngày
        await channel.bulkDelete(filteredMessages); // Xóa các tin nhắn
        await handler.interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: client.i18n.get(
            handler.language,
            "commands.utils",
            "purge_success",
            {
              amount: String(filteredMessages.size),
            }
          ),
        });
      }
    } catch (error) {
      client.logger.info("Purge", "Lỗi khi xóa tin nhắn");
      if (error === 50034) {
        return handler.interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: client.i18n.get(
            handler.language,
            "commands.utils",
            "purge_older_than_14_days"
          ),
        });
      } else {
        return handler.interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: client.i18n.get(
            handler.language,
            "commands.utils",
            "purge_error"
          ),
        });
      }
    }
  }
}
