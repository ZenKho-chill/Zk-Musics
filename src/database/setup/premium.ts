import { Manager } from "../../manager.js";
import cron from "node-cron";
import { Premium } from "../schema/Premium.js";
import { GuildPremium } from "../schema/GuildPremium.js";
import { EmbedBuilder } from "discord.js";
// Log đã bị xóa - import Logger functions

export class PremiumScheduleSetup {
  client: Manager;
  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }

  async execute() {
    this.setupChecker();
    cron.schedule("0 * * * *", () => {
      // Log đã bị xóa - Đang chạy tác vụ theo lịch cho người dùng và guild Premium
      this.setupChecker();
    });
  }

  async setupChecker() {
    const premium = Array.from(await this.client.db.premium.all());
    const users = premium.filter(
      (data) => data.value.isPremium == true && data.value.expiresAt !== "lifetime"
    );
    if (users && users.length !== 0) this.checkUser(users.map((data) => data.value));
    // Log đã bị xóa - Đang kiểm tra người dùng Premium

    const premiumGuild = Array.from(await this.client.db.preGuild.all());
    const guilds = premiumGuild.filter(
      (data) => data.value.isPremium == true && data.value.expiresAt !== "lifetime"
    );
    if (guilds && guilds.length !== 0) this.checkGuild(guilds.map((data) => data.value));
    // Log đã bị xóa - Đang kiểm tra guild Premium
  }

  async checkUser(users: Premium[]) {
    for (let data of users) {
      try {
        if (data.expiresAt !== "lifetime" && Date.now() >= data.expiresAt) {
          await this.client.db.premium.delete(data.id);
          // Log đã bị xóa - Đã xóa Premium của người dùng

          const thumbnailURL = data.redeemedBy.avatarURL;
          // Send logs to a channel
          await this.sendLog(
            `Người dùng Premium hết hạn`,
            `**User:** \`${data.redeemedBy.username || "Unknown"} / ${
              data.redeemedBy.id || "Unknown"
            }\` \n**Plan:** \`${
              data.plan || "Unknown"
            }\`\n*Người dùng Premium đã hết hạn và đã bị gỡ bỏ.*`,
            thumbnailURL
          );
        }
      } catch (error) {
        // Log đã bị xóa - Không thể xóa người dùng
      }
    }
  }

  async checkGuild(guilds: GuildPremium[]) {
    for (let data of guilds) {
      try {
        if (data.expiresAt !== "lifetime" && Date.now() >= data.expiresAt) {
          await this.client.db.preGuild.delete(data.id);
          // Log đã bị xóa - Đã xóa Premium của guild
          const thumbnailURL = data.redeemedBy.GuildiconURL;
          // Send logs to a channel
          await this.sendLog(
            `Guild Premium hết hạn`,
            `**Guild:** \`${data.redeemedBy.name || "Unknown"} / ${
              data.redeemedBy.id || "Unknown"
            }\`\n**Owner:** \`${data.redeemedBy.ownerName || "Unknown"} / ${
              data.redeemedBy.ownerId || "Unknown"
            }\`\n**Plan:** \`${
              data.plan || "Unknown"
            }\`\n*Guild Premium đã hết hạn và đã bị gỡ bỏ.*`,
            thumbnailURL
          );
        }
      } catch (error) {
        // Log đã bị xóa - Không thể xóa guild
      }
    }
  }

  async sendLog(title: string, description: string, thumbnailURL: string) {
    // Log channel đã bị xóa - Chức năng gửi log premium expire đã bị vô hiệu hóa
    // Vẫn giữ method này để tránh lỗi nhưng không thực thi gì
    return;
  }
}
