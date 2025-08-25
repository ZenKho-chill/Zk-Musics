import { Guild, Integration, EmbedBuilder } from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class IntegrationEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on(
      "integrationCreate",
      this.handleIntegrationCreate.bind(this)
    );
    this.client.on(
      "integrationDelete",
      this.handleIntegrationDelete.bind(this)
    );
    this.client.on(
      "integrationUpdate",
      this.handleIntegrationUpdate.bind(this)
    );
  }

  // Xử lý sự kiện tạo integration
  private async handleIntegrationCreate(integration: Integration) {
    const guild = integration.guild;
    if (!(await isEventEnabled(guild.id, "integrationCreate", this.client.db)))
      return;

    const channel = await getModLogChannel(guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x32cd32)
          .setTitle("📢 Đã tạo integration")
          .setDescription(`**Integration:** ${integration.name}`)
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý sự kiện xóa integration
  private async handleIntegrationDelete(integration: Integration) {
    const guild = integration.guild;
    if (!(await isEventEnabled(guild.id, "integrationDelete", this.client.db)))
      return;

    const channel = await getModLogChannel(guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff4500)
          .setTitle("🗑️ Integration đã bị xóa")
          .setDescription(`**Integration:** ${integration.name}`)
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý sự kiện cập nhật integration
  private async handleIntegrationUpdate(integration: Integration) {
    const guild = integration.guild;
    if (!(await isEventEnabled(guild.id, "integrationUpdate", this.client.db)))
      return;

    const channel = await getModLogChannel(guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x1e90ff)
          .setTitle("🔧 Integration đã được cập nhật")
          .setDescription(`**Integration:** ${integration.name}`)
          .setTimestamp(new Date()),
      ],
    });
  }
}
