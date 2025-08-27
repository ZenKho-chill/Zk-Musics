import { Manager } from "../../manager.js";

export default class {
  async execute(client: Manager) {
  client.logger.info("ClientReconnect", `Đã kết nối lại ${client.user!.tag} (${client.user!.id})`);
  }
}