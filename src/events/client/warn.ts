import { Manager } from "../../manager.js";
import { logWarn } from "../../utilities/Logger.js";

export default class {
  async execute(client: Manager) {
    logWarn("ClientWarning", `Có cảnh báo ${client.user!.tag} (${client.user!.id})`);
  }
}
