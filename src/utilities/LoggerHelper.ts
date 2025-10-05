import { Logger, LogLevel } from "../structures/Logger.js";
import { Manager } from "../manager.js";
import chalk from "chalk";

/**
 * Helper functions để sử dụng logger dễ dàng hơn
 * Cung cấp các shorthand methods cho từng loại log với màu sắc đẹp
 */
export class LoggerHelper {
  private static logger = Logger.getInstance();
  private static client: Manager | null = null;

  /**
   * Thiết lập client reference để kiểm tra debug mode
   */
  public static setClient(client: Manager): void {
    this.client = client;
  }

  /**
   * Kiểm tra debug mode từ config
   */
  private static isDebugEnabled(): boolean {
    return this.client?.config?.bot?.DEBUG_MODE ?? false;
  }

  /**
   * Tạo message với màu sắc đẹp cho icon và text
   */
  private static colorizeMessage(icon: string, message: string, color: string = "white"): string {
    const coloredIcon = chalk.bold(icon);
    const coloredMessage = (chalk as any)[color](message);
    return `${coloredIcon} ${coloredMessage}`;
  }

  /**
   * Detect caller file path từ stack trace
   */
  private static getCallerFile(): string {
    const error = new Error();
    const stack = error.stack?.split("\n");
    
    if (!stack || stack.length < 5) return "system";

    // Tìm stack frame của caller (không phải LoggerHelper)
    for (let i = 3; i < stack.length; i++) {
      const line = stack[i];
      if (line.includes("file://") && !line.includes("LoggerHelper") && !line.includes("Logger")) {
        try {
          let match = line.match(/file:\/\/\/(.+?):\d+:\d+/) || line.match(/at .+ \((.+?):\d+:\d+\)/);
          if (match) {
            let fullPath = match[1].replace(/\\/g, "/");
            
            let srcIndex = fullPath.lastIndexOf("/src/");
            let distIndex = fullPath.lastIndexOf("/dist/");
            
            if (srcIndex !== -1) {
              const relativePath = fullPath.substring(srcIndex + 5);
              return relativePath.replace(/\.(ts|js)$/, "");
            } else if (distIndex !== -1) {
              const relativePath = fullPath.substring(distIndex + 6);
              return relativePath.replace(/\.(ts|js)$/, "");
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }

    return "system";
  }

  /**
   * Log với file path tự động detect
   */
  private static logWithAutoPath(level: LogLevel, message: string, description?: string, metadata?: Record<string, any>): void {
    const filePath = this.getCallerFile();
    this.logger.logWithPath(filePath, level, message, description, metadata);
  }

  /**
   * Log thông tin thành công - LUÔN hiển thị
   */
  public static success(message: string, description?: string, metadata?: Record<string, any>): void {
    const coloredMessage = this.colorizeMessage("✅", message, "green");
    this.logWithAutoPath(LogLevel.INFO, coloredMessage, description, metadata);
  }

  /**
   * Log thông tin khởi động - LUÔN hiển thị
   */
  public static startup(message: string, description?: string, metadata?: Record<string, any>): void {
    const coloredMessage = this.colorizeMessage("🚀", message, "cyan");
    this.logWithAutoPath(LogLevel.INFO, coloredMessage, description, metadata);
  }

  /**
   * Log thông tin kết nối - LUÔN hiển thị
   */
  public static connection(message: string, description?: string, metadata?: Record<string, any>): void {
    const coloredMessage = this.colorizeMessage("🔗", message, "blue");
    this.logWithAutoPath(LogLevel.INFO, coloredMessage, description, metadata);
  }

  /**
   * Log thông tin database - LUÔN hiển thị
   */
  public static database(message: string, description?: string, metadata?: Record<string, any>): void {
    const coloredMessage = this.colorizeMessage("💾", message, "yellow");
    this.logWithAutoPath(LogLevel.INFO, coloredMessage, description, metadata);
  }

  /**
   * Log thông tin command - LUÔN hiển thị
   */
  public static command(message: string, description?: string, metadata?: Record<string, any>): void {
    const coloredMessage = this.colorizeMessage("⚡", message, "magenta");
    this.logWithAutoPath(LogLevel.INFO, coloredMessage, description, metadata);
  }

  /**
   * Log thông tin event - LUÔN hiển thị
   */
  public static event(message: string, description?: string, metadata?: Record<string, any>): void {
    const coloredMessage = this.colorizeMessage("📡", message, "cyan");
    this.logWithAutoPath(LogLevel.INFO, coloredMessage, description, metadata);
  }

  /**
   * Log thông tin music/player - LUÔN hiển thị
   */
  public static music(message: string, description?: string, metadata?: Record<string, any>): void {
    const coloredMessage = this.colorizeMessage("🎵", message, "green");
    this.logWithAutoPath(LogLevel.INFO, coloredMessage, description, metadata);
  }

  /**
   * Log thông tin web server - LUÔN hiển thị
   */
  public static web(message: string, description?: string, metadata?: Record<string, any>): void {
    const coloredMessage = this.colorizeMessage("🌐", message, "blue");
    this.logWithAutoPath(LogLevel.INFO, coloredMessage, description, metadata);
  }

  /**
   * Log thông tin cơ bản - LUÔN hiển thị
   */
  public static info(message: string, description?: string, metadata?: Record<string, any>): void {
    this.logWithAutoPath(LogLevel.INFO, message, description, metadata);
  }

  /**
   * Log debug thông tin - CHỈ hiển thị khi DEBUG_MODE = true
   * Dành cho thông tin development và troubleshooting
   */
  public static debug(message: string, description?: string, metadata?: Record<string, any>): void {
    // Chỉ log debug khi DEBUG_MODE được bật trong config
    if (this.isDebugEnabled()) {
      const coloredMessage = this.colorizeMessage("🔍", message, "gray");
      this.logWithAutoPath(LogLevel.DEBUG, coloredMessage, description, metadata);
    }
  }

  /**
   * Log development info - CHỈ hiển thị khi DEBUG_MODE = true
   * Alias cho debug() với tên rõ ràng hơn
   */
  public static dev(message: string, description?: string, metadata?: Record<string, any>): void {
    if (this.isDebugEnabled()) {
      const coloredMessage = this.colorizeMessage("🧑‍💻", `DEV: ${message}`, "cyan");
      this.logWithAutoPath(LogLevel.DEBUG, coloredMessage, description, metadata);
    }
  }

  /**
   * Log troubleshooting info - CHỈ hiển thị khi DEBUG_MODE = true  
   * Dành cho việc debug và tìm lỗi
   */
  public static troubleshoot(message: string, description?: string, metadata?: Record<string, any>): void {
    if (this.isDebugEnabled()) {
      const coloredMessage = this.colorizeMessage("🔧", `TROUBLESHOOT: ${message}`, "yellow");
      this.logWithAutoPath(LogLevel.DEBUG, coloredMessage, description, metadata);
    }
  }

  /**
   * Log verbose info - CHỈ hiển thị khi DEBUG_MODE = true
   * Dành cho thông tin chi tiết trong development
   */
  public static verbose(message: string, description?: string, metadata?: Record<string, any>): void {
    if (this.isDebugEnabled()) {
      const coloredMessage = this.colorizeMessage("📝", `VERBOSE: ${message}`, "gray");
      this.logWithAutoPath(LogLevel.DEBUG, coloredMessage, description, metadata);
    }
  }

  /**
   * Log cảnh báo - LUÔN hiển thị
   */
  public static warn(message: string, description?: string, metadata?: Record<string, any>): void {
    const coloredMessage = this.colorizeMessage("⚠️", message, "yellow");
    this.logWithAutoPath(LogLevel.WARN, coloredMessage, description, metadata);
  }

  /**
   * Log lỗi thông thường - LUÔN hiển thị
   */
  public static error(message: string, description?: string, error?: Error, metadata?: Record<string, any>): void {
    const finalMetadata = { ...metadata };
    
    if (error) {
      finalMetadata.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    const coloredMessage = this.colorizeMessage("❌", message, "red");
    this.logWithAutoPath(LogLevel.ERROR, coloredMessage, description, finalMetadata);
  }

  /**
   * Log lỗi nghiêm trọng - LUÔN hiển thị
   */
  public static critical(message: string, description?: string, error?: Error, metadata?: Record<string, any>): void {
    const finalMetadata = { ...metadata };
    
    if (error) {
      finalMetadata.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    const coloredMessage = this.colorizeMessage("🚨", `CRITICAL: ${message}`, "red");
    this.logWithAutoPath(LogLevel.ERROR, coloredMessage, description, finalMetadata);
  }

  /**
   * Log lỗi không được xử lý - LUÔN hiển thị
   */
  public static unhandled(component: string, error: Error, metadata?: Record<string, any>): void {
    const finalMetadata = { 
      ...metadata,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };

    const coloredMessage = this.colorizeMessage("💥", `Lỗi không được xử lý trong ${component}`, "red");
    this.logWithAutoPath(
      LogLevel.UNHANDLED,
      coloredMessage,
      `Component: ${component} | Error: ${error.message}`,
      finalMetadata
    );
  }

  /**
   * Log với file path cụ thể
   */
  public static logWithPath(
    filePath: string,
    level: LogLevel,
    message: string,
    description?: string,
    metadata?: Record<string, any>
  ): void {
    Logger.getInstance().logWithPath(filePath, level, message, description, metadata);
  }

  /**
   * Log loading progress - LUÔN hiển thị
   */
  public static loading(current: number, total: number, item: string, description?: string): void {
    const percentage = Math.round((current / total) * 100);
    const coloredMessage = this.colorizeMessage("⏳", `Đang tải ${item}`, "cyan");
    this.logWithAutoPath(
      LogLevel.INFO,
      coloredMessage,
      description || `Tiến độ: ${current}/${total} (${percentage}%)`,
      { current, total, percentage }
    );
  }

  /**
   * Log completion - LUÔN hiển thị
   */
  public static completed(item: string, total: number, description?: string): void {
    const coloredMessage = this.colorizeMessage("✨", `Hoàn thành tải ${item}`, "green");
    this.logWithAutoPath(
      LogLevel.INFO,
      coloredMessage,
      description || `Tổng số: ${total}`,
      { total }
    );
  }

  /**
   * Log user action - LUÔN hiển thị
   */
  public static userAction(
    userId: string,
    action: string,
    guildId?: string,
    description?: string,
    metadata?: Record<string, any>
  ): void {
    const coloredMessage = this.colorizeMessage("👤", `Hành động người dùng: ${action}`, "blue");
    this.logWithAutoPath(
      LogLevel.INFO,
      coloredMessage,
      description,
      {
        userId,
        guildId,
        action,
        ...metadata
      }
    );
  }

  /**
   * Log system performance - LUÔN hiển thị
   */
  public static performance(
    operation: string,
    duration: number,
    description?: string,
    metadata?: Record<string, any>
  ): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO;
    const icon = duration > 5000 ? "⚠️" : "⚡";
    const color = duration > 5000 ? "yellow" : "green";
    const message = duration > 5000 ? `Hiệu suất chậm: ${operation}` : `Hoàn thành: ${operation}`;
    const coloredMessage = this.colorizeMessage(icon, message, color);
    
    this.logWithAutoPath(
      level,
      coloredMessage,
      description || `Thời gian thực hiện: ${duration}ms`,
      {
        operation,
        duration,
        slow: duration > 5000,
        ...metadata
      }
    );
  }

  /**
   * Log security events - LUÔN hiển thị
   */
  public static security(
    event: string,
    userId?: string,
    guildId?: string,
    description?: string,
    metadata?: Record<string, any>
  ): void {
    const coloredMessage = this.colorizeMessage("🔒", `Sự kiện bảo mật: ${event}`, "red");
    this.logWithAutoPath(
      LogLevel.WARN,
      coloredMessage,
      description,
      {
        userId,
        guildId,
        event,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    );
  }

  /**
   * Log cleanup operations - LUÔN hiển thị
   */
  public static cleanup(operation: string, itemsProcessed: number, description?: string): void {
    const coloredMessage = this.colorizeMessage("🧹", `Dọn dẹp: ${operation}`, "yellow");
    this.logWithAutoPath(
      LogLevel.INFO,
      coloredMessage,
      description || `Đã xử lý ${itemsProcessed} mục`,
      { operation, itemsProcessed }
    );
  }

  /**
   * Log banner/header đẹp mắt - LUÔN hiển thị
   */
  public static banner(title: string, version?: string): void {
    const line = chalk.cyan("=".repeat(60));
    const titleLine = chalk.bold.yellow(`🎵 ${title.toUpperCase()} 🎵`);
    const versionLine = version ? chalk.gray(`Version: ${version}`) : "";
    
    console.log(line);
    console.log(chalk.cyan("=") + " ".repeat(58) + chalk.cyan("="));
    console.log(chalk.cyan("=") + " ".repeat(Math.floor((58 - titleLine.length) / 2)) + titleLine + " ".repeat(Math.ceil((58 - titleLine.length) / 2)) + chalk.cyan("="));
    if (versionLine) {
      console.log(chalk.cyan("=") + " ".repeat(Math.floor((58 - versionLine.length) / 2)) + versionLine + " ".repeat(Math.ceil((58 - versionLine.length) / 2)) + chalk.cyan("="));
    }
    console.log(chalk.cyan("=") + " ".repeat(58) + chalk.cyan("="));
    console.log(line);
    console.log("");
  }

  /**
   * Log separator đẹp mắt
   */
  public static separator(title?: string): void {
    if (title) {
      const line = chalk.gray("─".repeat(20)) + ` ${chalk.bold.white(title)} ` + chalk.gray("─".repeat(20));
      console.log(line);
    } else {
      console.log(chalk.gray("─".repeat(60)));
    }
  }

  /**
   * Log progress bar đẹp mắt
   */
  public static progressBar(current: number, total: number, message: string): void {
    const percentage = Math.round((current / total) * 100);
    const barLength = 30;
    const filledLength = Math.round(barLength * (current / total));
    const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);
    
    const coloredBar = chalk.green("█".repeat(filledLength)) + chalk.gray("░".repeat(barLength - filledLength));
    const percentageText = chalk.bold.cyan(`${percentage}%`);
    const progressText = chalk.white(`${current}/${total}`);
    
    console.log(`${this.colorizeMessage("📊", message, "cyan")} [${coloredBar}] ${percentageText} (${progressText})`);
  }

  /**
   * Get logger instance trực tiếp nếu cần thiết
   */
  public static getLogger(): Logger {
    return this.logger;
  }
}

/**
 * Shorthand exports để sử dụng nhanh
 */
export const log = LoggerHelper;
export const logger = Logger.getInstance();