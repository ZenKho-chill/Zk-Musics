import { Manager } from "../../manager.js";
import { ZklinkPlayer } from "../../Zklink/main.js";

export default class {
  async execute(client: Manager, player: ZklinkPlayer, data: unknown) {
    client.emit("playerUpdate", player);
  }
}
