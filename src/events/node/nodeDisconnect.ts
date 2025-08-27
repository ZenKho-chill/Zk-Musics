import { Manager } from "../../manager.js";
import { ZkslinkNode } from "../../zklink/main.js";
import chalk from "chalk";

export default class {
  execute(client: Manager, node: ZklinkNode, code: number, reason: Buffer) {
    client.zklink.players.forEach((player, index) => {
      if (player.node.options.name == node.options.name)
        player.destroy().catch(() => {});
    });
    client.logger.debug(
      "NodeDisconnect",
      chalk.red(
        `Lavalink ${node.options.name}: Đã ngắt kết nối, Mã: ${code}, Lý do: ${reason}`
      )
    );
  }
}
