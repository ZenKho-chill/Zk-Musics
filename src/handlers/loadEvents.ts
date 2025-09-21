import readdirRecursive from "recursive-readdir";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { resolve } from "path";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { join, dirname } from "path";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { fileURLToPath, pathToFileURL } from "url";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Manager } from "../manager.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
const __dirname = dirname(fileURLToPath(import.meta.url));

export class ClientEventsLoader {
  client: Manager;
  counter: number = 0;
  constructor(client: Manager) {
    this.client = client;
    this.loader();
  }
  async loader() {
    for (const path of ["client", "guild", "shard", "websocket"]) {
      let eventsPath = resolve(join(__dirname, "..", "events", path));
      let eventsFile = await readdirRecursive(eventsPath);
      await this.registerPath(eventsFile);
    }
    this.logInfo(ClientEventsLoader.name, `${this.counter} Sự kiện đã được tải!`);
  }

  async registerPath(eventsPath: string[]) {
    for await (const path of eventsPath) {
      await this.registerEvents(path);
    }
  }

  async registerEvents(path: string) {
    const events = new (await import(pathToFileURL(path).toString())).default();

    var splitPath = function (str: string) {
      return str.split("\\").pop()!.split("/").pop()!.split(".")[0];
    };

    const eName = splitPath(path);

    this.client.on(eName!, events.execute.bind(null, this.client));
  }
}
