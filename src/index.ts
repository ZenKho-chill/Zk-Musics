import { Manager } from "./manager.js";
import { ConfigData } from "./services/ConfigData.js";
import { logInfo, logUnhandled } from "./utilities/Logger.js";

const configData = new ConfigData().data;
const zk = new Manager(configData, configData.features.MESSAGE_CONTENT.enable);
// Anti crash handling
process
  .on("unhandledRejection", (error) => logUnhandled("AntiCrash", error))
  .on("uncaughtException", (error) => logUnhandled("AntiCrash", error))
  .on("uncaughtExceptionMonitor", (error) => logUnhandled("AntiCrash", error))
  .on("exit", () =>
    logInfo("ClientManager", `Zk Music's đã tắt thành công. Hẹn gặp lại lần sau!`)
  )
  .on("SIGINT", () => {
    logInfo("ClientManager", `Đang tắt Zk Music's...`);
    process.exit(0);
  });
zk.start();
