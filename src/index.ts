import { Manager } from "./manager.js";
import { ConfigData } from "./services/ConfigData.js";
import { LoggerHelper, log } from "./utilities/LoggerHelper.js";

const configData = ConfigData.getInstance().data;
const zk = new Manager(configData, configData.features.MESSAGE_CONTENT.enable);

// Anti crash handling với logging
process
  .on("unhandledRejection", (error, promise) => {
    log.unhandled("UnhandledRejection", `Promise: ${promise}`, error as Error);
  })
  .on("uncaughtException", (error) => {
    log.unhandled("UncaughtException", undefined, error as Error);
  })
  .on("uncaughtExceptionMonitor", (error) => {
    log.unhandled("UncaughtExceptionMonitor", undefined, error as Error);
  })
  .on("exit", () => {
    log.info("Tắt Zk Music's");
  })
  .on("SIGINT", () => {
    log.info("Đang tắt Zk Music's");
    // Dừng tất cả nowplaying tracking
    try {
      const { NowPlayingUpdateService } = require("./services/NowPlayingUpdateService.js");
      NowPlayingUpdateService.getInstance().stopAllTracking();
    } catch (error) {
      log.error("Đang tắt Zk Music's", `Dừng nowplaying tracking thất bại | ${error as Error}`);
    }
    process.exit(0);
  });

zk.start();
