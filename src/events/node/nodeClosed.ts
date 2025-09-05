import { AutoFixLavalink } from "../../autofix/AutoFixLavalink.js";
import { Manager } from "../../manager.js";
import { ZklinkNode } from "../../Zklink/main.js";
import chalk from "chalk";

export default class {
  async execute(client: Manager, node: ZklinkNode) {
    client.logger.debug(
      "NodeClosed",
      chalk.rgb(255, 165, 0)(`Lavalink ${node.options.name}: Đã đóng`)
    );
    if (client.config.features.AUTOFIX_LAVALINK.enable) {
      new AutoFixLavalink(client, node.options.name);
    }
  }
}
