import { AutoFixLavalink } from "../../autofix/AutoFixLavalink.js";
import { Manager } from "../../manager.js";
import { ZklinkNode } from "../../Zklink/main.js";
import chalk from "chalk";

export default class {
  async execute(client: Manager, node: ZklinkNode) {
    // Log đã bị xóa - Node Lavalink đã đóng
    if (client.config.features.AUTOFIX_LAVALINK.enable) {
      new AutoFixLavalink(client, node.options.name);
    }
  }
}
