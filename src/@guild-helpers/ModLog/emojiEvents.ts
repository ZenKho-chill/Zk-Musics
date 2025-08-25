import { GuildEmoji, PartialEmoji, EmbedBuilder } from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class EmojiEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on("emojiCreate", this.handleEmojiCreate.bind(this));
    this.client.on("emojiDelete", this.handleEmojiDelete.bind(this));
    this.client.on("emojiUpdate", this.handleEmojiUpdate.bind(this));
  }

  // Xử lý sự kiện tạo emoji
  private async handleEmojiCreate(emoji: GuildEmoji | PartialEmoji) {
    if (
      !("guild" in emoji) ||
      !(await isEventEnabled(emoji.guild.id, "emojiCreate", this.client.db))
    )
      return;

    const auditLogs = await emoji.guild.fetchAuditLogs({
      type: 60, // loại log 'Emoji Create'
      limit: 1,
    });

    const logEntry = auditLogs.entries.first();
    const executor = logEntry?.executor;

    const channel = await getModLogChannel(emoji.guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: `${executor?.username || "Không rõ"}`,
            iconURL: `${executor?.displayAvatarURL() || ""}`,
          })
          .setColor(0x32cd32)
          .setThumbnail(emoji.url || "")
          .setDescription(
            `😀 **Đã tạo emoji**\nEmoji \`:${emoji.name}:\` <:${emoji.name}:${emoji.id}> đã được tạo`
          )
          .addFields({
            name: "Các ID",
            value: `
              > <:${emoji.name}:${emoji.id}> \`(${emoji.id})\`
              > <@${executor?.id}> \`(${executor?.id})\``,
            inline: true,
          })
          .setFooter({
            text:
              this.client.user?.username || this.client.user?.tag || "Không rõ",
            iconURL:
              this.client.user?.displayAvatarURL() ||
              "https://raw.githubusercontent.com/ZenKho-chill/zkcard/main/build/structures/images/avatar.png",
          })
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý sự kiện xóa emoji
  private async handleEmojiDelete(emoji: GuildEmoji | PartialEmoji) {
    if (
      !("guild" in emoji) ||
      !(await isEventEnabled(emoji.guild.id, "emojiDelete", this.client.db))
    )
      return;

    const auditLogs = await emoji.guild.fetchAuditLogs({
      type: 62, // loại log 'Emoji Delete'
      limit: 1,
    });

    const logEntry = auditLogs.entries.first();
    const executor = logEntry?.executor;

    const channel = await getModLogChannel(emoji.guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: `${executor?.username || "Không rõ"}`,
            iconURL: `${executor?.displayAvatarURL() || ""}`,
          })
          .setColor(0xff4500)
          .setThumbnail(emoji.url || "")
          .setDescription(
            `😀 **Emoji đã bị xóa**\nEmoji \`:${emoji.name}:\` đã bị xóa`
          )
          .addFields({
            name: "Các ID",
            value: `
              > \`${emoji.name}\` \`(${emoji.id})\`
              > <@${executor?.id}> \`(${executor?.id})\``,
            inline: false,
          })
          .setFooter({
            text:
              this.client.user?.username || this.client.user?.tag || "Không rõ",
            iconURL:
              this.client.user?.displayAvatarURL() ||
              "https://raw.githubusercontent.com/ZenKho-chill/zkcard/main/build/structures/images/avatar.png",
          })
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý sự kiện cập nhật emoji
  private async handleEmojiUpdate(oldEmoji: GuildEmoji, newEmoji: GuildEmoji) {
    if (
      !("guild" in newEmoji) ||
      !(await isEventEnabled(newEmoji.guild.id, "emojiUpdate", this.client.db))
    )
      return;

    const auditLogs = await newEmoji.guild.fetchAuditLogs({
      type: 61, // loại log 'Emoji Update'
      limit: 1,
    });

    const logEntry = auditLogs.entries.first();
    const executor = logEntry?.executor;

    const changes: string[] = [];
    if (oldEmoji.name !== newEmoji.name) {
      changes.push(
        `😀 **Emoji đã được cập nhật**\nEmoji \`:${newEmoji.name}:\` <:${newEmoji.name}:${newEmoji.id}> đã được cập nhật`
      );
    }

    if (changes.length > 0) {
      const channel = await getModLogChannel(newEmoji.guild.id, this.client);
      if (!channel) return;

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: `${executor?.username || "Không rõ"}`,
              iconURL: `${executor?.displayAvatarURL() || ""}`,
            })
            .setColor(0x1e90ff)
            .setThumbnail(newEmoji.url || "")
            .setDescription(changes.join("\n"))
            .setFooter({
              text:
                this.client.user?.username ||
                this.client.user?.tag ||
                "Không rõ",
              iconURL:
                this.client.user?.displayAvatarURL() ||
                "https://raw.githubusercontent.com/ZenKho-chill/zkcard/main/build/structures/images/avatar.png",
            })
            .addFields(
              {
                name: "Tên",
                value: `> **${oldEmoji.name} ➡️ ${newEmoji.name}**`,
                inline: false,
              },
              {
                name: "Các ID",
                value: `
                > <:${newEmoji.name}:${newEmoji.id}> \`(${newEmoji.id})\`
                > <@${executor?.id}> \`(${executor?.id})\``,
                inline: false,
              }
            )
            .setTimestamp(new Date()),
        ],
      });
    }
  }
}
