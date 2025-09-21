import { Manager } from "../manager.js";

export interface LoggerOptions {
  metadata?: any;
}

export class Logger {
  private static instance: Logger;
  private manager: Manager | null = null;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setManager(manager: Manager) {
    this.manager = manager;
  }

  public info(source: string, message: string, options?: LoggerOptions) {
    if (this.manager?.logger) {
      this.manager.logger.info(source, message, options);
    } else {
      console.log(`[INFO] ${source}: ${message}`, options?.metadata || '');
    }
  }

  public debug(source: string, message: string, options?: LoggerOptions) {
    if (this.manager?.logger) {
      this.manager.logger.debug(source, message, options);
    } else {
      console.log(`[DEBUG] ${source}: ${message}`, options?.metadata || '');
    }
  }

  public warn(source: string, message: string, options?: LoggerOptions) {
    if (this.manager?.logger) {
      this.manager.logger.warn(source, message, options);
    } else {
      console.warn(`[WARN] ${source}: ${message}`, options?.metadata || '');
    }
  }

  public error(source: string, message: unknown, options?: LoggerOptions) {
    if (this.manager?.logger) {
      this.manager.logger.error(source, message, options);
    } else {
      console.error(`[ERROR] ${source}:`, message, options?.metadata || '');
    }
  }

  public unhandled(source: string, message: unknown, options?: LoggerOptions) {
    if (this.manager?.logger) {
      this.manager.logger.unhandled(source, message, options);
    } else {
      console.error(`[UNHANDLED] ${source}:`, message, options?.metadata || '');
    }
  }
}

// Singleton instance để sử dụng global
export const logger = Logger.getInstance();

// Helper functions để sử dụng nhanh
export const logInfo = (source: string, message: string, metadata?: any) => 
  logger.info(source, message, { metadata });

export const logDebug = (source: string, message: string, metadata?: any) => 
  logger.debug(source, message, { metadata });

export const logWarn = (source: string, message: string, metadata?: any) => 
  logger.warn(source, message, { metadata });

export const logError = (source: string, message: unknown, metadata?: any) => 
  logger.error(source, message, { metadata });

export const logUnhandled = (source: string, message: unknown, metadata?: any) => 
  logger.unhandled(source, message, { metadata });