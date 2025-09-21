import { Manager } from "../../manager.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { ZklinkNode } from "../../Zklink/main.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import chalk from "chalk";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";

export default class {
  async execute(client: Manager, node: ZklinkNode, error: Error) {
    logDebug(
      "NodeError",
      chalk.greenBright(`Lavalink "${node.options.name}" lỗi ${error}`)
    );
  }
}
