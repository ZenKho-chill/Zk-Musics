import { Accessableby, Command } from "../../structures/Command.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Manager } from "../../manager.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  User,
  PermissionFlagsBits,
  CommandInteractionOptionResolver,
  GuildMemberRoleManager,
  ChatInputCommandInteraction,
} from "discord.js";
import { Config } from "../../@types/Config.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { ConfigData } from "../../services/ConfigData.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["kick"];
  public description = "Đuổi một người dùng khỏi máy chủ";
  public category = "Utils";
  public accessableby = data.COMMANDS_ACCESS.UTILS.Kick;
  public usage = "<mention>";
  public aliases = [];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [PermissionFlagsBits.KickMembers];
  public options = [
    {
      name: "user",
      description: "Nhập người dùng cần đuổi",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "reason",
      description: "Lý do bị đuổi (tùy chọn)",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    if (!handler.interaction) return;
    await handler.deferReply();
    const options = (handler.interaction as ChatInputCommandInteraction)
      .options as CommandInteractionOptionResolver;
    const targetUser = options.getUser("user") as User;
    const reason = (await options.getString("reason")) || "Không có lý do được cung cấp";

    const guild = handler.interaction.guild!;
    const memberToKick = guild.members.cache.get(targetUser.id);
    const targetUserRolePosition = (memberToKick?.roles as GuildMemberRoleManager)?.highest
      .position;
    const requestUserRolePosition = (handler.interaction.member?.roles as GuildMemberRoleManager)
      ?.highest.position;
    const botMember = await guild.members.fetch(client.user!.id);
    const botRolePosition = botMember?.roles.highest?.position;

    if (!memberToKick) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.utils", "kick_user_not_found", {
                user: `<@${targetUser.id}>`,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    if (targetUser.id === guild.ownerId) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.utils", "kick_user_ownerid", {
                user: `<@${targetUser.id}>`,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    if (targetUserRolePosition >= requestUserRolePosition) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.utils", "kick_user_higher_role")}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    if (targetUserRolePosition >= botRolePosition) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.utils", "kick_bot_higher_role")}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    if (!memberToKick.kickable) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.utils", "kick_error", {
                user: `<@${targetUser.id}>`,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    await memberToKick.kick(reason);

    // Gửi tin nhắn cho người dùng bị đuổi
    try {
      await targetUser.send({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.utils", "kick_success_dm", {
                moderator: `<@${handler.user!.id}>`,
                guild: guild.name,
                reason: reason || "Không có lý do được cung cấp",
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    } catch (error) {
      logInfo("Kick", `Không thể gửi DM cho người bị đuổi ${targetUser.displayName}`);
    }

    handler.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${client.i18n.get(handler.language, "commands.utils", "kick_success", {
              user: `<@${targetUser.id}>`,
              reason: reason || "Không có lý do được cung cấp",
              moderator: `<@${handler.user!.id}>`,
            })}`
          )
          .setColor(client.color_main),
      ],
    });
  }
}
