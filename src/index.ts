import { Manager } from "./manager.js";
import { ConfigData } from "./services/ConfigData.js";
// Logging đã bị xóa

const configData = new ConfigData().data;
const zk = new Manager(configData, configData.features.MESSAGE_CONTENT.enable);
// Anti crash handling
process
  .on("unhandledRejection", (error) => {/* Log đã bị xóa - Unhandled rejection */})
  .on("uncaughtException", (error) => {/* Log đã bị xóa - Uncaught exception */})
  .on("uncaughtExceptionMonitor", (error) => {/* Log đã bị xóa - Exception monitor */})
  .on("exit", () => {
    // Log đã bị xóa - Zk Music's đã tắt thành công
  })
  .on("SIGINT", () => {
    // Log đã bị xóa - Đang tắt Zk Music's
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
