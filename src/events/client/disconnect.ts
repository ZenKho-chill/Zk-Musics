import { Manager } from "../../manager.js";
import { log } from "../../utilities/LoggerHelper.js";

export default class {
  async execute(client: Manager) {
    log.warn("Discord client disconnected", "Connection lost to Discord");
  }
}
