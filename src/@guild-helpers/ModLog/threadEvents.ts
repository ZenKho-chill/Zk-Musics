import {
  ThreadChannel,
  EmbedBuilder,
  ThreadMember,
  AnyThreadChannel,
  PartialThreadMember,
  ReadonlyCollection,
} from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class ThreadEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on("threadCreate", this.handleThreadCreate.bind(this));
    this.client.on("threadDelete", this.handleThreadDelete.bind(this));
    this.client.on("threadUpdate", this.handleThreadUpdate.bind(this));
    this.client.on(
      "threadMemberUpdate",
      this.handleThreadMemberUpdate.bind(this)
    );
    this.client.on(
      "threadAutoArchived",
      this.handleThreadAutoArchived.bind(this)
    );
    this.client.on("threadUnarchive", this.handleThreadUnarchive.bind(this));
    this.client.on(
      "threadMembersUpdate",
      this.handleThreadMembersUpdate.bind(this)
    ); // Sự kiện đã được sửa
  }

  private async handleThreadCreate(thread: ThreadChannel) {
    if (
      !(await isEventEnabled(thread.guild.id, "threadCreate", this.client.db))
    )
      return;

    const channel = await getModLogChannel(thread.guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x32cd32)
          .setTitle("🧵 Đã tạo Thread")
          .setDescription(`**Thread:** ${thread.name} (${thread.id})`)
          .setTimestamp(new Date()),
      ],
    });
  }

  private async handleThreadDelete(thread: ThreadChannel) {
    if (
      !(await isEventEnabled(thread.guild.id, "threadDelete", this.client.db))
    )
      return;

    const channel = await getModLogChannel(thread.guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff4500)
          .setTitle("🗑️ Thread đã bị xóa")
          .setDescription(`**Thread:** ${thread.name} (${thread.id})`)
          .setTimestamp(new Date()),
      ],
    });
  }

  private async handleThreadUpdate(
    oldThread: ThreadChannel,
    newThread: ThreadChannel
  ) {
    if (
      !(await isEventEnabled(
        newThread.guild.id,
        "threadUpdate",
        this.client.db
      ))
    )
      return;

    const changes: string[] = [];
    if (oldThread.name !== newThread.name) {
      changes.push(`**Tên:** ${oldThread.name} → ${newThread.name}`);
    }

    if (changes.length > 0) {
      const channel = await getModLogChannel(newThread.guild.id, this.client);
      if (!channel) return;

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("🛠️ Thread đã được cập nhật")
            .setDescription(changes.join("\n"))
            .setTimestamp(new Date()),
        ],
      });
    }
  }

  private async handleThreadMemberUpdate(oldMember: any, newMember: any) {
    if (
      !(await isEventEnabled(
        newMember.guild.id,
        "threadMemberUpdate",
        this.client.db
      ))
    )
      return;

    const channel = await getModLogChannel(newMember.guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x1e90ff)
          .setTitle("🛠️ Thành viên Thread đã được cập nhật")
          .setDescription(`**Thành viên:** <@${newMember.id}>`)
          .setTimestamp(new Date()),
      ],
    });
  }

  private async handleThreadAutoArchived(thread: ThreadChannel) {
    if (
      !(await isEventEnabled(
        thread.guild.id,
        "threadAutoArchived",
        this.client.db
      ))
    )
      return;

    const channel = await getModLogChannel(thread.guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xffd700)
          .setTitle("📁 Thread đã được tự động lưu trữ")
          .setDescription(`**Thread:** ${thread.name} (${thread.id})`)
          .setTimestamp(new Date()),
      ],
    });
  }

  private async handleThreadUnarchive(thread: ThreadChannel) {
    if (
      !(await isEventEnabled(
        thread.guild.id,
        "threadUnarchive",
        this.client.db
      ))
    )
      return;

    const channel = await getModLogChannel(thread.guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x32cd32)
          .setTitle("📂 Thread đã được bỏ lưu trữ")
          .setDescription(
            `**Thread:** ${thread.name} (${thread.id}) đã được bỏ lưu trữ.`
          )
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý cập nhật nhiều thành viên thread
  private async handleThreadMembersUpdate(
    addedMembers: ReadonlyCollection<string, ThreadMember<boolean>>,
    removedMembers: ReadonlyCollection<
      string,
      ThreadMember<boolean> | PartialThreadMember
    >,
    thread: AnyThreadChannel
  ) {
    if (
      !(await isEventEnabled(
        thread.guild.id,
        "threadMembersUpdate",
        this.client.db
      ))
    )
      return;

    const logChannel = await getModLogChannel(thread.guild.id, this.client);
    if (!logChannel) return;

    const changes: string[] = [];
    if (addedMembers.size > 0) {
      changes.push(
        `**Thành viên đã thêm:** ${[...addedMembers.values()]
          .map((m) => `<@${m.id}>`)
          .join(", ")}`
      );
    }
    if (removedMembers.size > 0) {
      changes.push(
        `**Thành viên đã bị gỡ:** ${[...removedMembers.values()]
          .map((m) => `<@${m.id}>`)
          .join(", ")}`
      );
    }

    if (changes.length > 0) {
      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("🧵 Thành viên Thread đã được cập nhật")
            .setDescription(changes.join("\n"))
            .setTimestamp(new Date()),
        ],
      });
    }
  }
}
