import { Manager } from "../../manager.js";
import { ZklinkNode } from "../../Zklink/main.js";
import chalk from "chalk";

export default class {
  async execute(client: Manager, node: ZklinkNode, error: Error) {
    client.logger.debug(
      "NodeError",
      chalk.greenBright(`Lavalink "${node.options.name}" lỗi ${error}`)
    );
  }
}
