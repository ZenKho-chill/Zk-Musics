import { Manager } from "../manager.js";
import { ConfigData } from "../services/ConfigData.js";
import { ClusterManager } from "./ClusterManager.js";

export function bootBot(clusterManager?: ClusterManager) {
  const configData = new ConfigData().data;
  const zk = new Manager(configData, configData.features.MESSAGE_CONTENT.enable, clusterManager);

  // Xử lý chống crash
  process
    .on("unhandledRejection", (error) => {/* Log đã bị xóa - Unhandled rejection */})
    .on("uncaughtException", (error) => {/* Log đã bị xóa - Uncaught exception */})
    .on("uncaughtExceptionMonitor", (error) => {/* Log đã bị xóa - Exception monitor */})
    .on("exit", () => {/* Log đã bị xóa - Zk Music's đã tắt */})
    .on("SIGINT", () => {
      // Log đã bị xóa - Đang tắt Zk Music's
      process.exit(0);
    });

  zk.start();
}
