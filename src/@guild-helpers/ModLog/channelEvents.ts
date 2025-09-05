import {
  Channel,
  TextBasedChannel,
  EmbedBuilder,
  GuildChannel,
  OverwriteType,
  ThreadChannel,
  VoiceChannel,
  NewsChannel,
  TextChannel,
  AuditLogEvent,
} from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class ChannelEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on("channelCreate", this.handleChannelCreate.bind(this));
    this.client.on("channelDelete", this.handleChannelDelete.bind(this));
    this.client.on("channelUpdate", async (oldChannel, newChannel) => {
      if (oldChannel instanceof GuildChannel && newChannel instanceof GuildChannel) {
        await this.handleChannelUpdate(oldChannel, newChannel);
        await this.handleChannelOverwriteUpdate(oldChannel, newChannel);
        await this.handleChannelSlowmodeUpdate(oldChannel, newChannel);
        await this.handleChannelNSFWToggle(oldChannel, newChannel);
      }
    });
    this.client.on("channelPinsUpdate", this.handleChannelPinsUpdate.bind(this));
    this.client.on("permissionOverwriteCreate", this.handlePermissionOverwriteCreate.bind(this));
    this.client.on("webhookUpdate", this.handleWebhookUpdate.bind(this));
    this.client.on("threadUpdate", this.handleThreadUpdate.bind(this)); // Đã loại bỏ sự kiện typingStart
  }

  // Xử lý sự kiện tạo kênh
  private async handleChannelCreate(channel: Channel) {
    if (!(channel instanceof GuildChannel)) return;
    if (!(await isEventEnabled(channel.guild.id, "channelCreate", this.client.db))) return;

    const logChannel = await getModLogChannel(channel.guild.id, this.client);
    if (!logChannel) return;

    let executor: any = null;
    try {
      const auditLogs = await channel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelCreate,
        limit: 1,
      });
      const logEntry = auditLogs.entries.first();
      if (logEntry && logEntry.target?.id === channel.id) {
        executor = logEntry.executor;
      }
    } catch (error) {
      this.client.logger.error(ChannelEventsHandler.name, "Không thể lấy audit logs");
    }

    const executorName = executor ? executor.username : this.client.user?.tag || "Không rõ";
    const executorIcon = executor
      ? executor.displayAvatarURL()
      : this.client.user?.displayAvatarURL();

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x32cd32)
          .setAuthor({
            name: executorName,
            iconURL: executorIcon,
          })
          .setDescription(
            `**Tạo kênh**\n${"name" in channel ? channel.name : "Không rõ"} (${channel.id})`
          )
          .addFields({
            name: "**IDs**",
            value: `
            > ${"name" in channel ? `<#${channel.id}>` : "Không rõ"} (${channel.id})
            > ${
              executor ? `<@${executor.id}>` : "Không rõ"
            } (${executor ? executor.id : "Không rõ"})`,
            inline: true,
          })
          .setFooter({
            text: this.client.user?.tag || "Không rõ",
            iconURL: this.client.user?.displayAvatarURL(),
          })
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý sự kiện xóa kênh
  private async handleChannelDelete(channel: Channel) {
    if (!(channel instanceof GuildChannel)) return;
    if (!(await isEventEnabled(channel.guild.id, "channelDelete", this.client.db))) return;

    const logChannel = await getModLogChannel(channel.guild.id, this.client);
    if (!logChannel) return;

    let executor: any = null;
    try {
      const auditLogs = await channel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelDelete,
        limit: 1,
      });
      const logEntry = auditLogs.entries.first();
      if (logEntry && logEntry.target?.id === channel.id) {
        executor = logEntry.executor;
      }
    } catch (error) {
      this.client.logger.error(ChannelEventsHandler.name, "Không thể lấy audit logs");
    }

    const executorName = executor ? executor.username : this.client.user?.tag || "Không rõ";
    const executorIcon = executor
      ? executor.displayAvatarURL()
      : this.client.user?.displayAvatarURL();

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff4500)
          .setAuthor({
            name: executorName,
            iconURL: executorIcon,
          })
          .setDescription(
            `**Xóa kênh**\n${"name" in channel ? channel.name : "Không rõ"} (${channel.id})`
          )
          .addFields({
            name: "**IDs**",
            value: `
    > ${"name" in channel ? `<#${channel.id}>` : "Không rõ"} (${channel.id})
    > ${executor ? `<@${executor.id}>` : "Không rõ"} (${executor ? executor.id : "Không rõ"})`,
            inline: true,
          })
          .setFooter({
            text: this.client.user?.tag || "Không rõ",
            iconURL: this.client.user?.displayAvatarURL(),
          })
          .setTimestamp(new Date()),
      ],
    });
  }

  // Xử lý sự kiện cập nhật kênh
  private async handleChannelUpdate(oldChannel: GuildChannel, newChannel: GuildChannel) {
    if (!(await isEventEnabled(newChannel.guild.id, "channelUpdate", this.client.db))) return;

    const logChannel = await getModLogChannel(newChannel.guild.id, this.client);
    if (!logChannel) return;

    let executor: any = null;

    try {
      const auditLogs = await newChannel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelUpdate,
        limit: 1,
      });
      const logEntry = auditLogs.entries.first();
      executor = logEntry?.executor;
    } catch (error) {
      this.client.logger.error(ChannelEventsHandler.name, "Không thể lấy audit logs");
    }

    const changes: string[] = [];

    if (oldChannel.name !== newChannel.name) {
      changes.push(`**${oldChannel.name}** ➡️ **${newChannel.name}**`);
    }

    if (changes.length > 0) {
      const executorName = executor ? executor.username : "Không rõ";
      const executorIcon = executor ? executor.displayAvatarURL() : null;

      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setAuthor({
              name: executorName,
              iconURL: executorIcon,
            })
            .setDescription(
              [
                "**Sửa kênh**",
                ...changes.map((change) => `> ${change}`), // Thêm thụt lề cho mỗi thay đổi
                "",
                "**IDs**",
                `> <#${newChannel.id}> (${newChannel.id})`,
                executor
                  ? `> <@${executor.id}> (${executor.id})`
                  : `> ${this.client.user?.username || "Bot Không rõ"}`,
              ].join("\n")
            )
            .setFooter({
              text: `${this.client.user?.username || "Bot Không rõ"}`,
              iconURL: this.client.user?.displayAvatarURL(),
            })
            .setTimestamp(new Date()),
        ],
      });
    }
  }

  // Xử lý cập nhật ghi đè quyền
  private async handleChannelOverwriteUpdate(oldChannel: GuildChannel, newChannel: GuildChannel) {
    if (!(await isEventEnabled(newChannel.guild.id, "channelOverwriteUpdate", this.client.db)))
      return;

    const changes: string[] = [];
    const memberDetails: { name: string; avatar: string }[] = [];

    for (const [id, overwrite] of oldChannel.permissionOverwrites.cache) {
      const newOverwrite = newChannel.permissionOverwrites.cache.get(id);
      if (!newOverwrite) {
        changes.push(
          `**Đã gỡ quyền cho:** ${
            overwrite.type === OverwriteType.Member ? `<@${id}>` : `<@&${id}>`
          }`
        );
      } else if (
        overwrite.allow.bitfield !== newOverwrite.allow.bitfield ||
        overwrite.deny.bitfield !== newOverwrite.deny.bitfield
      ) {
        changes.push(
          `**Quyền đã thay đổi cho:** ${
            overwrite.type === OverwriteType.Member ? `<@${id}>` : `<@&${id}>`
          }`
        );

        // Fetch user info if it's a member overwrite
        if (overwrite.type === OverwriteType.Member) {
          try {
            const member = await newChannel.guild.members.fetch(id);
            memberDetails.push({
              name: member.user.tag,
              avatar: member.user.displayAvatarURL(),
            });
          } catch {
            memberDetails.push({
              name: `Người dùng không rõ (${id})`,
              avatar: this.client.user?.displayAvatarURL() || "",
            });
          }
        }
      }
    }

    if (changes.length > 0) {
      const logChannel = await getModLogChannel(newChannel.guild.id, this.client);
      if (!logChannel) return;

      const authorDetails = memberDetails[0] || {
        name: "Không rõ",
        avatar: this.client.user?.displayAvatarURL() || "",
      };

      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1e90ff)
            .setAuthor({
              name: authorDetails.name,
              iconURL: authorDetails.avatar,
            })
            .setThumbnail(authorDetails.avatar || this.client.user?.displayAvatarURL() || "")
            .setDescription(`**Quyền kênh đã được cập nhật**\n <#${newChannel.id}>`)
            .addFields({
              name: "Thay đổi",
              value: changes.join("\n"),
              inline: false,
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

  // Xử lý cập nhật slowmode
  private async handleChannelSlowmodeUpdate(oldChannel: GuildChannel, newChannel: GuildChannel) {
    if (!(await isEventEnabled(newChannel.guild.id, "channelSlowmodeUpdate", this.client.db)))
      return;

    if ("rateLimitPerUser" in oldChannel && "rateLimitPerUser" in newChannel) {
      if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
        const logChannel = await getModLogChannel(newChannel.guild.id, this.client);
        if (!logChannel) return;

        await logChannel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0x1e90ff)
              .setTitle("🐢 Slowmode đã thay đổi")
              .setDescription(
                `**Kênh:** <#${newChannel.id}>\n**Slowmode (trước):** ${oldChannel.rateLimitPerUser} giây\n**Slowmode (mới):** ${newChannel.rateLimitPerUser} giây`
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

  // Xử lý chuyển đổi NSFW
  private async handleChannelNSFWToggle(oldChannel: GuildChannel, newChannel: GuildChannel) {
    if (!(await isEventEnabled(newChannel.guild.id, "channelNSFWToggle", this.client.db))) return;

    if ("nsfw" in oldChannel && "nsfw" in newChannel) {
      if (oldChannel.nsfw !== newChannel.nsfw) {
        const logChannel = await getModLogChannel(newChannel.guild.id, this.client);
        if (!logChannel) return;

        const status = newChannel.nsfw ? "đã đánh dấu NSFW" : "đã bỏ đánh dấu NSFW";

        await logChannel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff4500)
              .setTitle("🔞 Trạng thái NSFW của kênh đã thay đổi")
              .setDescription(`**Kênh:** <#${newChannel.id}> hiện ${status}`)
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

  // Xử lý sự kiện cập nhật ghim kênh
  private async handleChannelPinsUpdate(channel: TextBasedChannel, time: Date) {
    // Đảm bảo đây là kênh thuộc server (guild)
    if (!("guild" in channel)) return;

    const guild = (channel as TextChannel | NewsChannel | ThreadChannel | VoiceChannel).guild;
    if (!guild) return;

    if (!(await isEventEnabled(guild.id, "channelPinsUpdate", this.client.db))) return;

    const logChannel = await getModLogChannel(guild.id, this.client);
    if (!logChannel) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xffd700)
          .setTitle("📌 Ghim kênh đã được cập nhật")
          .setDescription(
            `Ghim đã được cập nhật trong **<#${channel.id}>** vào ${time.toISOString()}`
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

  // Xử lý sự kiện tạo ghi đè quyền
  private async handlePermissionOverwriteCreate(channel: GuildChannel, overwrite: any) {
    if (!(await isEventEnabled(channel.guild.id, "channelOverwriteCreate", this.client.db))) return;

    const logChannel = await getModLogChannel(channel.guild.id, this.client);
    if (!logChannel) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x1e90ff)
          .setTitle("🔧 Ghi đè quyền đã được tạo")
          .setDescription(`Đã tạo ghi đè quyền cho **<#${channel.id}>**`)
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

  // Xử lý sự kiện cập nhật webhook
  private async handleWebhookUpdate(channel: GuildChannel) {
    if (!(await isEventEnabled(channel.guild.id, "webhookUpdate", this.client.db))) return;

    const logChannel = await getModLogChannel(channel.guild.id, this.client);
    if (!logChannel) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle("🔧 Webhook đã được cập nhật")
          .setDescription(`Một webhook trong **<#${channel.id}>** đã được cập nhật.`)
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

  // Xử lý sự kiện cập nhật thread
  private async handleThreadUpdate(oldThread: ThreadChannel, newThread: ThreadChannel) {
    if (!(await isEventEnabled(newThread.guild.id, "threadUpdate", this.client.db))) return;

    const logChannel = await getModLogChannel(newThread.guild.id, this.client);
    if (!logChannel) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x1e90ff)
          .setTitle("🧵 Chủ đề (Thread) đã được cập nhật")
          .setDescription(`Chủ đề **<#${newThread.id}>** đã được cập nhật.`)
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
