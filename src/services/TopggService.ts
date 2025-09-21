import cron from "node-cron";
import { Snowflake } from "discord.js";
import { Manager } from "../manager.js";
import { request } from "undici";
import chalk from "chalk";
import { logDebug, logInfo, logWarn, logError } from "../utilities/Logger.js";
export enum TopggServiceEnum {
  ERROR,
  VOTED,
  UNVOTED,
}

export class TopggService {
  isTokenAvalible: boolean = false;
  botId?: string;
  url: string = "https://top.gg/api";
  shardCount: number;

  constructor(private client: Manager) {
    this.shardCount = client.clusterManager?.totalShards ?? 1;
  }

  public async settingUp(userId: Snowflake) {
    const res = await this.fetch(`/bots/${userId}/stats`);
    if (res.status == 200) {
      this.isTokenAvalible = true;
      this.botId = userId;
      logInfo(
        TopggService.name,
        chalk.italic(`Dịch vụ TopGG đã được cài đặt thành công!`)
      );
      return true;
    }
    logWarn(TopggService.name, "Có sự cố khi cài đặt dịch vụ TopGG");
    logWarn(TopggService.name, await res.text());
    return false;
  }

  public async checkVote(userId: string): Promise<TopggServiceEnum> {
    if (!this.botId || !this.isTokenAvalible) {
      logError(
        TopggService.name,
        "Dịch vụ TopGG chưa được cấu hình! check vote sẽ luôn trả về lỗi"
      );
      return TopggServiceEnum.ERROR;
    }
    const res = await this.fetch(`/bots/${this.botId}/check?userId=${userId}`);
    if (res.status !== 200) {
      logError(TopggService.name, "Có lỗi khi lấy dữ liệu từ top.gg");
      return TopggServiceEnum.ERROR;
    }
    const jsonRes = (await res.json()) as { voted: number };
    if (jsonRes.voted !== 0) return TopggServiceEnum.VOTED;
    return TopggServiceEnum.UNVOTED;
  }

  private async fetch(path: string) {
    return await fetch(this.url + path, {
      headers: {
        Authorization: this.client.config.features.WebServer.TOPGG_VOTELOGS.TopGgToken,
      },
    });
  }

  public async startInterval() {
    if (!this.botId || !this.isTokenAvalible) throw new Error("Topgg Statistic chưa cấu hình!");
    this.updateStatisticCount(this.client.guilds.cache.size, this.shardCount);
    cron.schedule("0 */1 * * * *", () =>
      this.updateStatisticCount(this.client.guilds.cache.size, this.shardCount)
    );
    logInfo(
      TopggService.name,
      chalk.italic(`Thống kê TopGG đã được bật thành công!`)
    );
  }

  public async updateStatisticCount(serverCount: number, shardCount: number) {
    if (!this.botId || !this.isTokenAvalible) throw new Error("Topgg Statistic chưa cấu hình!");
    await request(this.url + `/bots/${this.botId}/stats`, {
      method: "POST",
      body: JSON.stringify({
        server_count: serverCount,
        shard_count: shardCount,
      }),
      headers: {
        Authorization: this.client.config.features.WebServer.TOPGG_VOTELOGS.TopGgToken,
        "Content-Type": "application/json",
      },
    });
  }
}
