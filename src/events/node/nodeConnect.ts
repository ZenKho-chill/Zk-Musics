import { Manager } from "../../manager.js";
import { ZklinkNode } from "../../zklink/main.js";
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

    client.logger.info(
      "NodeConnect",
      chalk.green(`Lavalink [${node.options.name}] đã kết nối.`)
    );
  }
}
