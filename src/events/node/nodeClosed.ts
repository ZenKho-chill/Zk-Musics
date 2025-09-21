import { AutoFixLavalink } from "../../autofix/AutoFixLavalink.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Manager } from "../../manager.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { ZklinkNode } from "../../Zklink/main.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import chalk from "chalk";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";

export default class {
  async execute(client: Manager, node: ZklinkNode) {
    logDebug(
      "NodeClosed",
      chalk.rgb(255, 165, 0)(`Lavalink ${node.options.name}: Đã đóng`)
    );
    if (client.config.features.AUTOFIX_LAVALINK.enable) {
      new AutoFixLavalink(client, node.options.name);
    }
  }
}
