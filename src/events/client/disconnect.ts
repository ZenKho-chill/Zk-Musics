import { Manager } from "../../manager.js";
import { logInfo } from "../../utilities/Logger.js";

export default class {
  async execute(client: Manager) {
    logInfo(
      "ClientDisconnect",
      `Đã ngắt kết nối ${client.user!.tag} (${client.user!.id})`
    );
  }
}
