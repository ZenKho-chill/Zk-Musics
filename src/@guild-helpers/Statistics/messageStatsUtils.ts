import { Manager } from "../../manager.js";
import { Message } from "discord.js";
import { updateMessageCount } from "./StatisticsUtils.js";

export class handleMessageStats {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.Init();
  }
  private Init() {
    this.client.on("messageCreate", async (message: Message) => {
      if (!message.guild || message.author.bot) return; // Bỏ qua tin nhắn từ bot hoặc ngoài máy chủ

      // Cập nhật số tin nhắn cho người dùng, truyền `client`
      await updateMessageCount(message.guild.id, message.author.id, this.client);
    });
  }
}
