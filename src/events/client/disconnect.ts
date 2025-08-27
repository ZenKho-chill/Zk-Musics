import { Manager } from "../../manager.js";

export default class {
  async execute(client: Manager) {
  client.logger.info("ClientDisconnect", `Đã ngắt kết nối ${client.user!.tag} (${client.user!.id})`);
  }
}