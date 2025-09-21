import { Manager } from "../../manager.js";
import { logInfo } from "../../utilities/Logger.js";

export default class {
  async execute(client: Manager) {
    logInfo(
      "ClientReconnect",
      `Đã kết nối lại ${client.user!.tag} (${client.user!.id})`
    );
  }
}
