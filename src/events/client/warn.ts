import { Manager } from "../../manager.js";
import { log } from "../../utilities/LoggerHelper.js";

export default class {
  async execute(client: Manager, warning: string) {
    log.warn("Discord client warning", warning);
  }
}
