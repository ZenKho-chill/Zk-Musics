import { Logger, LogLevel } from "../structures/Logger.js";
import { Manager } from "../manager.js";

/**
 * Helper functions để sử dụng logger dễ dàng hơn
 * Chỉ có 5 types: info, debug, warn, error, unhandled
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
   * INFO - Thông tin quan trọng cần tracking
   */
  public static info(message: string, description?: string, metadata?: Record<string, any>): void {
    this.logWithAutoPath(LogLevel.INFO, message, description, metadata);
  }

  /**
   * DEBUG - Chỉ hiển thị khi DEBUG_MODE = true
   */
  public static debug(message: string, description?: string, metadata?: Record<string, any>): void {
    if (this.isDebugEnabled()) {
      this.logWithAutoPath(LogLevel.DEBUG, message, description, metadata);
    }
  }

  /**
   * WARN - Cảnh báo quan trọng
   */
  public static warn(message: string, description?: string, metadata?: Record<string, any>): void {
    this.logWithAutoPath(LogLevel.WARN, message, description, metadata);
  }

  /**
   * ERROR - Lỗi với stack trace
   */
  public static error(message: string, description?: string, error?: Error, metadata?: Record<string, any>): void {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...metadata
    } : metadata;
    
    this.logWithAutoPath(LogLevel.ERROR, message, description, errorData);
  }

  /**
   * UNHANDLED - Lỗi không xử lý được (crash prevention)
   */
  public static unhandled(message: string, description?: string, error?: Error, metadata?: Record<string, any>): void {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...metadata
    } : metadata;
    
    this.logWithAutoPath(LogLevel.ERROR, `[UNHANDLED] ${message}`, description, errorData);
  }
}

/**
 * Export shorthand log object với các methods đơn giản
 */
export const log = {
  info: LoggerHelper.info.bind(LoggerHelper),
  debug: LoggerHelper.debug.bind(LoggerHelper), 
  warn: LoggerHelper.warn.bind(LoggerHelper),
  error: LoggerHelper.error.bind(LoggerHelper),
  unhandled: LoggerHelper.unhandled.bind(LoggerHelper)
} as const;