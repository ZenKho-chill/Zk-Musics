import { Manager } from "../../manager.js";
import { log } from "../../utilities/LoggerHelper.js";

export default class {
  async execute(client: Manager, error: Error) {
    log.error("Lỗi Discord client", "Discord client error occurred", error);
  }
}
