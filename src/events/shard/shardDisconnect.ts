import { Manager } from "../../manager.js";
import chalk from "chalk";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";

export default class {
  async execute(client: Manager, error: Error, id: number) {
    logWarn("ShardDisconnect", chalk.redBright(`Shard ${id} đã ngắt kết nối!`));
  }
}
