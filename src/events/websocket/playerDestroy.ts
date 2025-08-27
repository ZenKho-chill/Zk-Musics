import { Manager } from "../../manager.js";
import { ZklinkPlayer } from "../../zklink/main.js";

export default class {
  async execute(client: Manager, player: ZklinkPlayer) {
    client.wsl.get(player.guildId)?.send({
      op: "playerDestroy",
      guild: player.guildId,
    });
  }
}