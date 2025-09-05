import {
  NewsChannel,
  TextChannel,
  VoiceChannel,
  ForumChannel,
  MediaChannel,
  EmbedBuilder,
  Webhook,
} from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class WebhookEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on("webhookUpdate", this.handleWebhookUpdate.bind(this));
  }

  // Xử lý sự kiện cập nhật webhook
  private async handleWebhookUpdate(
    channel: NewsChannel | TextChannel | VoiceChannel | ForumChannel | MediaChannel
  ) {
    const guild = channel.guild;
    if (!guild || !(await isEventEnabled(guild.id, "webhookUpdate", this.client.db))) return;

    const modLogChannel = await getModLogChannel(guild.id, this.client);
    if (!modLogChannel) return;

    // Lấy danh sách webhooks từ kênh
    const webhooks = await channel.fetchWebhooks();
    const webhookDetails = webhooks.map((webhook: Webhook) => ({
      name: webhook.name,
      id: webhook.id,
      channel: `<#${webhook.channelId}>`,
      creator: webhook.owner ? `<@${webhook.owner.id}>` : "Không rõ",
      tokenStatus: webhook.token ? "Có" : "Không có",
    }));

    const webhookInfo = webhookDetails
      .map(
        (w) =>
          `**Webhook:** ${w.name} (${w.id})\n**Kênh:** ${w.channel}\n**Người tạo:** ${w.creator}\n**Token:** ${w.tokenStatus}`
      )
      .join("\n\n");

    if (!webhookInfo) return;

    await modLogChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x1e90ff)
          .setAuthor({
            name: this.client.user?.username || this.client.user?.tag || "Không rõ",
            iconURL: this.client.user?.displayAvatarURL() || "",
          })
          .setDescription(
            `🔗 **Webhook đã được cập nhật**\nMột webhook đã được cập nhật ở <#${channel.id}>.`
          )
          .addFields({
            name: "Thông tin Webhook",
            value: webhookInfo || "Không có thông tin webhook",
          })
          .setTimestamp(new Date()),
      ],
    });
  }
}
