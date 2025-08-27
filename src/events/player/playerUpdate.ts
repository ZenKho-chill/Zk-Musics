import { Manager } from "../../manager.js";
import { ZkslinkPlayer } from "../../zklink/main.js";

export default class {
  async execute(client: Manager, player: ZkslinkPlayer, data: unknown) {
    client.emit("playerUpdate", player);
  }
}