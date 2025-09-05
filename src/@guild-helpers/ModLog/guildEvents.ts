import { Manager } from "../../manager.js";
import { EmbedBuilder, Guild, AuditLogEvent, GuildAuditLogsEntry } from "discord.js";
import { getModLogChannel, isEventEnabled } from "../ModLogEventUtils.js";

export class GuildEventHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on("guildUpdate", this.handleGuildUpdate.bind(this));
    this.client.on("guildAuditLogEntryCreate", this.handleGuildAuditLogEntryCreate.bind(this));
    this.client.on("guildIntegrationsUpdate", this.handleGuildIntegrationsUpdate.bind(this));
    this.client.on("guildVanityURLUpdate", this.handleGuildVanityURLUpdate.bind(this));
    this.client.on("guildBannerRemoval", this.handleGuildBannerRemoval.bind(this));
    this.client.on("guildOnboardingUpdate", this.handleGuildOnboardingUpdate.bind(this));
    this.client.on("guildMFALevelUpdate", this.handleGuildMFALevelUpdate.bind(this));
    this.client.on("guildRulesChannelUpdate", this.handleGuildRulesChannelUpdate.bind(this));
    this.client.on("guildSystemChannelUpdate", this.handleGuildSystemChannelUpdate.bind(this));
    this.client.on("guildAFKUpdate", this.handleGuildAFKUpdate.bind(this));
    this.client.on("guildDiscoveryUpdate", this.handleGuildDiscoveryUpdate.bind(this));
    this.client.on(
      "guildVerificationLevelUpdate",
      this.handleGuildVerificationLevelUpdate.bind(this)
    );
    this.client.on(
      "guildExplicitContentFilterUpdate",
      this.handleGuildExplicitContentFilterUpdate.bind(this)
    );
    this.client.on(
      "guildNotificationSettingsUpdate",
      this.handleGuildNotificationSettingsUpdate.bind(this)
    );
  }

  private async handleGuildUpdate(oldGuild: Guild, newGuild: Guild) {
    if (!(await isEventEnabled(newGuild.id, "guildUpdate", this.client.db))) return; // Truyền client.db

    const auditLogs = await newGuild.fetchAuditLogs({
      type: AuditLogEvent.GuildUpdate,
    }); // Sử dụng AuditLogEvent.GuildUpdate
    const auditEntry = auditLogs.entries.first();
    const executor = auditEntry?.executor;

    const channel = await getModLogChannel(newGuild.id, this.client);
    if (!channel) return;

    const changes: string[] = [];
    if (oldGuild.name !== newGuild.name) {
      changes.push(`**Tên:** ${oldGuild.name} → ${newGuild.name}`);
    }
    if (oldGuild.icon !== newGuild.icon) {
      changes.push(`**Biểu tượng:** Đã cập nhật`);
    }

    if (changes.length > 0) {
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("Máy chủ đã được cập nhật")
            .setDescription(changes.join("\n"))
            .addFields({
              name: "Cập nhật bởi",
              value: `<@${executor?.id ?? "Không rõ"}>`,
              inline: true,
            })
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
  }

  private async handleGuildAuditLogEntryCreate(auditLog: GuildAuditLogsEntry) {
    const targetGuild = auditLog.target instanceof Guild ? auditLog.target.id : null;
    if (!(await isEventEnabled(targetGuild ?? "", "guildAuditLogEntryCreate", this.client.db)))
      return;

    const channel = await getModLogChannel(targetGuild ?? "", this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xffd700)
          .setTitle("Mục Audit Log đã được tạo")
          .setDescription(`**Hành động:** ${auditLog.action}`)
          .addFields({
            name: "Thực hiện bởi",
            value: `<@${auditLog.executor?.id ?? "Không rõ"}>`,
            inline: true,
          })
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

  private async handleGuildIntegrationsUpdate(guild: Guild) {
    if (!(await isEventEnabled(guild.id, "guildIntegrationsUpdate", this.client.db))) return;

    const auditLogs = await guild.fetchAuditLogs({
      type: AuditLogEvent.IntegrationUpdate,
    }); // Sử dụng enum AuditLogEvent
    const auditEntry = auditLogs.entries.first();
    const executor = auditEntry?.executor;

    const channel = await getModLogChannel(guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x1e90ff)
          .setTitle("Tích hợp máy chủ đã được cập nhật")
          .addFields({
            name: "Cập nhật bởi",
            value: `<@${executor?.id ?? "Không rõ"}>`,
            inline: true,
          })
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

  private async handleGuildVanityURLUpdate(guild: Guild) {
    if (!(await isEventEnabled(guild.id, "guildVanityURLUpdate", this.client.db))) return;

    // Sử dụng giá trị enum chính xác cho type
    const auditLogs = await guild.fetchAuditLogs({
      type: AuditLogEvent.GuildUpdate,
    });
    const auditEntry = auditLogs.entries.first();
    const executor = auditEntry?.executor;

    const channel = await getModLogChannel(guild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x1e90ff)
          .setTitle("Đã cập nhật Vanity URL")
          .setDescription(`**Vanity URL mới:** ${guild.vanityURLCode || "Không có"}`)
          .addFields({
            name: "Cập nhật bởi",
            value: `<@${executor?.id}>`,
            inline: true,
          })
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

  private async handleGuildBannerRemoval(oldGuild: Guild, newGuild: Guild) {
    if (!(await isEventEnabled(newGuild.id, "guildBannerRemoval", this.client.db))) return;

    if (oldGuild.banner && !newGuild.banner) {
      const channel = await getModLogChannel(newGuild.id, this.client);
      if (!channel) return;

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff4500)
            .setTitle("Biểu ngữ máy chủ đã bị xóa")
            .setDescription("Biểu ngữ của máy chủ đã bị xóa.")
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
  }

  private async handleGuildOnboardingUpdate(oldGuild: Guild, newGuild: Guild) {
    if (!(await isEventEnabled(newGuild.id, "guildOnboardingUpdate", this.client.db))) return;

    const channel = await getModLogChannel(newGuild.id, this.client);
    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x1e90ff)
          .setTitle("Cài đặt onboarding máy chủ đã được cập nhật")
          .setDescription("Cài đặt onboarding của máy chủ đã được cập nhật.")
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

  private async handleGuildMFALevelUpdate(oldGuild: Guild, newGuild: Guild) {
    if (!(await isEventEnabled(newGuild.id, "guildMFALevelUpdate", this.client.db))) return;

    if (oldGuild.mfaLevel !== newGuild.mfaLevel) {
      const channel = await getModLogChannel(newGuild.id, this.client);
      if (!channel) return;

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("Mức MFA đã được cập nhật")
            .setDescription(
              `**Mức trước:** ${oldGuild.mfaLevel}\n**Mức mới:** ${newGuild.mfaLevel}`
            )
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
  }

  private async handleGuildRulesChannelUpdate(oldGuild: Guild, newGuild: Guild) {
    if (!(await isEventEnabled(newGuild.id, "guildRulesChannelUpdate", this.client.db))) return;

    if (oldGuild.rulesChannelId !== newGuild.rulesChannelId) {
      const channel = await getModLogChannel(newGuild.id, this.client);
      if (!channel) return;

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("Kênh Quy tắc đã được cập nhật")
            .setDescription(
              `**Kênh trước:** ${
                oldGuild.rulesChannel?.name || "Không có"
              }\n**Kênh mới:** ${newGuild.rulesChannel?.name || "Không có"}`
            )
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
  }

  private async handleGuildSystemChannelUpdate(oldGuild: Guild, newGuild: Guild) {
    if (!(await isEventEnabled(newGuild.id, "guildSystemChannelUpdate", this.client.db))) return;

    if (oldGuild.systemChannelId !== newGuild.systemChannelId) {
      const channel = await getModLogChannel(newGuild.id, this.client);
      if (!channel) return;

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("Kênh hệ thống đã được cập nhật")
            .setDescription(
              `**Kênh trước:** ${
                oldGuild.systemChannel?.name || "Không có"
              }\n**Kênh mới:** ${newGuild.systemChannel?.name || "Không có"}`
            )
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
  }

  private async handleGuildAFKUpdate(oldGuild: Guild, newGuild: Guild) {
    if (!(await isEventEnabled(newGuild.id, "guildAFKUpdate", this.client.db))) return;

    const changes: string[] = [];
    if (oldGuild.afkChannelId !== newGuild.afkChannelId) {
      changes.push(
        `**Kênh AFK:** ${oldGuild.afkChannel?.name || "Không có"} → ${
          newGuild.afkChannel?.name || "Không có"
        }`
      );
    }
    if (oldGuild.afkTimeout !== newGuild.afkTimeout) {
      changes.push(
        `**Thời gian AFK (timeout):** ${oldGuild.afkTimeout} giây → ${newGuild.afkTimeout} giây`
      );
    }

    if (changes.length > 0) {
      const channel = await getModLogChannel(newGuild.id, this.client);
      if (!channel) return;

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("Cài đặt AFK đã được cập nhật")
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
  }

  private async handleGuildDiscoveryUpdate(oldGuild: Guild, newGuild: Guild) {
    if (!(await isEventEnabled(newGuild.id, "guildDiscoveryUpdate", this.client.db))) return;

    if (oldGuild.discoverySplash !== newGuild.discoverySplash) {
      const channel = await getModLogChannel(newGuild.id, this.client);
      if (!channel) return;
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("Khám phá máy chủ đã được cập nhật")
            .setDescription("Ảnh khám phá (discovery splash) của máy chủ đã được cập nhật.")
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
  }

  private async handleGuildVerificationLevelUpdate(oldGuild: Guild, newGuild: Guild) {
    if (!(await isEventEnabled(newGuild.id, "guildVerificationLevelUpdate", this.client.db)))
      return;

    if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
      const channel = await getModLogChannel(newGuild.id, this.client);
      if (!channel) return;

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("Mức xác thực đã được cập nhật")
            .setDescription(
              `**Mức trước:** ${oldGuild.verificationLevel}\n**Mức mới:** ${newGuild.verificationLevel}`
            )
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
  }

  private async handleGuildExplicitContentFilterUpdate(oldGuild: Guild, newGuild: Guild) {
    if (!(await isEventEnabled(newGuild.id, "guildExplicitContentFilterUpdate", this.client.db)))
      return;

    if (oldGuild.explicitContentFilter !== newGuild.explicitContentFilter) {
      const channel = await getModLogChannel(newGuild.id, this.client);
      if (!channel) return;

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("Cài đặt lọc nội dung đã được cập nhật")
            .setDescription(
              `**Cài đặt trước:** ${oldGuild.explicitContentFilter}\n**Cài đặt mới:** ${newGuild.explicitContentFilter}`
            )
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
  }

  private async handleGuildNotificationSettingsUpdate(oldGuild: Guild, newGuild: Guild) {
    if (!(await isEventEnabled(newGuild.id, "guildNotificationSettingsUpdate", this.client.db)))
      return;

    if (oldGuild.defaultMessageNotifications !== newGuild.defaultMessageNotifications) {
      const channel = await getModLogChannel(newGuild.id, this.client);
      if (!channel) return;

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setTitle("Cài đặt thông báo đã được cập nhật")
            .setDescription(
              `**Cài đặt trước:** ${oldGuild.defaultMessageNotifications}\n**Cài đặt mới:** ${newGuild.defaultMessageNotifications}`
            )
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
  }
}
