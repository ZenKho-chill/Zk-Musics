import { Manager } from "../../manager.js";
import { logError } from "../../utilities/Logger.js";

export default class {
  async execute(client: Manager) {
    logError("ClientRateLimited", `Bị giới hạn tốc độ, đang ngủ trong ${0} giây`);
  }
}
