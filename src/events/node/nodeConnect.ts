import { Manager } from "../../manager.js";
import { ZklinkNode } from "../../Zklink/main.js";
import chalk from "chalk";

export default class {
  execute(client: Manager, node: ZklinkNode) {
    client.lavalinkUsing.push({
      host: node.options.host,
      port: Number(node.options.port) | 0,
      pass: node.options.auth,
      secure: node.options.secure,
      name: node.options.name,
    });

    // Log đã bị xóa - Lavalink node đã kết nối
  }
}
