import {
  AutoModerationActionExecution,
  AutoModerationRule,
  EmbedBuilder,
} from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class AutoModEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on(
      "autoModerationActionExecution",
      this.handleAutoModerationActionExecution.bind(this)
    );
    this.client.on(
      "autoModerationRuleCreate",
      this.handleAutoModerationRuleCreate.bind(this)
    );
    this.client.on(
      "autoModerationRuleUpdate",
      this.handleAutoModerationRuleUpdate.bind(this)
    );
    this.client.on(
      "autoModerationRuleDelete",
      this.handleAutoModerationRuleDelete.bind(this)
    );
  }

  // Xử lý sự kiện AutoModerationActionExecution
  private async handleAutoModerationActionExecution(
    action: AutoModerationActionExecution
  ) {
    const guild = action.guild;
    if (!guild) return;
    if (
      !(await isEventEnabled(
        guild.id,
        "autoModerationActionExecution",
        this.client.db
      ))
    )
      return;

    const modLogChannel = await getModLogChannel(guild.id, this.client);
    if (!modLogChannel) return;

    const rule = await guild.autoModerationRules
      .fetch(action.ruleId)
      .catch(() => null);
    const ruleName = rule ? rule.name : "Không xác định";

    const userMention = action.user
      ? `<@${action.user.id}>`
      : "Không rõ người dùng";

    await modLogChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff4500)
          .setTitle("🚨 Hành động Tự động Kiểm duyệt được thực thi")
          .setDescription(`**Loại hành động:** ${action.action.type}`)
          .addFields(
            { name: "Luật", value: ruleName, inline: true },
            { name: "Người dùng", value: userMention, inline: true },
            {
              name: "Kênh",
              value: action.channel
                ? `<#${action.channel.id}>`
                : "Tin nhắn riêng (DM)",
              inline: true,
            },
            {
              name: "Nội dung",
              value: action.content || "Không có nội dung",
              inline: false,
            }
          )
          .setFooter({
            text:
              this.client.user?.username ||
              this.client.user?.tag ||
              "Không rõ",
            iconURL:
              this.client.user?.displayAvatarURL() ||
              "https://raw.githubusercontent.com/ZenKho-chill/zkcard/main/build/structures/images/avatar.png",
          })
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý sự kiện tạo luật AutoMod
  private async handleAutoModerationRuleCreate(rule: AutoModerationRule) {
    const guild = rule.guild;
    if (!guild) return;
    if (
      !(await isEventEnabled(
        guild.id,
        "autoModerationRuleCreate",
        this.client.db
      ))
    )
      return;

    const modLogChannel = await getModLogChannel(guild.id, this.client);
    if (!modLogChannel) return;

    await modLogChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x32cd32)
          .setTitle("✅ Luật Tự động Kiểm duyệt đã được tạo")
          .addFields(
            { name: "Tên luật", value: rule.name, inline: true },
            {
              name: "Kích hoạt",
              value: rule.enabled ? "Có" : "Không",
              inline: true,
            },
            { name: "Người tạo", value: `<@${rule.creatorId}>`, inline: true }
          )
          .setFooter({
            text:
              this.client.user?.username ||
              this.client.user?.tag ||
              "Không rõ",
            iconURL:
              this.client.user?.displayAvatarURL() ||
              "https://raw.githubusercontent.com/ZenKho-chill/zkcard/main/build/structures/images/avatar.png",
          })
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý sự kiện cập nhật luật AutoMod
  private async handleAutoModerationRuleUpdate(
    oldRule: AutoModerationRule | null,
    newRule: AutoModerationRule
  ) {
    const guild = newRule.guild;
    if (!guild) return;
    if (
      !(await isEventEnabled(
        guild.id,
        "autoModerationRuleUpdate",
        this.client.db
      ))
    )
      return;

    const modLogChannel = await getModLogChannel(guild.id, this.client);
    if (!modLogChannel) return;

    const changes: string[] = [];

    if (oldRule) {
      if (oldRule.name !== newRule.name)
        changes.push(`**Tên luật:** ${oldRule.name} → ${newRule.name}`);
      if (oldRule.enabled !== newRule.enabled)
        changes.push(
          `**Trạng thái:** ${oldRule.enabled ? "Bật" : "Tắt"} → ${
            newRule.enabled ? "Bật" : "Tắt"
          }`
        );
    } else {
      // Trường hợp oldRule null (có thể là mới tạo hoặc không có trạng thái cũ)
      changes.push(`**Luật được tạo/cập nhật:** ${newRule.name}`);
    }

    if (changes.length === 0) return; // Không có thay đổi

    await modLogChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x1e90ff)
          .setTitle("🛠️ Luật Tự động Kiểm duyệt đã được cập nhật")
          .setDescription(changes.join("\n"))
          .setFooter({
            text: this.client.user?.username || this.client.user?.tag || "Không rõ",
            iconURL:
              this.client.user?.displayAvatarURL() ||
              "https://raw.githubusercontent.com/ZenKho-chill/zkcard/main/build/structures/images/avatar.png",
          })
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý sự kiện xóa luật AutoMod
  private async handleAutoModerationRuleDelete(rule: AutoModerationRule) {
    const guild = rule.guild;
    if (!guild) return;
    if (
      !(await isEventEnabled(
        guild.id,
        "autoModerationRuleDelete",
        this.client.db
      ))
    )
      return;

    const modLogChannel = await getModLogChannel(guild.id, this.client);
    if (!modLogChannel) return;

    await modLogChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff4500)
          .setTitle("🗑️ Luật Tự động Kiểm duyệt đã bị xóa")
          .addFields(
            { name: "Tên luật", value: rule.name, inline: true },
            { name: "Người xóa", value: `<@${rule.creatorId}>`, inline: true }
          )
          .setFooter({
            text:
              this.client.user?.username ||
              this.client.user?.tag ||
              "Không rõ",
            iconURL:
              this.client.user?.displayAvatarURL() ||
              "https://raw.githubusercontent.com/ZenKho-chill/zkcard/main/build/structures/images/avatar.png",
          })
          .setTimestamp(new Date()),
      ],
    });
  }
}
