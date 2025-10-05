import {
  APIEmbedField,
  ApplicationCommandOptionType,
  EmbedBuilder,
  WebhookClient,
} from "discord.js";
import moment from "moment";
import { Accessableby, Command } from "../../structures/Command.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Premium } from "../../database/schema/Premium.js";
import { GuildPremium } from "../../database/schema/GuildPremium.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = ConfigData.getInstance().data;

export default class implements Command {
  public name = ["premium", "redeem"];
  public description = "Đổi mã Premium";
  public category = "Admin";
  public accessableby = data.COMMANDS_ACCESS.ADMIN.PremiumReedem;
  public usage = "<type> <id> <mã>";
  public aliases = [];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "type",
      description: "Bạn muốn đổi cho loại nào?",
      required: true,
      type: ApplicationCommandOptionType.String,
      choices: [
        {
          name: "Người dùng",
          value: "user",
        },
        {
          name: "Máy chủ",
          value: "guild",
        },
      ],
    },
    {
      name: "id",
      description: "ID của người dùng hoặc máy chủ",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "code",
      description: "Mã bạn muốn đổi",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const availableModes = this.options[0].choices!.map((data) => data.value);
    const type = handler.args[0];
    const targetId = handler.args[1]?.trim();
    const input = handler.args[2]?.trim();

    if (!type || !availableModes.includes(type)) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color_main)
            .setDescription(
              `${client.i18n.get(handler.language, "commands.admin", "redeem_invalid_mode")}`
            ),
        ],
      });
    }

    if (!input || !targetId) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color_main)
            .setDescription(
              `${client.i18n.get(handler.language, "commands.admin", "redeem_invalid")}`
            ),
        ],
      });
    }

    // Kiểm tra xem ID đích có phù hợp với loại không
    let target;
    if (type === "guild") {
      try {
        target = await client.guilds.fetch(targetId);
      } catch {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color_main)
              .setDescription(
                `${client.i18n.get(handler.language, "commands.admin", "redeem_invalid_guild")}`
              ),
          ],
        });
      }
    } else {
      try {
        target = await client.users.fetch(targetId);
      } catch {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color_main)
              .setDescription(
                `${client.i18n.get(handler.language, "commands.admin", "redeem_invalid_user")}`
              ),
          ],
        });
      }
    }

    let preData;
    if (type === "guild") {
      preData = await client.db.preGuild.get(targetId);
    } else {
      preData = await client.db.premium.get(targetId);
    }

    if (preData && preData.isPremium) {
      const embed = new EmbedBuilder()
        .setColor(client.color_main)
        .setDescription(
          `${client.i18n.get(
            handler.language,
            "commands.admin",
            type === "guild" ? "redeem_already_guild" : "redeem_already"
          )}`
        );
      return handler.editReply({ embeds: [embed] });
    }

    const premium = await client.db.code.get(`${input.toUpperCase()}`);

    if (!premium) {
      const embed = new EmbedBuilder()
        .setColor(client.color_main)
        .setDescription(`${client.i18n.get(handler.language, "commands.admin", "redeem_invalid")}`);
      return handler.editReply({ embeds: [embed] });
    }

    if (premium.expiresAt !== "lifetime" && premium.expiresAt < Date.now()) {
      const embed = new EmbedBuilder()
        .setColor(client.color_main)
        .setDescription(`${client.i18n.get(handler.language, "commands.admin", "redeem_invalid")}`);
      return handler.editReply({ embeds: [embed] });
    }

    const expires =
      premium.expiresAt !== "lifetime"
        ? `<t:${Math.floor(moment(premium.expiresAt).valueOf() / 1000)}:F>`
        : "lifetime";

    const planFormatted =
      premium.expiresAt !== "lifetime"
        ? `<t:${Math.floor(moment(premium.expiresAt).valueOf() / 1000)}:R>`
        : "lifetime";

    const targetName =
      type === "guild"
        ? (await client.guilds.fetch(targetId))?.name || "Máy chủ không xác định"
        : (await client.users.fetch(targetId))?.username || "Người dùng không rõ";

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${client.i18n.get(handler.language, "commands.admin", "redeem_title")}`,
        iconURL: client.user!.displayAvatarURL(),
        url: `https://discord.com/oauth2/authorize?client_id=${
          client.user!.id
        }&permissions=8&scope=bot`,
      })
      .setDescription(
        `${client.i18n.get(handler.language, "commands.admin", "redeem_desc", {
          expires: premium.expiresAt !== "lifetime" ? expires : "lifetime",
          plan: `${planFormatted}`,
          type: type,
          name: targetName,
        })}`
      )
      .setFooter({
        text: `${client.i18n.get(handler.language, "commands.admin", "redeem_footer")}`,
      })
      .setColor(client.color_main);

    // Thiết lập trạng thái premium dựa trên loại
    if (type === "guild") {
      const targetGuild = await client.guilds.fetch(targetId);
      const owner = await targetGuild.fetchOwner();
      const newPreGuild = await client.db.preGuild.set(targetId, {
        id: targetGuild.id,
        isPremium: true,
        redeemedBy: {
          id: targetGuild.id,
          name: targetGuild.name,
          createdAt: targetGuild.createdAt.getTime(),
          GuildiconURL: targetGuild.iconURL({ size: 512 }) ?? null,
          ownerId: targetGuild.ownerId,
          ownerName: owner.user.username,
          ownerMention: `<@${targetGuild.ownerId}>`,
        },
        redeemedAt: Date.now(),
        expiresAt: premium.expiresAt,
        plan: premium.plan,
      });
      await handler.editReply({ embeds: [embed] });
      await client.db.code.delete(`${input.toUpperCase()}`);
      await this.sendRedeemLog(client, handler, null, newPreGuild, input, targetName, targetId);
    } else {
      const targetUser = await client.users.fetch(targetId);
      const newPreUser = await client.db.premium.set(targetId, {
        id: targetUser.id,
        isPremium: true,
        redeemedBy: {
          id: targetUser.id,
          username: targetUser.username,
          displayName: targetUser.displayName,
          avatarURL: targetUser.avatarURL() ?? null,
          createdAt: targetUser.createdAt.getTime(),
          mention: `<@${targetUser.id}>`,
        },
        redeemedAt: Date.now(),
        expiresAt: premium.expiresAt,
        plan: premium.plan,
      });
      await handler.editReply({ embeds: [embed] });
      await client.db.code.delete(`${input.toUpperCase()}`);
      await this.sendRedeemLog(
        client,
        handler,
        newPreUser,
        null,
        input,
        targetUser.username,
        targetId
      );
    }
  }

  protected async sendRedeemLog(
    client: Manager,
    handler: CommandHandler,
    premium: Premium | null,
    guildPremium: GuildPremium | null,
    code: string,
    targetName: string,
    targetId: string
  ): Promise<void> {
    // Log channel đã bị xóa - không gửi log
    const language = client.config.bot.LANGUAGE;

    const redeemedAt = premium ? premium.redeemedAt : guildPremium ? guildPremium.redeemedAt : 0;
    const expiresAt = premium ? premium.expiresAt : guildPremium ? guildPremium.expiresAt : 0;
    const plan = premium ? premium.plan : guildPremium ? guildPremium.plan : "zk@error";
    const planFormatted =
      expiresAt === "lifetime" ? "lifetime" : `<t:${Math.floor(expiresAt / 1000)}:R>`;

    const redeemedAtFormatted = redeemedAt
      ? `<t:${Math.floor(redeemedAt / 1000)}:F>`
      : "Không xác định";
    const expiresAtFormatted =
      expiresAt === "lifetime" ? "Trọn đời" : `<t:${Math.floor(expiresAt / 1000)}:F>`;

    const embedField: APIEmbedField[] = [
      {
        name: `${client.i18n.get(language, "commands.admin", "display_names")}`,
        value: `${targetName}`,
      },
      {
        name: "Mã ID",
        value: `${targetId}`,
      },
      {
        name: `${client.i18n.get(language, "commands.admin", "createdAt")}`,
        value: `<t:${Math.floor(
          (premium
            ? premium.redeemedBy.createdAt
            : guildPremium?.redeemedBy.createdAt || Date.now()) / 1000
        )}:F>`,
      },
      {
        name: `${client.i18n.get(language, "commands.admin", "redeemedAt")}`,
        value: `${redeemedAtFormatted}`,
      },
      {
        name: `${client.i18n.get(language, "commands.admin", "expiresAt")}`,
        value: `${expiresAtFormatted}`,
      },
      {
        name: `${client.i18n.get(language, "commands.admin", "plan")}`,
        value: `${planFormatted}`,
      },
      {
        name: `${client.i18n.get(language, "commands.admin", "code")}`,
        value: `${code}`,
      },
    ];

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${client.user!.username} Nhật ký đổi mã Premium!`,
        iconURL: client.user!.displayAvatarURL(),
        url: `https://discord.com/oauth2/authorize?client_id=${
          client.user!.id
        }&permissions=8&scope=bot`,
      })
      .setTitle(`${client.i18n.get(language, "commands.admin", premium ? "title" : "guild_title")}`)
      .addFields(embedField)
      .setTimestamp()
      .setColor(client.color_main);

    // Log channel đã bị xóa - không gửi embed
    return;
  }
}
