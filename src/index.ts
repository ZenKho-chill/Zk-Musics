import { Manager } from "./manager.js";
import { ConfigData } from "./services/ConfigData.js";

const configData = new ConfigData().data;
const zk = new Manager(configData, configData.features.MESSAGE_CONTENT.enable);
// Anti crash handling
process
  .on("unhandledRejection", (error) => zk.logger.unhandled("AntiCrash", error))
  .on("uncaughtException", (error) => zk.logger.unhandled("AntiCrash", error))
  .on("uncaughtExceptionMonitor", (error) =>
    zk.logger.unhandled("AntiCrash", error)
  )
  .on("exit", () =>
    zk.logger.info(
      "ClientManager",
      `Zk Music's đã tắt thành công. Hẹn gặp lại lần sau!`
    )
  )
  .on("SIGINT", () => {
    zk.logger.info("ClientManager", `Đang tắt Zk Music's...`);
    process.exit(0);
  });
zk.start();
