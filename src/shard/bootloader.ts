import { Manager } from "../manager.js";
import { ConfigData } from "../services/ConfigData.js";
import { ClusterManager } from "./ClusterManager.js";

export function bootBot(clusterManager?: ClusterManager) {
  const configData = new ConfigData().data;
  const zk = new Manager(
    configData,
    configData.features.MESSAGE_CONTENT.enable,
    clusterManager
  );

  // Xử lý chống crash
  process
    .on("unhandledRejection", (error) =>
      zk.logger.unhandled("AntiCrash", error)
    )
    .on("uncaughtException", (error) => zk.logger.unhandled("AntiCrash", error))
    .on("uncaughtExceptionMonitor", (error) =>
      zk.logger.unhandled("AntiCrash", error)
    )
    .on("exit", () =>
      zk.logger.info("ClientManager", `Zk Music's đã tắt. Hẹn gặp lại lần sau!`)
    )
    .on("SIGINT", () => {
      zk.logger.info("ClientManager", `Đang tắt Zk Music's...`);
      process.exit(0);
    });

  zk.start();
}
