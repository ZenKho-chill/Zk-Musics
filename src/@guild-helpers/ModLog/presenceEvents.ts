import { Presence, EmbedBuilder } from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class PresenceEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on("presenceUpdate", this.handlePresenceUpdate.bind(this));
  }

  private async handlePresenceUpdate(
    oldPresence: Presence | null,
    newPresence: Presence
  ) {
    const guild = newPresence.guild;

    // Kiểm tra nếu guild là null
    if (!guild) return; // Nếu không có guild thì thoát

    // Kiểm tra sự kiện đã bật cho guild chưa
    if (!(await isEventEnabled(guild.id, "presenceUpdate", this.client.db)))
      return;

    const channel = await getModLogChannel(guild.id, this.client);
    if (!channel) return;

    const user = newPresence.user;
    const oldStatus = oldPresence?.status || "offline";
    const newStatus = newPresence.status;

    if (oldStatus !== newStatus) {
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("🔔 Trạng thái hiện diện đã cập nhật")
            .setDescription(`**Người dùng:** <@${user?.id}>`)
            .addFields(
              { name: "Trạng thái cũ", value: oldStatus, inline: true },
              { name: "Trạng thái mới", value: newStatus, inline: true }
            )
            .setTimestamp(new Date()),
        ],
      });
    }
  }
}
