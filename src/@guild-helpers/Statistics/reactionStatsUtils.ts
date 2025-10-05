import { Manager } from "../../manager.js";
import { MessageReaction, PartialMessageReaction, User, PartialUser } from "discord.js";
import { updateReactionStats } from "./StatisticsUtils.js";


export class handleReactionStats {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.Init();
  }
  private Init() {
    this.client.on(
      "messageReactionAdd",
      async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
        // Nếu reaction hoặc user là partial, lấy đối tượng đầy đủ
        if (reaction.partial) {
          try {
            await reaction.fetch();
          } catch (error) {
            // Log đã bị xóa - Error không thể lấy reaction
            return;
          }
        }

        if (user.partial) {
          try {
            await user.fetch();
          } catch (error) {
            // Log đã bị xóa - Error không thể lấy user
            return;
          }
        }

        if (!reaction.message.guild || user.bot) return; // Bỏ qua reaction từ bot

        await updateReactionStats(reaction as MessageReaction, user as User, this.client);
      }
    );
  }
}
