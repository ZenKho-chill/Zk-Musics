import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  CommandInteraction,
  Guild,
  Snowflake,
  GuildTextBasedChannel,
  Message,
  User,
} from "discord.js";
import { Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { UserStatistics } from "../../database/schema/UserStatistics.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";

const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["statistics", "user"];
  public description = "Hiển thị thống kê hoạt động của bạn.";
  public category = "Info";
  public accessableby = data.COMMANDS_ACCESS.INFO.StatisticUser;
  public usage = "<user> hoặc <user1> <user2>";
  public aliases = [];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "user1",
      type: ApplicationCommandOptionType.User,
      description: "Người dùng đầu tiên để hiển thị thống kê.",
      required: false,
    },
    {
      name: "user2",
      type: ApplicationCommandOptionType.User,
      description: "Người dùng thứ hai để so sánh thống kê.",
      required: false,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    if (!handler.interaction) return;
    const interaction = handler.interaction as any;

    // Phân tích các tuỳ chọn
    const user1 = interaction.options.get("user1")?.user || interaction.user;
    const user2 = interaction.options.get("user2")?.user || null;

    await handler.deferReply();

    const guildId = handler.guild?.id;
    if (!guildId) return;

    // Lấy thống kê cho người dùng thứ nhất
    const user1Stats = await fetchUserStats(client, guildId, user1.id, interaction.guild);

    if (user2) {
      // Lấy thống kê cho người dùng thứ hai nếu có
      const user2Stats = await fetchUserStats(client, guildId, user2.id, interaction.guild);

      // So sánh thống kê
      const comparisonEmbed = buildComparisonEmbed(user1, user1Stats, user2, user2Stats, client);
      await handler.editReply({ embeds: [comparisonEmbed] });
    } else {
      // Hiển thị thống kê cho một người dùng
      const statsEmbed = buildStatsEmbed(user1, user1Stats, client);
      await handler.editReply({ embeds: [statsEmbed] });
    }
  }
}

// Hàm lấy thống kê người dùng từ cơ sở dữ liệu
async function fetchUserStats(client: Manager, guildId: string, userId: string, guild: Guild) {
  let stats = await client.db.UserStatistics.get(`${userId}`);

  if (!stats) {
    const today = new Date().setHours(0, 0, 0, 0);
    const member = await guild.members.fetch(userId).catch(() => null);
    stats = {
      guildId,
      userId,
      messageCount: 0,
      voiceTime: 0,
      reactionCount: 0,
      topChannels: {},
      voiceJoinTime: null,
      lastUpdated: Date.now(),
      joinDate: member?.joinedTimestamp || Date.now(),
      daysActive: 0,
      firstMessageDate: null,
      lastActiveDay: today,
    };
    await client.db.UserStatistics.set(`${userId}`, stats);
  }

  // Fetch first message date if missing
  if (!stats.firstMessageDate) {
    const firstMessageDate = await fetchFirstMessageDate(guild, userId);
    stats.firstMessageDate =
      firstMessageDate !== "N/A" ? new Date(firstMessageDate).getTime() : null;
    await client.db.UserStatistics.set(`${userId}`, stats);
  }

  return stats;
}

// Hàm xây dựng embed cho thống kê của một người dùng
function buildStatsEmbed(user: User, stats: UserStatistics, client: Manager) {
  const topChannels =
    Object.entries(stats.topChannels || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([channel, count]) => `• <#${channel}>: \`${count} tin nhắn\``)
      .join("\n") || "Không có dữ liệu kênh";

  return new EmbedBuilder()
    .setDescription(`**Thống kê cho <@${user.id}>**`) // Đề cập chính xác trong mô tả
    .setColor(client.color_main)
    .setThumbnail(user.displayAvatarURL({ size: 512 }))
    .addFields(
      { name: "Số tin nhắn", value: `\`${stats.messageCount}\``, inline: true },
      {
        name: "Thời gian trong kênh thoại",
        value: `\`${formatTime(stats.voiceTime)}\``,
        inline: true,
      },
      { name: "Phản ứng", value: `\`${stats.reactionCount}\``, inline: true },
      { name: "Kênh hoạt động hàng đầu", value: topChannels, inline: true },
      {
        name: "Số ngày hoạt động",
        value: `\`${stats.daysActive}\``,
        inline: true,
      },
      {
        name: "Ngày tham gia",
        value: stats.joinDate
          ? `<t:${Math.floor(stats.joinDate / 1000)}:F> (<t:${Math.floor(
              stats.joinDate / 1000
            )}:R>)`
          : "Không rõ",
        inline: false,
      },
      {
        name: "Ngày tin nhắn đầu tiên",
        value: stats.firstMessageDate
          ? `<t:${Math.floor(
              stats.firstMessageDate / 1000
            )}:F> (<t:${Math.floor(stats.firstMessageDate / 1000)}:R>)`
          : "Không có",
        inline: false,
      }
    );
}

