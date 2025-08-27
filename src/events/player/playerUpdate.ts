import { Manager } from "../../manager.js";
import { ZklinkPlayer } from "../../zklink/main.js";

export default class {
  async execute(client: Manager, player: ZklinkPlayer, data: unknown) {
    client.emit("playerUpdate", player);
  }
}