import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import fs from "fs-extra";

/**
 * Enum định nghĩa các cấp độ log
 */
export enum LogLevel {
  INFO = "info",
  DEBUG = "debug", 
  WARN = "warn",
  ERROR = "error",
  UNHANDLED = "unhandled"
}

/**
 * Interface cho log entry
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  description?: string;
  filePath?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

/**
 * Hệ thống logging cho Zk Music's
 * Hỗ trợ console output và file rotation
 */
export class Logger {
  private static instance: Logger;
  private winston: winston.Logger;
  private logDir: string;
  private srcDir: string;

  private constructor() {
    // Tạo thư mục logs nếu chưa tồn tại
    this.logDir = path.join(process.cwd(), "logs");
    this.srcDir = path.join(process.cwd(), "src");
    this.ensureLogDirectory();
    this.initializeWinston();
  }

  /**
   * Singleton pattern
   */
  public static getInstance(): Logger {
    if (!this.instance) {
      this.instance = new Logger();
    }
    return this.instance;
  }

  /**
   * Đảm bảo thư mục logs tồn tại
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Khởi tạo Winston logger
   */
  private initializeWinston(): void {
    // Custom format cho console và file
    const customFormat = winston.format.printf(({ timestamp, level, message, filePath, description, metadata }) => {
      const formattedTimestamp = new Date(timestamp as string).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });

      const levelUpper = level.toUpperCase();
      const file = filePath || "system";
      const desc = description ? ` | ${description}` : "";
      const meta = metadata ? ` | ${JSON.stringify(metadata)}` : "";
      
      return `${formattedTimestamp} | ${levelUpper} | ${file} | ${message}${desc}${meta}`;
    });

    // Console format với màu sắc đẹp mắt
    const consoleFormat = winston.format.printf(({ timestamp, level, message, filePath, description, metadata }) => {
      const formattedTimestamp = new Date(timestamp as string).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit", 
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });

      const file = filePath || "system";
      const desc = description || "";
      const meta = metadata ? ` ${JSON.stringify(metadata)}` : "";

      // Màu sắc đẹp cho từng component
      const coloredTimestamp = chalk.cyan.bold(formattedTimestamp);
      const coloredFile = chalk.magenta.italic(file);
      const coloredDesc = desc ? chalk.gray(` | ${desc}`) : "";
      const coloredMeta = meta ? chalk.dim(` | ${meta.substring(3)}`) : "";

      // Màu sắc theo level với icon
      let coloredLevel: string;
      let coloredMessage: string;
      
      switch (level) {
        case LogLevel.ERROR:
        case LogLevel.UNHANDLED:
          coloredLevel = chalk.red.bold(`[${level.toUpperCase()}]`);
          coloredMessage = chalk.red.bold(message as string);
          break;
        case LogLevel.WARN:
          coloredLevel = chalk.yellow.bold(`[${level.toUpperCase()}]`);
          coloredMessage = chalk.yellow(message as string);
          break;
        case LogLevel.INFO:
          coloredLevel = chalk.blue.bold(`[${level.toUpperCase()}]`);
          coloredMessage = chalk.white(message as string);
          break;
        case LogLevel.DEBUG:
          coloredLevel = chalk.gray.bold(`[${level.toUpperCase()}]`);
          coloredMessage = chalk.gray(message as string);
          break;
        default:
          coloredLevel = chalk.white.bold(`[${level.toUpperCase()}]`);
          coloredMessage = chalk.white(message as string);
      }

      // Format đẹp với separator
      const separator = chalk.gray(" | ");
      
      return `${coloredTimestamp}${separator}${coloredLevel}${separator}${coloredFile}${separator}${coloredMessage}${coloredDesc}${coloredMeta}`;
    });

    // Transports
    const transports: winston.transport[] = [
      // Console transport (tất cả levels)
      new winston.transports.Console({
        level: "debug",
        format: winston.format.combine(
          winston.format.timestamp(),
          consoleFormat
        )
      })
    ];

    // File transports - chỉ 1 file combined (không bao gồm debug)
    const fileTransports = [
      // Combined logs (info, warn, error, unhandled - không có debug)
      new DailyRotateFile({
        filename: path.join(this.logDir, "zk-musics-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        level: "info",
        maxFiles: "30d",
        maxSize: "100m",
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format((info) => {
            // Lọc bỏ debug logs khỏi file
            return info.level === "debug" ? false : info;
          })(),
          customFormat
        )
      })
    ];

    transports.push(...fileTransports);

    // Tạo Winston logger
    this.winston = winston.createLogger({
      levels: {
        unhandled: 0,
        error: 1,
        warn: 2,
        info: 3,
        debug: 4
      },
      transports,
      exitOnError: false
    });

    // Thêm colors cho custom levels
    winston.addColors({
      unhandled: "red",
      error: "red",
      warn: "yellow", 
      info: "blue",
      debug: "gray"
    });
  }

  /**
   * Auto-detect file path từ call stack
   */
  private detectFilePath(): string {
    const error = new Error();
    const stack = error.stack?.split("\n");
    
    if (!stack || stack.length < 4) return "system";

    // Tìm stack frame đầu tiên không phải từ Logger hoặc LoggerHelper
    for (let i = 2; i < stack.length; i++) {
      const line = stack[i];
      if (line.includes("file://") && 
          !line.includes("Logger") && 
          !line.includes("LoggerHelper") &&
          !line.includes("structures/Logger") &&
          !line.includes("utilities/LoggerHelper")) {
        try {
          // Extract file path từ stack trace - pattern khác cho Windows/Linux
          let match = line.match(/file:\/\/\/(.+?):\d+:\d+/) || line.match(/at .+ \((.+?):\d+:\d+\)/);
          if (match) {
            let fullPath = match[1].replace(/\\/g, "/");
            
            // Tìm src/ hoặc dist/ trong đường dẫn
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
   * Log với level INFO
   */
  public info(message: string, description?: string, metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.INFO,
      message,
      description,
      metadata
    });
  }

  /**
   * Log với level DEBUG (chỉ hiển thị console)
   */
  public debug(message: string, description?: string, metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.DEBUG,
      message,
      description, 
      metadata
    });
  }

  /**
   * Log với level WARN
   */
  public warn(message: string, description?: string, metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.WARN,
      message,
      description,
      metadata
    });
  }

  /**
   * Log với level ERROR
   */
  public error(message: string, description?: string, error?: Error, metadata?: Record<string, any>): void {
    const finalMetadata = { ...metadata };
    
    if (error) {
      finalMetadata.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    this.log({
      level: LogLevel.ERROR,
      message,
      description,
      metadata: finalMetadata
    });
  }

  /**
   * Log với level UNHANDLED (cho các lỗi không được xử lý)
   */
  public unhandled(message: string, description?: string, error?: Error, metadata?: Record<string, any>): void {
    const finalMetadata = { ...metadata };
    
    if (error) {
      finalMetadata.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    this.log({
      level: LogLevel.UNHANDLED,
      message,
      description,
      metadata: finalMetadata
    });
  }

  /**
   * Log method chính
   */
  private log(entry: LogEntry): void {
    const filePath = entry.filePath || this.detectFilePath();
    
    this.winston.log(entry.level, entry.message, {
      filePath,
      description: entry.description,
      metadata: entry.metadata,
      timestamp: entry.timestamp || new Date()
    });
  }

  /**
   * Log với file path tùy chỉnh
   */
  public logWithPath(filePath: string, level: LogLevel, message: string, description?: string, metadata?: Record<string, any>): void {
    this.log({
      level,
      message,
      description,
      filePath,
      metadata
    });
  }

  /**
   * Cleanup old log files
   */
  public async cleanupOldLogs(daysToKeep: number = 30): Promise<void> {
    try {
      const files = await fs.readdir(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          this.info("Đã xóa log file cũ", `File: ${file}`);
        }
      }
    } catch (error) {
      this.error("Lỗi khi dọn dẹp log files", "Cleanup failed", error as Error);
    }
  }

  /**
   * Get log statistics
   */
  public async getLogStats(): Promise<Record<string, any>> {
    try {
      const files = await fs.readdir(this.logDir);
      const stats = {
        totalFiles: files.length,
        totalSize: 0,
        filesByType: {} as Record<string, number>
      };

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const fileStats = await fs.stat(filePath);
        stats.totalSize += fileStats.size;

        const type = file.split("-")[0];
        stats.filesByType[type] = (stats.filesByType[type] || 0) + 1;
      }

      return stats;
    } catch (error) {
      this.error("Lỗi khi lấy thống kê log", "Stats failed", error as Error);
      return {};
    }
  }
}