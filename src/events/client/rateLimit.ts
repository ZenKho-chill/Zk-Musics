import { Manager } from "../../manager.js";

export default class {
  async execute(client: Manager) {
  client.logger.error("ClientRateLimited", `Bị giới hạn tốc độ, đang ngủ trong ${0} giây`);
  }
}