import { Invite, EmbedBuilder, AuditLogEvent } from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class InviteEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on("inviteCreate", this.handleInviteCreate.bind(this));
    this.client.on("inviteDelete", this.handleInviteDelete.bind(this));
  }

  // Xử lý tạo invite
  private async handleInviteCreate(invite: Invite) {
    if (!(await isEventEnabled(invite.guild?.id || "", "inviteCreate", this.client.db))) return;

    const channel = await getModLogChannel(invite.guild!.id, this.client);
    if (!channel) return;

    const creator = invite.inviter ? `<@${invite.inviter.id}>` : "Không rõ";
    const maxUses = invite.maxUses ? invite.maxUses : "Không giới hạn";
    const expiration = invite.expiresAt
      ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>`
      : "Không bao giờ";

    const inviterName = invite.inviter ? invite.inviter.username : "Không rõ";
    const inviterIcon = invite.inviter ? invite.inviter.displayAvatarURL() : undefined;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: inviterName,
            iconURL: inviterIcon,
          })
          .setColor(0x32cd32)
          .setTitle("Đã tạo invite")
          .addFields(
            { name: "Mã", value: invite.code, inline: true },
            { name: "Kênh", value: `<#${invite.channel!.id}>`, inline: true },
            { name: "Tạo bởi", value: creator, inline: true },
            {
              name: "Số lượt dùng tối đa",
              value: maxUses.toString(),
              inline: true,
            },
            { name: "Hết hạn", value: expiration, inline: true }
          )
          .setFooter({
            text: this.client.user?.username || this.client.user?.tag || "Không xác định",
            iconURL:
              this.client.user?.displayAvatarURL() ||
              "https://raw.githubusercontent.com/ZenKho-chill/zkcard/main/build/structures/images/avatar.png",
          })
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý xóa invite
  private async handleInviteDelete(invite: Invite) {
    if (!(await isEventEnabled(invite.guild?.id || "", "inviteDelete", this.client.db))) return;

    const channel = await getModLogChannel(invite.guild!.id, this.client);
    if (!channel) return;

    let executor: any = null;
    try {
      const auditLogs = await channel.guild.fetchAuditLogs({
        type: AuditLogEvent.InviteDelete,
        limit: 1,
      });
      const logEntry = auditLogs.entries.first();
      if (logEntry && logEntry.target?.code === invite.code) {
        executor = logEntry.executor;
      }
    } catch (error) {
      this.client.logger.error("handleInviteDelete", "Không thể lấy audit logs");
    }

    const executorName = executor ? executor.username : "Người dùng không rõ";
    const executorIcon = executor ? executor.displayAvatarURL() : undefined;
    const executorMention = executor ? `<@${executor.id}>` : "Không rõ";

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: executorName,
            iconURL: executorIcon,
          })
          .setColor(0xff4500)
          .setTitle("Invite đã bị xóa")
          .addFields(
            { name: "Mã", value: invite.code, inline: true },
            { name: "Kênh", value: `<#${invite.channel!.id}>`, inline: true },
            { name: "Xóa bởi", value: executorMention, inline: true }
          )
          .setFooter({
            text: this.client.user?.username || this.client.user?.tag || "Không xác định",
            iconURL:
              this.client.user?.displayAvatarURL() ||
              "https://raw.githubusercontent.com/ZenKho-chill/zkcard/main/build/structures/images/avatar.png",
          })
          .setTimestamp(new Date()),
      ],
    });
  }
}
