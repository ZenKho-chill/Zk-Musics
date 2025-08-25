import { Guild, EmbedBuilder } from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class VoiceRegionEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on(
      "guildVoiceRegionUpdate",
      this.handleVoiceRegionUpdate.bind(this)
    );
  }

  private async handleVoiceRegionUpdate(guild: Guild) {
    if (
      !(await isEventEnabled(
        guild.id,
        "guildVoiceRegionUpdate",
        this.client.db
      ))
    )
      return;

    const channel = await getModLogChannel(guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x1e90ff)
          .setTitle("🌍 Vùng thoại đã được cập nhật")
          .setDescription(`**Máy chủ:** ${guild.name}`)
          .setTimestamp(new Date()),
      ],
    });
  }
}
