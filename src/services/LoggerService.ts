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

    log.info("Clean Log", "Khởi động hệ thống dọn dẹp log files tự động");
  }

  /**
   * Log thông tin client khi khởi động
   */
  public logClientInfo(): void {
    log.info("Client Info", `Đã sẵn sàng với ${this.client.guilds.cache.size} servers`);
    log.info("Client Info", `Tổng số members: ${this.client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)}`);
    log.info("Client Info", `Tổng số channels: ${this.client.channels.cache.size}`);
  }

  /**
   * Thực hiện dọn dẹp log files cũ
   */
  private async performCleanup(): Promise<void> {
    try {
      log.info("Clean Log", "Bắt đầu dọn dẹp log files cũ...");
      
      // Cleanup log files cũ hơn 30 ngày
      await this.logger.cleanupOldLogs(30);
      
      // Lấy thống kê sau khi cleanup
      const stats = await this.logger.getLogStats();
      
      log.info("Clean Log", stats.totalFiles || 0, `Tổng dung lượng: ${this.formatBytes(stats.totalSize || 0)}` );
      
    } catch (error) {
      log.error("Clean Log", `Dọn dẹp log cũ thất bại | ${error as Error}`);
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

}