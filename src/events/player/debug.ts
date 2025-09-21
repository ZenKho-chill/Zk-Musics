import util from "node:util";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Manager } from "../../manager.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";

export default class {
  async execute(client: Manager, logs: string) {
    if (client.config.bot.DEBUG_MODE)
      return logDebug("ZklinkDebug", `${util.inspect(logs)}`);
  }
}
