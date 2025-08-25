import { VoiceState, EmbedBuilder } from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class VoiceEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on("voiceStateUpdate", this.handleVoiceStateUpdate.bind(this));
  }

  private async handleVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState
  ) {
    const guild = newState.guild;
    if (!(await isEventEnabled(guild.id, "voiceStateUpdate", this.client.db)))
      return;

    const channel = await getModLogChannel(guild.id, this.client);
    if (!channel) return;

    const changes: string[] = [];

    if (oldState.channelId !== newState.channelId) {
      changes.push(
        `**Kênh thoại:** ${
          oldState.channelId ? `<#${oldState.channelId}>` : "Đã rời kênh thoại"
        } → ${
          newState.channelId
            ? `<#${newState.channelId}>`
            : "Đã tham gia kênh thoại"
        }`
      );
    }

    if (changes.length > 0) {
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("🎙️ Trạng thái thoại đã được cập nhật")
            .setDescription(changes.join("\n"))
            .setTimestamp(new Date()),
        ],
      });
    }
  }
}
