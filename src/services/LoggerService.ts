import { Logger } from "../structures/Logger.js";
import { LoggerHelper, log } from "../utilities/LoggerHelper.js";
import { Manager } from "../manager.js";
import cron from "node-cron";

/**
 * Service quản lý logger và tự động dọn dẹp log
 */
export class LoggerService {
  private static instance: LoggerService;
  private logger: Logger;
  private cleanupJob?: cron.ScheduledTask;
  private client: Manager;

  private constructor(client: Manager) {
    this.client = client;
    this.logger = Logger.getInstance();
    this.setupAutomaticCleanup();
  }

  /**
   * Singleton pattern
   */
  public static getInstance(client?: Manager): LoggerService {
    if (!this.instance && client) {
      this.instance = new LoggerService(client);
    }
    return this.instance;
  }

  /**
   * Thiết lập cleanup tự động - chạy mặc định
   */
  private setupAutomaticCleanup(): void {
    // Chạy cleanup mỗi ngày lúc 3:00 AM
    this.cleanupJob = cron.schedule("0 3 * * *", async () => {
      await this.performCleanup();
    }, {
      timezone: "Asia/Ho_Chi_Minh"
    });

    log.info("Đã kích hoạt dọn dẹp log tự động", "Chạy hàng ngày lúc 3:00 AM");
  }

  /**
   * Thực hiện dọn dẹp log files cũ
   */
  private async performCleanup(): Promise<void> {
    try {
      log.info("Bắt đầu dọn dẹp log files tự động", "Scheduled cleanup started");
      
      // Cleanup log files cũ hơn 30 ngày
      await this.logger.cleanupOldLogs(30);
      
      // Lấy thống kê sau khi cleanup
      const stats = await this.logger.getLogStats();
      
      log.info(
        "log files", 
        stats.totalFiles || 0,
        `Tổng dung lượng: ${this.formatBytes(stats.totalSize || 0)}`
      );
      
    } catch (error) {
      log.error("Lỗi khi dọn dẹp log files", "Cleanup failed", error as Error);
    }
  }

  /**
   * Format bytes thành readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Log system information khi khởi động
   */
  public logSystemInfo(): void {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    log.info("Thông tin hệ thống", "System information logged", {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: {
        rss: this.formatBytes(memUsage.rss),
        heapTotal: this.formatBytes(memUsage.heapTotal),
        heapUsed: this.formatBytes(memUsage.heapUsed),
        external: this.formatBytes(memUsage.external)
      },
      uptime: `${Math.floor(uptime)} seconds`,
      pid: process.pid
    });
  }

  /**
   * Log thông tin Discord client
   */
  public logClientInfo(): void {
    if (!this.client.user) return;
    
    const guilds = this.client.guilds.cache.size;
    const users = this.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const channels = this.client.channels.cache.size;

    log.info("Thông tin Discord client", "Client statistics logged", {
      clientId: this.client.user.id,
      clientTag: this.client.user.tag,
      guilds,
      users,
      channels,
      ping: this.client.ws.ping,
      shards: this.client.shard ? this.client.shard.count : 1
    });
  }
}