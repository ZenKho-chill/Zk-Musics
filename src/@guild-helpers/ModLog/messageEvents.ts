import {
  Message,
  PartialMessage,
  EmbedBuilder,
  ReadonlyCollection,
  GuildTextBasedChannel,
  Snowflake,
  MessageReaction,
  User,
  PartialUser,
  PartialMessageReaction,
  AuditLogEvent,
} from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class MessageEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on("messageDelete", this.handleMessageDelete.bind(this));
    this.client.on("messageUpdate", this.handleMessageUpdate.bind(this));
    this.client.on("messageDeleteBulk", this.handleMessageDeleteBulk.bind(this));
    this.client.on("messageReactionAdd", this.handleMessageReactionAdd.bind(this));
    this.client.on("messageReactionRemove", this.handleMessageReactionRemove.bind(this));
    this.client.on("messagePinned", this.handleMessagePinned.bind(this));
    this.client.on("messageUnpinned", this.handleMessageUnpinned.bind(this));
  }

  // Xử lý việc xoá từng tin nhắn
  private async handleMessageDelete(message: Message<boolean> | PartialMessage) {
    if (!(await isEventEnabled(message.guild?.id || "", "messageDelete", this.client.db))) return;
    if (!message.guild || message.author?.bot) return;

    const logChannel = await getModLogChannel(message.guild.id, this.client);
    if (!logChannel) return;

    const content = message.partial
      ? "Nội dung tin nhắn không khả dụng (partial message)."
      : message.content || "Không có nội dung (có thể là embed hoặc tệp).";

    const embed = new EmbedBuilder()
      .setColor(0xff0000) // màu đỏ
      .setAuthor({
        name: `${message.author?.username || this.client.user?.username}`,
        iconURL: `${message.author?.displayAvatarURL() || this.client.user?.displayAvatarURL()}`,
      })
      .setTitle("🗑️ Tin nhắn đã bị xóa")
      .setDescription(content.slice(0, 1024))
      .addFields(
        {
          name: "Ngày tin nhắn",
          value: message.createdTimestamp
            ? `<t:${Math.floor(
                message.createdTimestamp / 1000
              )}:F> (<t:${Math.floor(message.createdTimestamp / 1000)}:R>)`
            : "Unknown",
          inline: false,
        },
        {
          name: "Các ID",
          value: `
  > Message (${message.id})
  > <#${message.channel.id}> (${message.channel.id})
  > <@${message.author?.id}> (${message.author?.id})
          `,
          inline: false,
        }
      )
      .setFooter({
        text: `${this.client.user?.username}`,
        iconURL: `${this.client.user?.displayAvatarURL()}`,
      })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  }

  // Xử lý xoá nhiều tin nhắn cùng lúc
  private async handleMessageDeleteBulk(
    messages: ReadonlyCollection<Snowflake, Message<boolean> | PartialMessage>,
    channel: GuildTextBasedChannel
  ) {
    const guild = channel.guild;
    if (!(await isEventEnabled(guild.id, "messageDeleteBulk", this.client.db))) return;

    const logChannel = await getModLogChannel(guild.id, this.client);
    if (!logChannel) return;

    const messageCount = messages.size;

    // Lấy Audit Log
    const auditLogs = await guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MessageBulkDelete,
    });
    const auditEntry = auditLogs.entries.first();

    const executor = auditEntry?.executor;
    const reason = auditEntry?.reason || "Không có lý do được cung cấp";

    // Gửi embed tới kênh log
    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff0000) // màu đỏ
          .setAuthor({
            name: executor?.username || this.client.user?.username || "Unknown",
            iconURL: executor?.displayAvatarURL() || this.client.user?.displayAvatarURL(),
          })
          .setTitle("🗑️ Nhiều tin nhắn đã bị xóa")
          .setDescription(`**${messageCount}** tin nhắn đã bị xóa ở <#${channel.id}>`)
          .addFields(
            { name: "Lý do", value: reason, inline: false },
            {
              name: "Các ID",
              value: `> <#${channel.id}> (${channel.id})\n> ${
                executor ? `<@${executor.id}>` : "Không rõ"
              } (${executor?.id || "Không rõ"})`,
              inline: true,
            }
          )
          .setFooter({
            text: `${this.client.user?.tag}`,
            iconURL: `${this.client.user?.displayAvatarURL()}`,
          })
          .setTimestamp(),
      ],
    });
  }

  // Xử lý cập nhật / chỉnh sửa tin nhắn
  private async handleMessageUpdate(
    oldMessage: Message<boolean> | PartialMessage,
    newMessage: Message<boolean> | PartialMessage
  ) {
    if (!(await isEventEnabled(oldMessage.guild?.id || "", "messageUpdate", this.client.db)))
      return;
    if (!oldMessage.guild || oldMessage.author?.bot) return;

    const logChannel = await getModLogChannel(oldMessage.guild.id, this.client);
    if (!logChannel) return;

    const oldContent = oldMessage.partial
      ? "Nội dung tin nhắn không khả dụng (partial message)."
      : oldMessage.content || "Không có nội dung";
    const newContent = newMessage.partial
      ? "Nội dung tin nhắn không khả dụng (partial message)."
      : newMessage.content || "Không có nội dung";

    if (oldContent === newContent) return;
    const messageLink = `https://discord.com/channels/${oldMessage.guild.id}/${oldMessage.channel.id}/${oldMessage.id}`;

    const embed = new EmbedBuilder()
      .setColor(0x1e90ff) // màu xanh dương
      .setAuthor({
        name: `${oldMessage.author?.tag || "Không rõ"}`,
        iconURL: `${oldMessage.author?.displayAvatarURL() || ""}`,
      })
      .addFields(
        {
          name: "📝 Tin nhắn đã chỉnh sửa",
          value: `${messageLink}`,
          inline: false,
        },
        {
          name: "Tin nhắn cũ",
          value: oldContent.slice(0, 1024),
          inline: false,
        },
        {
          name: "Tin nhắn mới",
          value: newContent.slice(0, 1024),
          inline: false,
        },
        {
          name: "Ngày tin nhắn",
          value: `<t:${Math.floor(
            oldMessage.createdTimestamp / 1000
          )}:F> (<t:${Math.floor(oldMessage.createdTimestamp / 1000)}:R>)`,
          inline: false,
        },
        {
          name: "Các ID",
          value: `
  > Message (${oldMessage.id})
  > <#${oldMessage.channel.id}> (${oldMessage.channel.id})
  > <@${oldMessage.author?.id}> (${oldMessage.author?.id})
          `,
          inline: false,
        }
      )
      .setFooter({
        text: `${this.client.user?.username || this.client.user?.tag}`,
        iconURL: `${this.client.user?.displayAvatarURL()}`,
      })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  }

  // Xử lý sự kiện thêm phản ứng vào tin nhắn (có partials)
  private async handleMessageReactionAdd(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ) {
    if (reaction.partial) await reaction.fetch(); // Lấy đầy đủ reaction nếu là partial
    if (user.partial) await user.fetch(); // Lấy đầy đủ user nếu là partial

    const guild = reaction.message.guild;
    if (!guild || !(await isEventEnabled(guild.id, "messageReactionAdd", this.client.db))) return;

    const logChannel = await getModLogChannel(guild.id, this.client);
    if (!logChannel) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x32cd32)
          .setAuthor({
            name: user?.username || this.client.user?.username || "Unknown",
            iconURL: user?.displayAvatarURL() || this.client.user?.displayAvatarURL(),
          })
          .setTitle("✅ Đã thêm phản ứng")
          .setDescription(
            `**Người dùng:** <@${user.id}> đã thêm phản ứng ở <#${reaction.message.channel.id}>`
          )
          .addFields({
            name: "Tin nhắn",
            value: `[Jump to Message](${reaction.message.url})`,
          })
          .setFooter({
            text: this.client.user?.username || this.client.user?.tag || "Không rõ",
            iconURL:
              this.client.user?.displayAvatarURL() ||
              "https://raw.githubusercontent.com/ZenKho-chill/zkcard/main/build/structures/images/avatar.png",
          })
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý sự kiện gỡ phản ứng khỏi tin nhắn (có partials)
  private async handleMessageReactionRemove(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ) {
    if (reaction.partial) await reaction.fetch(); // Lấy đầy đủ reaction nếu là partial
    if (user.partial) await user.fetch(); // Lấy đầy đủ user nếu là partial

    const guild = reaction.message.guild;
    if (!guild || !(await isEventEnabled(guild.id, "messageReactionRemove", this.client.db)))
      return;

    const logChannel = await getModLogChannel(guild.id, this.client);
    if (!logChannel) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff4500)
          .setAuthor({
            name: user?.username || this.client.user?.username || "Unknown",
            iconURL: user?.displayAvatarURL() || this.client.user?.displayAvatarURL(),
          })
          .setTitle("❌ Phản ứng đã bị xóa")
          .setDescription(
            `**Người dùng:** <@${user.id}> đã gỡ phản ứng ở <#${reaction.message.channel.id}>`
          )
          .addFields({
            name: "Tin nhắn",
            value: `[Jump to Message](${reaction.message.url})`,
          })
          .setFooter({
            text: this.client.user?.username || this.client.user?.tag || "Không rõ",
            iconURL:
              this.client.user?.displayAvatarURL() ||
              "https://raw.githubusercontent.com/ZenKho-chill/zkcard/main/build/structures/images/avatar.png",
          })
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý tin nhắn được ghim
  private async handleMessagePinned(message: Message<boolean> | PartialMessage) {
    const guild = message.guild;
    if (!guild || !(await isEventEnabled(guild.id, "messagePinned", this.client.db))) return;

    const logChannel = await getModLogChannel(guild.id, this.client);
    if (!logChannel) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: message.author?.username || this.client.user?.username || "Unknown",
            iconURL: message.author?.displayAvatarURL() || this.client.user?.displayAvatarURL(),
          })
          .setColor(0xffd700)
          .setTitle("📌 Tin nhắn đã được ghim")
          .setDescription(`Một tin nhắn trong <#${message.channel.id}> đã được ghim.`)
          .setFooter({
            text: this.client.user?.username || this.client.user?.tag || "Không rõ",
            iconURL:
              this.client.user?.displayAvatarURL() ||
              "https://raw.githubusercontent.com/ZenKho-chill/zkcard/main/build/structures/images/avatar.png",
          })
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý tin nhắn bị bỏ ghim
  private async handleMessageUnpinned(message: Message<boolean> | PartialMessage) {
    const guild = message.guild;
    if (!guild || !(await isEventEnabled(guild.id, "messageUnpinned", this.client.db))) return;

    const logChannel = await getModLogChannel(guild.id, this.client);
    if (!logChannel) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: message.author?.username || this.client.user?.username || "Unknown",
            iconURL: message.author?.displayAvatarURL() || this.client.user?.displayAvatarURL(),
          })
          .setColor(0xffd700)
          .setTitle("📌 Tin nhắn đã được bỏ ghim")
          .setDescription(`Một tin nhắn trong <#${message.channel.id}> đã được bỏ ghim.`)
          .setFooter({
            text: this.client.user?.username || this.client.user?.tag || "Không rõ",
            iconURL:
              this.client.user?.displayAvatarURL() ||
              "https://raw.githubusercontent.com/ZenKho-chill/zkcard/main/build/structures/images/avatar.png",
          })
          .setTimestamp(new Date()),
      ],
    });
  }
}
