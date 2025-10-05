import { Manager } from "../../manager.js";
import { log } from "../../utilities/LoggerHelper.js";

export default class {
  async execute(client: Manager) {
    log.info("Discord client reconnecting", "Attempting to reconnect to Discord");
  }
}
