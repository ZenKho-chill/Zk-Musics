import {
  Typing,
  EmbedBuilder,
  Guild,
  TextChannel,
  NewsChannel,
  ThreadChannel,
  VoiceChannel,
} from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class TypingEventsHandler {
  private client: Manager;
  private typingTimers: Map<string, NodeJS.Timeout>;

  constructor(client: Manager) {
    this.client = client;
    this.typingTimers = new Map();
    this.init();
  }

  private init() {
    this.client.on("typingStart", this.handleTypingStart.bind(this));
  }

  // Xử lý sự kiện bắt đầu gõ
  private async handleTypingStart(typing: Typing) {
    const channel = typing.channel;
    const user = typing.user;
    if (channel.isTextBased() && "guild" in channel) {
      const guild = (
        channel as TextChannel | NewsChannel | ThreadChannel | VoiceChannel
      ).guild;
      if (!(await isEventEnabled(guild.id, "typingStart", this.client.db)))
        return;

      const logChannel = await getModLogChannel(guild.id, this.client);
      if (!logChannel) return;

      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("⌨️ Bắt đầu gõ")
            .setDescription(
              `**Người dùng:** <@${user.id}> bắt đầu gõ ở <#${channel.id}>.`
            )
            .setTimestamp(new Date()),
        ],
      });
      if (this.typingTimers.has(user.id)) {
        clearTimeout(this.typingTimers.get(user.id)!);
      }
      this.typingTimers.set(
        user.id,
        setTimeout(async () => {
          await this.handleTypingStop(typing);
        }, 10000)
      );
    } else {
      this.client.logger.info(
        TypingEventsHandler.name,
        `${user.username} đã bắt đầu gõ trong DM.`
      );
    }
  }

  // Xử lý giả lập sự kiện dừng gõ
  private async handleTypingStop(typing: Typing) {
    const channel = typing.channel;
    const user = typing.user;
    if (channel.isTextBased() && "guild" in channel) {
      const guild = (
        channel as TextChannel | NewsChannel | ThreadChannel | VoiceChannel
      ).guild;
      if (!(await isEventEnabled(guild.id, "typingStop", this.client.db)))
        return;

      const logChannel = await getModLogChannel(guild.id, this.client);
      if (!logChannel) return;
      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff4500)
            .setTitle("⌨️ Dừng gõ")
            .setDescription(
              `**Người dùng:** <@${user.id}> đã dừng gõ ở <#${channel.id}>.`
            )
            .setTimestamp(new Date()),
        ],
      });
      this.typingTimers.delete(user.id);
    }
  }
}
