import {
  GuildScheduledEvent,
  PartialGuildScheduledEvent,
  EmbedBuilder,
  GuildScheduledEventStatus,
} from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class ScheduledEventHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on(
      "guildScheduledEventCreate",
      this.handleScheduledEventCreate.bind(this)
    );
    this.client.on(
      "guildScheduledEventUpdate",
      this.handleScheduledEventUpdate.bind(this)
    );
    this.client.on(
      "guildScheduledEventDelete",
      this.handleScheduledEventDelete.bind(this)
    );
  }

  // Xử lý tạo scheduled event
  private async handleScheduledEventCreate(
    event: GuildScheduledEvent<GuildScheduledEventStatus>
  ) {
    if (!event.guild) return; // Kiểm tra null guild
    if (
      !(await isEventEnabled(
        event.guild.id,
        "guildScheduledEventCreate",
        this.client.db
      ))
    )
      return;

    const modLogChannel = await getModLogChannel(event.guild.id, this.client);
    if (!modLogChannel) return;

    await modLogChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x1e90ff)
          .setTitle("📅 Đã tạo Scheduled Event")
          .setDescription(`**Sự kiện:** ${event.name}`)
          .addFields(
            {
              name: "Thời gian bắt đầu",
              value: `${
                event.scheduledStartTimestamp
                  ? new Date(event.scheduledStartTimestamp).toISOString()
                  : "N/A"
              }`,
            },
            {
              name: "Thời gian kết thúc",
              value: `${
                event.scheduledEndTimestamp
                  ? new Date(event.scheduledEndTimestamp).toISOString()
                  : "N/A"
              }`,
            },
            { name: "Mức riêng tư", value: `${event.privacyLevel}` },
            {
              name: "Địa điểm",
              value: `${
                event.channel
                  ? `<#${event.channel.id}>`
                  : event.entityMetadata?.location || "Không rõ"
              }`,
            },
            { name: "Mô tả", value: `${event.description || "Không có mô tả"}` }
          )
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý cập nhật scheduled event
  private async handleScheduledEventUpdate(
    oldEvent:
      | GuildScheduledEvent<GuildScheduledEventStatus>
      | PartialGuildScheduledEvent
      | null,
    newEvent: GuildScheduledEvent<GuildScheduledEventStatus>
  ) {
    if (!newEvent.guild) return; // Check for null guild
    if (
      !(await isEventEnabled(
        newEvent.guild.id,
        "guildScheduledEventUpdate",
        this.client.db
      ))
    )
      return;

    const modLogChannel = await getModLogChannel(
      newEvent.guild.id,
      this.client
    );
    if (!modLogChannel) return;

    const changes: string[] = [];

    if (
      oldEvent?.scheduledStartTimestamp !== newEvent.scheduledStartTimestamp
    ) {
      changes.push(
        `**Thời gian bắt đầu:** ${
          oldEvent?.scheduledStartTimestamp
            ? new Date(oldEvent.scheduledStartTimestamp).toISOString()
            : "N/A"
        } → ${
          newEvent.scheduledStartTimestamp
            ? new Date(newEvent.scheduledStartTimestamp).toISOString()
            : "N/A"
        }`
      );
    }
    if (oldEvent?.scheduledEndTimestamp !== newEvent.scheduledEndTimestamp) {
      changes.push(
        `**Thời gian kết thúc:** ${
          oldEvent?.scheduledEndTimestamp
            ? new Date(oldEvent.scheduledEndTimestamp).toISOString()
            : "N/A"
        } → ${
          newEvent.scheduledEndTimestamp
            ? new Date(newEvent.scheduledEndTimestamp).toISOString()
            : "N/A"
        }`
      );
    }
    if (oldEvent?.name !== newEvent.name) {
      changes.push(`**Tên:** ${oldEvent?.name || "N/A"} → ${newEvent.name}`);
    }
    if (oldEvent?.description !== newEvent.description) {
      changes.push(`**Mô tả:** Đã cập nhật`);
    }
    if (oldEvent?.privacyLevel !== newEvent.privacyLevel) {
      changes.push(
        `**Mức riêng tư:** ${oldEvent?.privacyLevel} → ${newEvent.privacyLevel}`
      );
    }

    if (changes.length > 0) {
      await modLogChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("📅 Scheduled Event đã được cập nhật")
            .setDescription(changes.join("\n"))
            .setTimestamp(new Date()),
        ],
      });
    }
  }

  // Xử lý xoá scheduled event
  private async handleScheduledEventDelete(
    event:
      | GuildScheduledEvent<GuildScheduledEventStatus>
      | PartialGuildScheduledEvent
  ) {
    if (!event.guild) return; // Kiểm tra null guild
    if (
      !(await isEventEnabled(
        event.guild.id,
        "guildScheduledEventDelete",
        this.client.db
      ))
    )
      return;

    const modLogChannel = await getModLogChannel(event.guild.id, this.client);
    if (!modLogChannel) return;

    await modLogChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff4500)
          .setTitle("🗑️ Đã xoá Scheduled Event")
          .setDescription(`**Sự kiện:** ${event.name || "N/A"}`) // Kiểm tra event.name null
          .setTimestamp(new Date()),
      ],
    });
  }
}
