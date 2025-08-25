import {
  GuildMember,
  PartialGuildMember,
  Presence,
  EmbedBuilder,
  AuditLogEvent,
} from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class MemberEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on("guildMemberAdd", this.handleGuildMemberAdd.bind(this));
    this.client.on(
      "guildMemberRemove",
      this.handleGuildMemberRemove.bind(this)
    );
    this.client.on(
      "guildMemberUpdate",
      this.handleGuildMemberUpdate.bind(this)
    );
    this.client.on("guildMemberBoost", this.handleGuildMemberBoost.bind(this));
    this.client.on("presenceUpdate", this.handlePresenceUpdate.bind(this));
  }

  // Xử lý cập nhật trạng thái online (presence)
  private async handlePresenceUpdate(
    oldPresence: Presence | null,
    newPresence: Presence
  ) {
    const member = newPresence.member as GuildMember;
    if (
      !member ||
      !(await isEventEnabled(
        member.guild.id,
        "guildMemberOnlineStatusUpdate",
        this.client.db
      ))
    )
      return;

    const logChannel = await getModLogChannel(member.guild.id, this.client);
    if (!logChannel) return;

    const oldStatus = oldPresence?.status || "offline"; // mặc định 'offline' nếu không có presence trước
    const newStatus = newPresence.status;

    if (oldStatus !== newStatus) {
      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("🟢 Trạng thái đã thay đổi")
            .setDescription(
              `**Thành viên:** <@${member.id}> đã thay đổi trạng thái từ **${oldStatus}** sang **${newStatus}**.`
            )
            .setTimestamp(new Date()),
        ],
      });
    }
  }

  // Xử lý sự kiện thành viên tham gia
  private async handleGuildMemberAdd(member: GuildMember | PartialGuildMember) {
    if (
      !(await isEventEnabled(member.guild.id, "guildMemberAdd", this.client.db))
    )
      return;

    const channel = await getModLogChannel(member.guild.id, this.client);
    if (!channel) return;

    const memberInfo =
      member instanceof GuildMember
        ? `<@${member.id}> (${member.id})`
        : `${member.user.tag}`;
    const accountCreationTimestamp = `<t:${Math.floor(
      member.user.createdTimestamp / 1000
    )}:F>`;
    const accountCreationRelative = `<t:${Math.floor(
      member.user.createdTimestamp / 1000
    )}:R>`;
    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff00)
          .setAuthor({
            name: member.user.tag,
            iconURL: member.user.displayAvatarURL(),
          })
          .setThumbnail(
            member.user.displayAvatarURL({ size: 512 }) ||
              this.client.user?.displayAvatarURL({ size: 512 })
          )
          .setDescription(`📥 <@${member.id}> **đã tham gia máy chủ.**`)
          .addFields(
            {
              name: "Tạo tài khoản",
              value: `${accountCreationTimestamp} (${accountCreationRelative})`,
              inline: false,
            },
            {
              name: "Các ID",
              value: `> ${memberInfo}`,
              inline: false,
            }
          )
          .setFooter({
            text: this.client.user?.username || "Không rõ",
            iconURL:
              this.client.user?.displayAvatarURL() ||
              "https://raw.githubusercontent.com/ZenKho-chill/zkcard/main/build/structures/images/avatar.png",
          })
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý sự kiện thành viên rời
  private async handleGuildMemberRemove(
    member: GuildMember | PartialGuildMember
  ) {
    if (
      !(await isEventEnabled(
        member.guild.id,
        "guildMemberRemove",
        this.client.db
      ))
    )
      return;

    const channel = await getModLogChannel(member.guild.id, this.client);
    if (!channel) return;

    const memberInfo =
      member instanceof GuildMember
        ? `<@${member.id}> (${member.id})`
        : `${member.user.tag}`;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff4500)
          .setAuthor({
            name: member.user.tag,
            iconURL: member.user.displayAvatarURL(),
          })
          .setThumbnail(
            member.user.displayAvatarURL({ size: 512 }) ||
              this.client.user?.displayAvatarURL({ size: 512 })
          )
          .setDescription(`📤 <@${member.id}> **đã rời máy chủ.**`)
          .addFields({
            name: "Các ID",
            value: `> ${memberInfo}`,
            inline: true,
          })
          .setFooter({
            text: this.client.user?.username || "Không rõ",
            iconURL:
              this.client.user?.displayAvatarURL() ||
              "https://raw.githubusercontent.com/ZenKho-chill/zkcard/main/build/structures/images/avatar.png",
          })
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý sự kiện cập nhật thành viên
  private async handleGuildMemberUpdate(
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember
  ) {
    if (
      !(await isEventEnabled(
        newMember.guild.id,
        "guildMemberUpdate",
        this.client.db
      ))
    )
      return;

    const logChannel = await getModLogChannel(newMember.guild.id, this.client);
    if (!logChannel) return;

    // Theo dõi thay đổi nickname
    if (oldMember.nickname !== newMember.nickname) {
      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setAuthor({
              name: newMember.user.tag,
              iconURL: newMember.user.displayAvatarURL(),
            })
            .setThumbnail(
              newMember.user.displayAvatarURL({ size: 512 }) || null
            )
            .setDescription(
              `🔢 **Nickname đã thay đổi**\n ${
                oldMember.nickname || oldMember.user.username
              } ➡️ ${newMember.nickname || "Không có"}`
            )
            .addFields({
              name: "Các ID",
              value: `> <@${newMember.id}> (${newMember.id})`,
              inline: true,
            })
            .setFooter({
              text: this.client.user.username || this.client.user.tag,
              iconURL: this.client.user?.displayAvatarURL(),
            })
            .setTimestamp(new Date()),
        ],
      });
    }

    // Theo dõi thay đổi role (thêm / gỡ)
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    const addedRoles = newRoles.filter((role) => !oldRoles.has(role.id));
    const removedRoles = oldRoles.filter((role) => !newRoles.has(role.id));

    // Fetch audit logs for role updates
    const auditLogs = await newMember.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberRoleUpdate,
    });
    const entry = auditLogs.entries.first();
    const executor = entry?.executor;

    // Nếu có role được thêm,
    if (addedRoles.size > 0) {
      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x32cd32)
            .setAuthor({
              name: newMember.user.tag,
              iconURL: newMember.user.displayAvatarURL(),
            })
            .setThumbnail(
              newMember.user.displayAvatarURL({ size: 512 }) || null
            )
            .setDescription(
              `**Đã thêm role**\n+ ${addedRoles
                .map((role) => `<@&${role.id}>`)
                .join("\n+ ")}**`
            )
            .addFields({
              name: "Các ID",
              value: `
                > <@${newMember.id}> (${newMember.id})
                > <@${executor?.id}> (${executor?.id})`,
              inline: true,
            })
            .setFooter({
              text: this.client.user.username || this.client.user.tag,
              iconURL: this.client.user?.displayAvatarURL(),
            })
            .setTimestamp(new Date()),
        ],
      });
    }

    // Nếu có role bị gỡ
    if (removedRoles.size > 0) {
      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff4500)
            .setAuthor({
              name: newMember.user.username,
              iconURL: newMember.user.displayAvatarURL(),
            })
            .setThumbnail(
              newMember.user.displayAvatarURL({ size: 512 }) || null
            )
            .setDescription(
              `**Đã gỡ role**\n– ${removedRoles
                .map((role) => `<@&${role.id}>`)
                .join("\n- ")}**`
            )
            .addFields({
              name: "Các ID",
              value: `
                > <@${newMember.id}> (${newMember.id})
                > <@${executor?.id}> (${executor?.id})`,
              inline: true,
            })
            .setFooter({
              text: this.client.user.username || this.client.user.tag,
              iconURL: this.client.user?.displayAvatarURL(),
            })
            .setTimestamp(new Date()),
        ],
      });
    }
  }

  // Xử lý sự kiện boost máy chủ
  private async handleGuildMemberBoost(member: GuildMember) {
    if (
      !(await isEventEnabled(
        member.guild.id,
        "guildMemberBoost",
        this.client.db
      ))
    )
      return;

    const logChannel = await getModLogChannel(member.guild.id, this.client);
    if (!logChannel) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: member.user.tag,
            iconURL: member.user.displayAvatarURL(),
          })
          .setThumbnail(member.user.displayAvatarURL({ size: 512 }) || null)
          .setColor(0xff69b4)
          .setTitle("💎 Máy chủ đã được boost")
          .setDescription(
            `> **<@${member.id}> (${member.user.id}) đã boost máy chủ.**`
          )
          .setFooter({
            text: this.client.user.username || this.client.user.tag,
            iconURL: this.client.user?.displayAvatarURL(),
          })
          .setTimestamp(new Date()),
      ],
    });
  }
}
