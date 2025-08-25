import {
  CommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class SlashCommandEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on(
      "slashCommandError",
      this.handleSlashCommandError.bind(this)
    );
    this.client.on(
      "slashCommandSuccess",
      this.handleSlashCommandSuccess.bind(this)
    );
    this.client.on(
      "slashCommandPermissionError",
      this.handleSlashCommandPermissionError.bind(this)
    );
    this.client.on(
      "slashCommandCooldownViolation",
      this.handleSlashCommandCooldownViolation.bind(this)
    );
    this.client.on(
      "interactionTimeout",
      this.handleInteractionTimeout.bind(this)
    );
  }

  // Xử lý lỗi khi chạy slash command
  private async handleSlashCommandError(
    interaction: CommandInteraction,
    error: Error
  ) {
    const guild = interaction.guild;
    if (
      !guild ||
      !(await isEventEnabled(guild.id, "slashCommandError", this.client.db))
    )
      return;

    const channel = await getModLogChannel(guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff4500)
          .setTitle("❌ Lỗi Slash Command")
          .setDescription(
            `**Lỗi:** ${error.message}\n**Lệnh:** ${interaction.commandName}`
          )
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý khi slash command chạy thành công
  private async handleSlashCommandSuccess(interaction: CommandInteraction) {
    const guild = interaction.guild;
    if (
      !guild ||
      !(await isEventEnabled(guild.id, "slashCommandSuccess", this.client.db))
    )
      return;

    const channel = await getModLogChannel(guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x32cd32) // màu xanh lá cho thành công
          .setTitle("✅ Slash Command đã được thực thi")
          .setDescription(
            `**Lệnh:** ${interaction.commandName}\n**Người dùng:** <@${interaction.user.id}>`
          )
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý lỗi quyền khi dùng slash command
  private async handleSlashCommandPermissionError(
    interaction: CommandInteraction
  ) {
    const guild = interaction.guild;
    if (
      !guild ||
      !(await isEventEnabled(
        guild.id,
        "slashCommandPermissionError",
        this.client.db
      ))
    )
      return;

    const channel = await getModLogChannel(guild.id, this.client);
    if (!channel) return;

    const requiredPermissions = new PermissionsBitField(BigInt(0));

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xffa500) // màu cam cho cảnh báo
          .setTitle("⚠️ Lỗi quyền Slash Command")
          .setDescription(
            `**Lệnh:** ${interaction.commandName}\n**Người dùng:** <@${
              interaction.user.id
            }>\n**Quyền yêu cầu:** ${requiredPermissions.toArray().join(", ")}`
          )
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý vi phạm cooldown khi dùng slash command
  private async handleSlashCommandCooldownViolation(
    interaction: CommandInteraction
  ) {
    const guild = interaction.guild;
    if (
      !guild ||
      !(await isEventEnabled(
        guild.id,
        "slashCommandCooldownViolation",
        this.client.db
      ))
    )
      return;

    const channel = await getModLogChannel(guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff4500) // màu đỏ cho lỗi
          .setTitle("❗ Vi phạm cooldown Slash Command")
          .setDescription(
            `**Lệnh:** ${interaction.commandName}\n**Người dùng:** <@${interaction.user.id}>`
          )
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý interaction bị timeout
  private async handleInteractionTimeout(interaction: CommandInteraction) {
    const guild = interaction.guild;
    if (
      !guild ||
      !(await isEventEnabled(guild.id, "interactionTimeout", this.client.db))
    )
      return;

    const channel = await getModLogChannel(guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff4500) // màu đỏ cho lỗi
          .setTitle("⏳ Interaction đã hết thời gian")
          .setDescription(
            `Tương tác cho lệnh **${interaction.commandName}** đã hết thời gian.`
          )
          .setTimestamp(new Date()),
      ],
    });
  }
}
