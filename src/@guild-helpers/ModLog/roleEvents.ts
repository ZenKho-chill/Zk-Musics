import { Role, AuditLogEvent, EmbedBuilder } from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class RoleEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on("roleCreate", this.handleRoleCreate.bind(this));
    this.client.on("roleDelete", this.handleRoleDelete.bind(this));
    this.client.on("roleUpdate", async (oldRole, newRole) => {
      await this.handleRoleUpdate(oldRole, newRole);
      await this.handleRolePermissionsUpdate(oldRole, newRole);
      await this.handleRoleMentionableUpdate(oldRole, newRole);
    });
  }

  // Xử lý sự kiện tạo role
  private async handleRoleCreate(role: Role) {
    if (!(await isEventEnabled(role.guild.id, "roleCreate", this.client.db)))
      return;

    const auditLogs = await role.guild.fetchAuditLogs({
      type: AuditLogEvent.RoleCreate,
    });
    const auditEntry = auditLogs.entries.first();
    const executor = auditEntry?.executor;

    const channel = await getModLogChannel(role.guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: executor?.username,
            iconURL: executor?.displayAvatarURL(),
          })
          .setColor(0x32cd32)
          .setTitle("➕ Đã tạo role")
          .setDescription(`**Role:** ${role.name} (${role.id})`)
          .addFields(
            { name: "Tạo bởi", value: `<@${executor?.id}>`, inline: true },
            { name: "Màu", value: `${role.hexColor}`, inline: true },
            {
              name: "Quyền",
              value: `${role.permissions.bitfield}`,
              inline: true,
            }
          )
          .setFooter({
            text:
              this.client.user?.username || this.client.user?.tag || "Không rõ",
            iconURL: this.client.user.displayAvatarURL(),
          })
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý sự kiện xoá role
  private async handleRoleDelete(role: Role) {
    if (!(await isEventEnabled(role.guild.id, "roleDelete", this.client.db)))
      return;

    const auditLogs = await role.guild.fetchAuditLogs({
      type: AuditLogEvent.RoleDelete,
    });
    const auditEntry = auditLogs.entries.first();
    const executor = auditEntry?.executor;

    const channel = await getModLogChannel(role.guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff4500)
          .setAuthor({
            name: executor?.username,
            iconURL: executor?.displayAvatarURL(),
          })
          .setTitle("➖ Đã xoá role")
          .setDescription(`**Role:** ${role.name} (${role.id})`)
          .addFields(
            { name: "Xoá bởi", value: `<@${executor?.id}>`, inline: true },
            { name: "Màu", value: `${role.hexColor}`, inline: true },
            {
              name: "Quyền",
              value: `${role.permissions.bitfield}`,
              inline: true,
            }
          )
          .setFooter({
            text:
              this.client.user?.username || this.client.user?.tag || "Không rõ",
            iconURL: this.client.user.displayAvatarURL(),
          })
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý sự kiện cập nhật role
  private async handleRoleUpdate(oldRole: Role, newRole: Role) {
    if (!(await isEventEnabled(newRole.guild.id, "roleUpdate", this.client.db)))
      return;

    const auditLogs = await newRole.guild.fetchAuditLogs({
      type: AuditLogEvent.RoleUpdate,
    });
    const auditEntry = auditLogs.entries.first();
    const executor = auditEntry?.executor;

    const channel = await getModLogChannel(newRole.guild.id, this.client);
    if (!channel) return;

    const changes = [];
    if (oldRole.name !== newRole.name) {
      changes.push(`**Tên:** ${oldRole.name} → ${newRole.name}`);
    }
    if (oldRole.hexColor !== newRole.hexColor) {
      changes.push(`**Màu:** ${oldRole.hexColor} → ${newRole.hexColor}`);
    }

    if (changes.length > 0) {
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: executor?.username,
              iconURL: executor?.displayAvatarURL(),
            })
            .setColor(0x1e90ff)
            .setTitle("🛠️ Role đã được cập nhật")
            .setDescription(changes.join("\n"))
            .addFields({
              name: "Cập nhật bởi",
              value: `<@${executor?.id}>`,
              inline: true,
            })
            .setFooter({
              text:
                this.client.user?.username ||
                this.client.user?.tag ||
                "Không rõ",
              iconURL: this.client.user.displayAvatarURL(),
            })
            .setTimestamp(new Date()),
        ],
      });
    }
  }

  // Xử lý cập nhật quyền của role
  private async handleRolePermissionsUpdate(oldRole: Role, newRole: Role) {
    if (
      !(await isEventEnabled(
        newRole.guild.id,
        "rolePermissionsUpdate",
        this.client.db
      ))
    )
      return;

    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
      const auditLogs = await newRole.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleUpdate,
      });
      const auditEntry = auditLogs.entries.first();
      const executor = auditEntry?.executor;

      const channel = await getModLogChannel(newRole.guild.id, this.client);
      if (!channel) return;

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: executor?.username,
              iconURL: executor?.displayAvatarURL(),
            })
            .setColor(0x1e90ff)
            .setTitle("🛠️ Quyền role đã được cập nhật")
            .setDescription(`**Role:** ${newRole.name}`)
            .addFields(
              {
                name: "Quyền cũ",
                value: oldRole.permissions.toArray().join(", "),
                inline: true,
              },
              {
                name: "Quyền mới",
                value: newRole.permissions.toArray().join(", "),
                inline: true,
              }
            )
            .setFooter({
              text:
                this.client.user?.username ||
                this.client.user?.tag ||
                "Không rõ",
              iconURL: this.client.user.displayAvatarURL(),
            })
            .setTimestamp(new Date()),
        ],
      });
    }
  }

  // Xử lý cập nhật trạng thái có thể mention của role
  private async handleRoleMentionableUpdate(oldRole: Role, newRole: Role) {
    if (
      !(await isEventEnabled(
        newRole.guild.id,
        "roleMentionableUpdate",
        this.client.db
      ))
    )
      return;

    if (oldRole.mentionable !== newRole.mentionable) {
      const auditLogs = await newRole.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleUpdate,
      });
      const auditEntry = auditLogs.entries.first();
      const executor = auditEntry?.executor;

      const channel = await getModLogChannel(newRole.guild.id, this.client);
      if (!channel) return;

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: executor?.username,
              iconURL: executor?.displayAvatarURL(),
            })
            .setColor(0x1e90ff) // màu xanh cho cập nhật
            .setTitle("🔧 Trạng thái có thể mention của role đã được cập nhật")
            .setDescription(`**Role:** ${newRole.name}`)
            .addFields(
              {
                name: "Trước đó (có thể mention)",
                value: oldRole.mentionable ? "Có" : "Không",
                inline: true,
              },
              {
                name: "Bây giờ (có thể mention)",
                value: newRole.mentionable ? "Có" : "Không",
                inline: true,
              }
            )
            .setFooter({
              text:
                this.client.user?.username ||
                this.client.user?.tag ||
                "Không rõ",
              iconURL: this.client.user.displayAvatarURL(),
            })
            .setTimestamp(new Date()),
        ],
      });
    }
  }
}
