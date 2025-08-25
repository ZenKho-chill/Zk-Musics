import { Manager } from "../../manager.js";
import { Message } from "discord.js";

export class handleActivityStats {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.Init();
  }
  private Init() {
    this.client.on("messageCreate", async (message: Message) => {
      // Bỏ qua tin nhắn không thuộc máy chủ hoặc từ bot
      if (!message.guild || message.author.bot) return;

      const guildId = message.guild.id;
      const userId = message.author.id;
      const today = new Date().setHours(0, 0, 0, 0); // Bắt đầu ngày hôm nay (0:00)

      // Lấy thống kê người dùng từ cơ sở dữ liệu
      let stats = await this.client.db.UserStatistics.get(`${userId}`);

      if (stats) {
        // Kiểm tra người dùng đã hoạt động hôm nay chưa
        if (stats.lastActiveDay !== today) {
          stats.daysActive += 1; // Tăng số ngày đã hoạt động
          stats.lastActiveDay = today; // Cập nhật ngày hoạt động cuối cùng thành hôm nay
        }

        // Cập nhật các thống kê khác (ví dụ: số tin nhắn)
        stats.messageCount += 1;
        stats.lastUpdated = Date.now();

        // Lưu thống kê đã cập nhật
        await this.client.db.UserStatistics.set(`${userId}`, stats);
      } else {
        // Tạo bản ghi mới nếu người dùng chưa có thống kê
        stats = {
          guildId,
          userId,
          messageCount: 1,
          voiceTime: 0,
          reactionCount: 0,
          topChannels: {},
          voiceJoinTime: null,
          lastUpdated: Date.now(),
          joinDate:
            message.guild.members.cache.get(userId)?.joinedTimestamp ||
            Date.now(),
          daysActive: 1,
          firstMessageDate: Date.now(),
          lastActiveDay: today, // Khởi tạo bằng ngày hôm nay
        };
        await this.client.db.UserStatistics.set(`${userId}`, stats);
      }
    });
  }
}
