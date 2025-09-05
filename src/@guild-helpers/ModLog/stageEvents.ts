import { StageInstance, EmbedBuilder } from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class StageEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on("stageInstanceCreate", this.handleStageInstanceCreate.bind(this));
    this.client.on("stageInstanceUpdate", this.handleStageInstanceUpdate.bind(this));
    this.client.on("stageInstanceDelete", this.handleStageInstanceDelete.bind(this));
  }

  // Xử lý tạo stage instance
  private async handleStageInstanceCreate(stage: StageInstance) {
    const guild = stage.guild;

    if (!guild) return; // Thoát nếu không có guild
    if (!(await isEventEnabled(guild.id, "stageInstanceCreate", this.client.db))) return;

    const channel = await getModLogChannel(guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x32cd32)
          .setTitle("🎤 Đã tạo Stage Instance")
          .setDescription(`**Chủ đề:** ${stage.topic}\n**Kênh:** <#${stage.channelId}>`)
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý cập nhật stage instance
  private async handleStageInstanceUpdate(oldStage: StageInstance | null, newStage: StageInstance) {
    const guild = newStage.guild;

    if (!guild) return; // Thoát nếu không có guild
    if (!(await isEventEnabled(guild.id, "stageInstanceUpdate", this.client.db))) return;

    const channel = await getModLogChannel(guild.id, this.client);
    if (!channel) return;

    const changes: string[] = [];

    // Chỉ kiểm tra thay đổi nếu oldStage tồn tại
    if (oldStage) {
      if (oldStage.topic !== newStage.topic) {
        changes.push(`**Chủ đề:** ${oldStage.topic} → ${newStage.topic}`);
      }
    }

    if (changes.length > 0) {
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("🎤 Stage Instance đã được cập nhật")
            .setDescription(changes.join("\n"))
            .setTimestamp(new Date()),
        ],
      });
    }
  }

  // Xử lý xoá stage instance
  private async handleStageInstanceDelete(stage: StageInstance) {
    const guild = stage.guild;

    if (!guild) return; // Thoát nếu không có guild
    if (!(await isEventEnabled(guild.id, "stageInstanceDelete", this.client.db))) return;

    const channel = await getModLogChannel(guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff4500)
          .setTitle("🗑️ Đã xoá Stage Instance")
          .setDescription(`**Chủ đề:** ${stage.topic}\n**Kênh:** <#${stage.channelId}>`)
          .setTimestamp(new Date()),
      ],
    });
  }
}
