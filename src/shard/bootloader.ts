import { Manager } from "../manager.js";
import { ConfigData } from "../services/ConfigData.js";
import { ClusterManager } from "./ClusterManager.js";
import { log } from "../utilities/LoggerHelper.js";

export function bootBot(clusterManager?: ClusterManager) {
  const configData = ConfigData.getInstance().data;
  const zk = new Manager(configData, configData.features.MESSAGE_CONTENT.enable, clusterManager);

  // Xử lý chống crash
  process
    .on("unhandledRejection", (error) => {
      log.unhandled("UnhandledRejection", error as Error);
    })
    .on("uncaughtException", (error) => {
      log.unhandled("UncaughtException", error as Error);
    })
    .on("uncaughtExceptionMonitor", (error) => {
      log.unhandled("ExceptionMonitor", error as Error);
    })
    .on("exit", () => {
      log.info("Zk Music's đã tắt", "Process terminated");
    })
    .on("SIGINT", () => {
      log.warn("Đang tắt Zk Music's", "SIGINT received");
      process.exit(0);
    });

  zk.start();
}
