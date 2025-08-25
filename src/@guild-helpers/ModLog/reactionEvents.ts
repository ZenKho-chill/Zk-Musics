import {
  Message,
  PartialMessage,
  MessageReaction,
  PartialMessageReaction,
  User,
  PartialUser,
  TextChannel,
  NewsChannel,
  EmbedBuilder,
} from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class ReactionEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on(
      "messageReactionAdd",
      this.handleMessageReactionAdd.bind(this)
    );
    this.client.on(
      "messageReactionRemove",
      this.handleMessageReactionRemove.bind(this)
    );
    this.client.on(
      "messageReactionRemoveAll",
      this.handleMessageReactionRemoveAll.bind(this)
    ); // Sự kiện đúng
  }

  // Xử lý khi có phản ứng được thêm
  private async handleMessageReactionAdd(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ) {
    if (!reaction.message.guild || !user) return;
    const guildId = reaction.message.guild.id;

    if (!(await isEventEnabled(guildId, "messageReactionAdd", this.client.db)))
      return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error("Không lấy được reaction:", error);
        return;
      }
    }

    if (user.partial) {
      try {
        await user.fetch();
      } catch (error) {
        console.error("Không lấy được user:", error);
        return;
      }
    }

    const channel = await getModLogChannel(guildId, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: user.username,
            iconURL: user.avatarURL(),
          })
          .setColor(0x00ff00)
          .setTitle("👍 Đã thêm phản ứng")
          .setDescription(
            `**Người dùng:** <@${user.id}> đã thêm phản ứng vào [tin nhắn này](https://discord.com/channels/${guildId}/${reaction.message.channelId}/${reaction.message.id})`
          )
          .addFields(
            { name: "Phản ứng", value: `${reaction.emoji.name}`, inline: true },
            {
              name: "Kênh",
              value: `<#${reaction.message.channelId}>`,
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

  // Xử lý khi phản ứng bị gỡ
  private async handleMessageReactionRemove(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ) {
    if (!reaction.message.guild || !user) return;
    const guildId = reaction.message.guild.id;

    if (
      !(await isEventEnabled(guildId, "messageReactionRemove", this.client.db))
    )
      return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error("Không lấy được reaction:", error);
        return;
      }
    }

    if (user.partial) {
      try {
        await user.fetch();
      } catch (error) {
        console.error("Không lấy được user:", error);
        return;
      }
    }

    const channel = await getModLogChannel(guildId, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: user.username,
            iconURL: user.displayAvatarURL(),
          })
          .setColor(0xff0000)
          .setTitle("👎 Phản ứng đã bị gỡ")
          .setDescription(
            `**Người dùng:** <@${user.id}> đã gỡ phản ứng khỏi [tin nhắn này](https://discord.com/channels/${guildId}/${reaction.message.channelId}/${reaction.message.id})`
          )
          .addFields(
            { name: "Phản ứng", value: `${reaction.emoji.name}`, inline: true },
            {
              name: "Kênh",
              value: `<#${reaction.message.channelId}>`,
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

  // Xử lý khi tất cả phản ứng trên 1 tin nhắn bị gỡ
  private async handleMessageReactionRemoveAll(
    message: Message<boolean> | PartialMessage
  ) {
    if (!message.guild) return;
    const guildId = message.guild.id;

    if (
      !(await isEventEnabled(
        guildId,
        "messageReactionRemoveAll",
        this.client.db
      ))
    )
      return;

    const channel = await getModLogChannel(guildId, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: message.author.username,
            iconURL: message.author.displayAvatarURL(),
          })
          .setColor(0xffa500)
          .setTitle("🚫 Tất cả phản ứng đã bị gỡ")
          .setDescription(
            `Tất cả phản ứng đã bị gỡ khỏi [tin nhắn này](https://discord.com/channels/${guildId}/${message.channelId}/${message.id})`
          )
          .addFields({
            name: "Kênh",
            value: `<#${message.channelId}>`,
            inline: true,
          })
          .setFooter({
            text:
              this.client.user?.username || this.client.user?.tag || "Không rõ",
            iconURL: this.client.user.displayAvatarURL(),
          })
          .setTimestamp(new Date()),
      ],
    });
  }
}
