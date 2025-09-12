import { Manager } from "../../manager.js";
import { VoiceState, MessageReaction, User } from "discord.js";

// Hàm cập nhật số tin nhắn
export async function updateMessageCount(guildId: string, userId: string, client: Manager) {
  const stats = await client.db.UserStatistics.get(`${userId}`); // Lấy thống kê hiện có theo key
  const today = new Date().setHours(0, 0, 0, 0); // Bắt đầu ngày hôm nay (0:00)

  if (stats) {
    // Cập nhật thống kê hiện có
    stats.messageCount += 1;

    // Đặt ngày tin nhắn đầu tiên nếu chưa có
    if (!stats.firstMessageDate) {
      stats.firstMessageDate = Date.now();
    }

    // Kiểm tra người dùng đã hoạt động hôm nay chưa
    if (stats.lastActiveDay !== today) {
      stats.daysActive = (stats.daysActive || 0) + 1; // Tăng số ngày đã hoạt động
      stats.lastActiveDay = today; // Cập nhật ngày hoạt động cuối cùng thành hôm nay
    }

    stats.lastUpdated = Date.now(); // Cập nhật timestamp
    await client.db.UserStatistics.set(`${userId}`, stats); // Lưu thống kê đã cập nhật
  } else {
    // Tạo bản ghi mới nếu người dùng chưa có thống kê
    await client.db.UserStatistics.set(`${userId}`, {
      guildId,
      userId,
      messageCount: 1,
      voiceTime: 0,
      reactionCount: 0,
      topChannels: {}, // Khởi tạo topChannels
      voiceJoinTime: null,
      lastUpdated: Date.now(),
      joinDate:
        client.guilds.cache.get(guildId)?.members.cache.get(userId)?.joinedTimestamp || Date.now(),
      daysActive: 1,
      firstMessageDate: Date.now(),
      lastActiveDay: today, // Khởi tạo bằng ngày hôm nay
    });
  }
}

// Hàm tính và cập nhật thời gian thoại
export async function updateVoiceTime(oldState: VoiceState, newState: VoiceState, client: Manager) {
  const userId = newState.id;
  const guildId = newState.guild?.id;

  // Nếu người dùng đang vào kênh thoại
  if (!oldState.channelId && newState.channelId) {
    const stats = await client.db.UserStatistics.get(`${userId}`);

    if (stats) {
      // Lưu thời gian tham gia vào cơ sở dữ liệu
      stats.voiceJoinTime = Date.now();
      stats.lastUpdated = Date.now();
      await client.db.UserStatistics.set(`${userId}`, stats);
    } else {
      // Nếu chưa có thống kê, tạo bản ghi mới
      await client.db.UserStatistics.set(`${userId}`, {
        guildId,
        userId,
        messageCount: 0,
        voiceTime: 0,
        reactionCount: 0,
        topChannels: {}, // Khởi tạo topChannels
        voiceJoinTime: Date.now(), // Đặt thời gian tham gia
        lastUpdated: Date.now(),
        joinDate:
          client.guilds.cache.get(guildId)?.members.cache.get(userId)?.joinedTimestamp ||
          Date.now(),
        daysActive: 0,
        firstMessageDate: null,
      });
    }
  }

  // Nếu người dùng rời kênh thoại
  if (oldState.channelId && !newState.channelId) {
    const stats = await client.db.UserStatistics.get(`${userId}`);

    if (stats && stats.voiceJoinTime) {
      // Tính thời gian đã ở trong kênh thoại
      const timeSpent = (Date.now() - stats.voiceJoinTime) / 60000; // Chuyển sang phút

      // Cập nhật thời gian thoại và đặt lại voiceJoinTime
      stats.voiceTime += timeSpent;
      stats.voiceJoinTime = null; // Đặt lại thời gian tham gia
      stats.lastUpdated = Date.now();

      // Lưu thống kê đã cập nhật
      await client.db.UserStatistics.set(`${userId}`, stats);
    }
  }
}

// Hàm cập nhật số lượng reaction
export async function updateReactionStats(reaction: MessageReaction, user: User, client: Manager) {
  const guild = reaction.message.guild;
  if (!guild) return; // Thoát nếu không có máy chủ (ví dụ DM)

  const guildId = guild.id;
  const userId = user.id;

  const stats = await client.db.UserStatistics.get(`${userId}`); // Lấy thống kê hiện có

  if (stats) {
    stats.reactionCount += 1;
    stats.lastUpdated = Date.now(); // Cập nhật timestamp
    await client.db.UserStatistics.set(`${userId}`, stats); // Lưu thống kê đã cập nhật
  } else {
    // Nếu người dùng chưa có thống kê, tạo bản ghi mới
    await client.db.UserStatistics.set(`${userId}`, {
      guildId,
      userId,
      messageCount: 0,
      voiceTime: 0,
      reactionCount: 1,
      topChannels: {},
      voiceJoinTime: null,
      lastUpdated: Date.now(),
      joinDate:
        client.guilds.cache.get(guildId)?.members.cache.get(userId)?.joinedTimestamp || Date.now(),
      daysActive: 0,
      firstMessageDate: null,
    });
  }
}

// Hàm cập nhật thống kê top kênh (số tin nhắn trên mỗi kênh)
export async function updateTopChannelsStats(
  guildId: string,
  userId: string,
  channelId: string,
  client: Manager
) {
  const stats = await client.db.UserStatistics.get(`${userId}`);

  if (stats) {
    // Cập nhật số tin nhắn cho kênh hiện tại
    stats.topChannels[channelId] = (stats.topChannels[channelId] || 0) + 1;
    stats.lastUpdated = Date.now(); // Cập nhật timestamp

    await client.db.UserStatistics.set(`${userId}`, stats);
  } else {
    // Nếu người dùng chưa có thống kê, tạo bản ghi mới
    await client.db.UserStatistics.set(`${userId}`, {
      guildId,
      userId,
      messageCount: 0,
      voiceTime: 0,
      reactionCount: 0,
      topChannels: { [channelId]: 1 },
      voiceJoinTime: null,
      lastUpdated: Date.now(),
      joinDate:
        client.guilds.cache.get(guildId)?.members.cache.get(userId)?.joinedTimestamp || Date.now(),
      daysActive: 0,
      firstMessageDate: null,
    });
  }
}
