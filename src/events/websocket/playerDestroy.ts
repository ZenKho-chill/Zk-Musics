import { Manager } from "../../manager.js";
import { ZkslinkPlayer } from "../../zklink/main.js";

export default class {
  async execute(client: Manager, player: ZkslinkPlayer) {
    client.wsl.get(player.guildId)?.send({
      op: "playerDestroy",
      guild: player.guildId,
    });
  }
}