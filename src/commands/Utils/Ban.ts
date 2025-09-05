import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
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
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["ban"];
  public description = "Ban a user from the server";
  public category = "Utils";
  public accessableby = data.COMMANDS_ACCESS.UTILS.Ban;
  public usage = "<mention>";
  public aliases = [];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [PermissionFlagsBits.BanMembers];
  public options = [
    {
      name: "user",
      description: "Nhập người dùng cần cấm",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "reason",
      description: "Lý do cấm (tùy chọn)",
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
    const memberToBan = guild.members.cache.get(targetUser.id);
    const targetUserRolePosition = (memberToBan?.roles as GuildMemberRoleManager)?.highest.position;
    const requestUserRolePosition = (handler.interaction.member?.roles as GuildMemberRoleManager)
      ?.highest.position;
    const botMember = await guild.members.fetch(client.user!.id);
    const botRolePosition = botMember?.roles.highest?.position;

    if (!memberToBan) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.utils", "ban_user_not_found", {
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
              `${client.i18n.get(handler.language, "commands.utils", "ban_user_ownerid", {
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
              `${client.i18n.get(handler.language, "commands.utils", "ban_user_higher_role")}`
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
              `${client.i18n.get(handler.language, "commands.utils", "ban_bot_higher_role")}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    if (!memberToBan.bannable) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.utils", "ban_error", {
                user: `<@${targetUser.id}>`,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    await memberToBan.ban({ reason: reason });

    // Gửi tin nhắn cho người dùng bị cấm
    try {
      await targetUser.send({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.utils", "ban_success_dm", {
                moderator: `<@${handler.user!.id}>`,
                guild: guild.name,
                reason: reason || "No reason provided",
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    } catch (error) {
      client.logger.info("Ban", `Không thể gửi DM cho người dùng bị cấm ${targetUser.displayName}`);
    }

    handler.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${client.i18n.get(handler.language, "commands.utils", "banned_success", {
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
