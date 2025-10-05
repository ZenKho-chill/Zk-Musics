import { Manager } from "./manager.js";
import { ConfigData } from "./services/ConfigData.js";
import { LoggerHelper, log } from "./utilities/LoggerHelper.js";

const configData = ConfigData.getInstance().data;
const zk = new Manager(configData, configData.features.MESSAGE_CONTENT.enable);

// Anti crash handling với logging
process
  .on("unhandledRejection", (error) => {
    log.unhandled("UnhandledRejection", error as Error);
  })
  .on("uncaughtException", (error) => {
    log.unhandled("UncaughtException", error as Error);
  })
  .on("uncaughtExceptionMonitor", (error) => {
    log.unhandled("UncaughtExceptionMonitor", error as Error);
  })
  .on("exit", () => {
    log.info("Zk Music's đã tắt thành công", "Process exit");
  })
  .on("SIGINT", () => {
    log.info("Đang tắt Zk Music's", "SIGINT received");
    // Dừng tất cả nowplaying tracking
    try {
      const { NowPlayingUpdateService } = require("./services/NowPlayingUpdateService.js");
      NowPlayingUpdateService.getInstance().stopAllTracking();
    } catch (error) {
      // Ignore errors during shutdown
    }
    process.exit(0);
  });

zk.start();