// Hàm xây dựng embed để so sánh thống kê của hai người dùng
function buildComparisonEmbed(
  user1: User,
  stats1: UserStatistics,
  user2: User,
  stats2: UserStatistics,
  client: Manager
) {
  const topChannelsUser1 =
    Object.entries(stats1.topChannels || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([channel, count]) => `• <#${channel}>: \`${count} tin nhắn\``)
      .join("\n") || "Không có dữ liệu kênh";

  const topChannelsUser2 =
    Object.entries(stats2.topChannels || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([channel, count]) => `• <#${channel}>: \`${count} tin nhắn\``)
      .join("\n") || "Không có dữ liệu kênh";

  return new EmbedBuilder()
    .setColor(client.color_main)
    .setThumbnail(client.user?.displayAvatarURL({ size: 512 }) ?? null)
    .addFields(
      {
        name: `Thống kê`,
        value: `**Thống kê của <@${user1.id}>**`,
        inline: false,
      }, // Di chuyển đề cập vào giá trị để hiển thị đúng
      {
        name: "Số tin nhắn",
        value: `\`${stats1.messageCount}\``,
        inline: true,
      },
      {
        name: "Thời gian trong kênh thoại",
        value: `\`${formatTime(stats1.voiceTime)}\``,
        inline: true,
      },
      { name: "Phản ứng", value: `\`${stats1.reactionCount}\``, inline: true },
      {
        name: "Kênh hoạt động hàng đầu",
        value: topChannelsUser1,
        inline: true,
      },
      {
        name: "Số ngày hoạt động",
        value: `\`${stats1.daysActive}\``,
        inline: true,
      },
      {
        name: "Ngày tham gia",
        value: stats1.joinDate
          ? `<t:${Math.floor(stats1.joinDate / 1000)}:F> (<t:${Math.floor(
              stats1.joinDate / 1000
            )}:R>)`
          : "Không rõ",
        inline: false,
      },
      {
        name: "Ngày tin nhắn đầu tiên",
        value: stats1.firstMessageDate
          ? `<t:${Math.floor(
              stats1.firstMessageDate / 1000
            )}:F> (<t:${Math.floor(stats1.firstMessageDate / 1000)}:R>)`
          : "Không có",
        inline: false,
      },
      {
        name: "\u200b",
        value: "\u200b",
        inline: false,
      },
      {
        name: `Thống kê`,
        value: `**Thống kê của <@${user2.id}>**`,
        inline: false,
      },
      {
        name: "Số tin nhắn",
        value: `\`${stats2.messageCount}\``,
        inline: true,
      },
      {
        name: "Thời gian trong kênh thoại",
        value: `\`${formatTime(stats2.voiceTime)}\``,
        inline: true,
      },
      { name: "Phản ứng", value: `\`${stats2.reactionCount}\``, inline: true },
      {
        name: "Kênh hoạt động hàng đầu",
        value: topChannelsUser2,
        inline: true,
      },
      {
        name: "Số ngày hoạt động",
        value: `\`${stats2.daysActive}\``,
        inline: true,
      },
      {
        name: "Ngày tham gia",
        value: stats2.joinDate
          ? `<t:${Math.floor(stats2.joinDate / 1000)}:F> (<t:${Math.floor(
              stats2.joinDate / 1000
            )}:R>)`
          : "Không rõ",
        inline: false,
      },
      {
        name: "Ngày tin nhắn đầu tiên",
        value: stats2.firstMessageDate
          ? `<t:${Math.floor(
              stats2.firstMessageDate / 1000
            )}:F> (<t:${Math.floor(stats2.firstMessageDate / 1000)}:R>)`
          : "Không có",
        inline: false,
      }
    );
}

// Hàm tiện ích
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.floor(minutes % 60);
  return `${hours}h ${remainingMinutes}m`;
}

async function fetchFirstMessageDate(guild: Guild, userId: Snowflake): Promise<string> {
  const channels = guild.channels.cache.filter((channel): channel is GuildTextBasedChannel =>
    channel.isTextBased()
  );
  let earliestMessageDate: number | null = null;

  for (const channel of channels.values()) {
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const userMessages = messages.filter((msg: Message) => msg.author.id === userId);

      const firstMessage = userMessages
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
        .first();

      if (firstMessage) {
        if (!earliestMessageDate || firstMessage.createdTimestamp < earliestMessageDate) {
          earliestMessageDate = firstMessage.createdTimestamp;
        }
      }
    } catch (error) {
      // Log đã bị xóa - Ghi lại lỗi khi lấy tin nhắn sớm nhất
      continue;
    }
  }

  return earliestMessageDate ? new Date(earliestMessageDate).toLocaleDateString() : "Không có";
}
