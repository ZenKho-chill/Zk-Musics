import { Manager } from "../../manager.js";
import { Message } from "discord.js";
import { updateTopChannelsStats } from "./StatisticsUtils.js";

export class handleTopChannelsStats {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.Init();
  }
  private Init() {
    this.client.on("messageCreate", async (message: Message) => {
      if (!message.guild || message.author.bot) return; // Bỏ qua tin nhắn từ bot hoặc ngoài máy chủ

      const guildId = message.guild.id;
      const userId = message.author.id;
      const channelId = message.channel.id;

      // Cập nhật thống kê top kênh cho người dùng
      await updateTopChannelsStats(guildId, userId, channelId, this.client);
    });
  }
}
