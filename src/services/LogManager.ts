import * as winston from "winston";
import "winston-daily-rotate-file";
import chalk from "chalk";
import util from "node:util";
import { Manager } from "../manager.js";
import { EmbedBuilder, TextChannel } from "discord.js";
import DailyRotateFile from "winston-daily-rotate-file";
const { timestamp, printf } = winston.format;

type LogLevel = "info" | "debug" | "warn" | "error" | "unhandled";

interface LogData {
  message: string;
  level: LogLevel;
  timestamp?: string;
  source?: string;
  metadata?: any;
}

interface LogOptions {
  metadata?: any;
}

export class LogManager {
  private preLog: winston.Logger;
  private padding = 28;
  
  constructor(
    private client: Manager,
    private clusterId: number
  ) {
    this.preLog = winston.createLogger({
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
        unhandled: 4,
      },

      transports: [
        new winston.transports.Console({
          level: "unhandled",
          format: this.consoleFormat,
        }),

        new DailyRotateFile({
          filename: "./logs/zk-%DATE%.log",
          datePattern: "HH-DD-MM-YYYY",
          zippedArchive: true,
          maxSize: "20m",
          format: this.fileFormat,
          maxFiles: "14d",
        }),
      ],
    });
  }

  public info(source: string, message: string, options?: LogOptions) {
    return this.preLog.log({
      level: "info",
      message: message,
      source: source,
      metadata: options?.metadata
    });
  }

  public debug(source: string, message: string, options?: LogOptions) {
    this.preLog.log({
      level: "debug",
      message: message,
      source: source,
      metadata: options?.metadata
    });
    return;
  }

  public warn(source: string, message: string, options?: LogOptions) {
    this.preLog.log({
      level: "warn", 
      message: message,
      source: source,
      metadata: options?.metadata
    });
    this.sendDiscord("warning", message, source);
    return;
  }

  public error(source: string, message: unknown, options?: LogOptions) {
    const errorMessage = typeof message === 'string' ? message : util.inspect(message);
    this.preLog.log({
      level: "error",
      message: errorMessage,
      source: source,
      metadata: options?.metadata
    });
    this.sendDiscord("error", errorMessage, source);
    return;
  }

  public unhandled(source: string, message: unknown, options?: LogOptions) {
    const errorMessage = typeof message === 'string' ? message : util.inspect(message);
    this.preLog.log({
      level: "unhandled",
      message: errorMessage,
      source: source,
      metadata: options?.metadata
    });
    this.sendDiscord("unhandled", errorMessage, source);
    return;
  }

  private filter(info: any) {
    const pad = 9;

    switch (info.level) {
      case "info":
        return chalk.hex("#00CFF0")(info.level.toUpperCase().padEnd(pad));
      case "debug":
        return chalk.hex("#F5A900")(info.level.toUpperCase().padEnd(pad));
      case "warn":
        return chalk.hex("#FBEC5D")(info.level.toUpperCase().padEnd(pad));
      case "error":
        return chalk.hex("#e12885")(info.level.toUpperCase().padEnd(pad));
      case "unhandled":
        return chalk.hex("#ff0000")(info.level.toUpperCase().padEnd(pad));
    }
  }

  private get consoleFormat() {
    const colored = chalk.hex("#86cecb")("|");
    const timeStamp = (info: any) => chalk.hex("#00ddc0")(info.timestamp);
    const msg = (info: any) => chalk.hex("#86cecb")(info.message);
    const source = (info: any) => chalk.hex("#86cecb")(info.source?.padEnd(this.padding) || "Unknown".padEnd(this.padding));
    const cluster = chalk.hex("#86cecb")(`CỤM_${this.clusterId}`);
    const zk = chalk.hex("#f4e0c7")(`ZK MUSIC'S`);
    const metadata = (info: any) => info.metadata ? chalk.hex("#808080")(`[${util.inspect(info.metadata, { compact: true, depth: 1 })}]`) : "";
    
    return winston.format.combine(
      timestamp(),
      printf((info: any) => {
        const metaStr = metadata(info);
        return `${timeStamp(info)} ${colored} ${zk} ${colored} ${this.filter(
          info
        )} ${colored} ${cluster} ${colored} ${source(info)} ${colored} ${msg(info)}${metaStr ? ' ' + metaStr : ''}`;
      })
    );
  }

  private get fileFormat() {
    const pad = 9;
    return winston.format.combine(
      timestamp(),
      printf((info: any) => {
        const metaStr = info.metadata ? ` | ${util.inspect(info.metadata, { compact: true, depth: 1 })}` : "";
        return `${info.timestamp} | ${info.level.toUpperCase().padEnd(pad)} | ${info.source?.padEnd(this.padding) || "Unknown".padEnd(this.padding)} | ${info.message}${metaStr}`;
      })
    );
  }

  private async sendDiscord(type: string, message: string, className: string) {
    // Kiểm tra xem logchannel có được cấu hình không
    if (!this.client.config.logchannel) return;

    const channelId = this.client.config.logchannel.ErrorChannelID;
    if (!channelId || channelId.length == 0) return;
    try {
      const channel = (await this.client.channels
        .fetch(channelId)
        .catch(() => undefined)) as TextChannel;
      if (!channel || !channel.isTextBased()) return;
      let embed = null;
      if (message.length > 4096) {
        embed = new EmbedBuilder()
          .setDescription("Log dài quá để hiển thị! Vui lòng kiểm tra host của bạn!")
          .setTitle(`${type} từ ${className}`)
          .setColor(this.client.color_main);
      } else {
        embed = new EmbedBuilder()
          .setDescription(`\`\`\`${message}\`\`\``)
          .setTitle(`${type} từ ${className}`)
          .setColor(this.client.color_main);
      }

      await channel.messages.channel.send({ embeds: [embed] });
    } catch (err) {}
  }
}
