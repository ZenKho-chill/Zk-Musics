import { Manager } from "../../manager.js";
import { ZkslinkNode } from "../../zklink/main.js";
import chalk from "chalk";

export default class {
  async execute(client: Manager, node: ZkslinkNode, error: Error) {
    client.logger.debug(
      "NodeError",
      chalk.greenBright(`Lavalink "${node.options.name}" lỗi ${error}`)
    );
  }
}
