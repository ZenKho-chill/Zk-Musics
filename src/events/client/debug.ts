import util from "node:util";
import { Manager } from "../../manager.js";
import { logDebug } from "../../utilities/Logger.js";

export default class {
  async execute(client: Manager, logs: string) {
    if (client.config.bot.DEBUG_MODE)
      return logDebug("ClientDebug", `${util.inspect(logs)}`);
  }
}
