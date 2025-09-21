import { Manager } from "../../manager.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import chalk from "chalk";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";

export default class {
  async execute(client: Manager, id: number) {
    logError("ShardError", chalk.redBright(`Shard ${id} gặp lỗi!`));
  }
}
