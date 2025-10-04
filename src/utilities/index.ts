import { logInfo, logDebug, logWarn, logError, logUnhandled } from "./Logger.js";
// Logger System Exports
// Hệ thống logger tập trung sử dụng Winston với format: timestamp | level | source | message | metadata

export { Logger, LoggerOptions, logger, logInfo, logDebug, logWarn, logError, logUnhandled } from "./Logger.js";

// Re-export LogManager cho compatibility
export { LogManager } from "../services/LogManager.js";

// Export LavalinkHeaderHelper cho tự động hóa User-Id
export { LavalinkHeaderHelper } from "./LavalinkHeaderHelper.js";

// Convenience function để tạo logger với source cố định
export function createSourceLogger(source: string) {
  return {
    info: (message: string, metadata?: any) => logInfo(source, message, metadata),
    debug: (message: string, metadata?: any) => logDebug(source, message, metadata),
    warn: (message: string, metadata?: any) => logWarn(source, message, metadata),
    error: (message: unknown, metadata?: any) => logError(source, message, metadata),
    unhandled: (message: unknown, metadata?: any) => logUnhandled(source, message, metadata),
  };
}

// Import utilities
