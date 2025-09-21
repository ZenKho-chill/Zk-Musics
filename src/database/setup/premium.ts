import { Manager } from "../../manager.js";
import cron from "node-cron";
import { Premium } from "../schema/Premium.js";
import { GuildPremium } from "../schema/GuildPremium.js";
import { EmbedBuilder } from "discord.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";

export class PremiumScheduleSetup {
  client: Manager;
  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }

  async execute() {
    this.setupChecker();
    cron.schedule("0 * * * *", () => {
      logInfo(
        PremiumScheduleSetup.name,
        "Đang chạy tác vụ theo lịch cho người dùng và guild Premium"
      );
      this.setupChecker();
    });
  }

  async setupChecker() {
    const premium = Array.from(await this.client.db.premium.all());
    const users = premium.filter(
      (data) => data.value.isPremium == true && data.value.expiresAt !== "lifetime"
    );
    if (users && users.length !== 0) this.checkUser(users.map((data) => data.value));
    logInfo(
      PremiumScheduleSetup.name,
      `Đang kiểm tra ${users.length} người dùng Premium`
    );

    const premiumGuild = Array.from(await this.client.db.preGuild.all());
    const guilds = premiumGuild.filter(
      (data) => data.value.isPremium == true && data.value.expiresAt !== "lifetime"
    );
    if (guilds && guilds.length !== 0) this.checkGuild(guilds.map((data) => data.value));
    logInfo(
      PremiumScheduleSetup.name,
      `Đang kiểm tra ${guilds.length} guild Premium`
    );
  }

  async checkUser(users: Premium[]) {
    for (let data of users) {
      try {
        if (data.expiresAt !== "lifetime" && Date.now() >= data.expiresAt) {
          await this.client.db.premium.delete(data.id);
          logInfo(
            PremiumScheduleSetup.name,
            `Đã xóa Premium của người dùng ${data.redeemedBy.username}`
          );

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
        logError(PremiumScheduleSetup.name, `Không thể xóa người dùng ${data.id}`);
      }
    }
  }

  async checkGuild(guilds: GuildPremium[]) {
    for (let data of guilds) {
      try {
        if (data.expiresAt !== "lifetime" && Date.now() >= data.expiresAt) {
          await this.client.db.preGuild.delete(data.id);
          logInfo(
            PremiumScheduleSetup.name,
            `Đã xóa Premium của guild ${data.redeemedBy.name}`
          );
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
        logError(PremiumScheduleSetup.name, `Không thể xóa guild ${data.id}`);
      }
    }
  }

  async sendLog(title: string, description: string, thumbnailURL: string) {
    try {
      if (!this.client.config.logchannel.PremiumExpireChannelID) return;

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setThumbnail(thumbnailURL ?? this.client.user?.displayAvatarURL())
        .setTimestamp()
        .setColor(this.client.color_main);

      const channel = await this.client.channels
        .fetch(this.client.config.logchannel.PremiumExpireChannelID)
        .catch(() => undefined);

      if (!channel || (channel && !channel.isTextBased())) return;

      channel.send({ embeds: [embed] });
    } catch (error) {
      logError(PremiumScheduleSetup.name, "Gửi log tới kênh thất bại: " + error);
    }
  }
}
