import { Manager } from "../../manager.js";
import { ZklinkNode } from "../../Zklink/main.js";
import chalk from "chalk";

export default class {
  execute(client: Manager, node: ZklinkNode, code: number, reason: Buffer) {
    client.Zklink.players.forEach((player, index) => {
      if (player.node.options.name == node.options.name) player.destroy().catch(() => {});
    });
    // Log đã bị xóa - Node đã ngắt kết nối
  }
}
