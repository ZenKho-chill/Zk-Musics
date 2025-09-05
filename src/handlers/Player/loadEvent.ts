import readdirRecursive from "recursive-readdir";
import { resolve } from "path";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Manager } from "../../manager.js";
const __dirname = dirname(fileURLToPath(import.meta.url));

export class PlayerEventLoader {
  client: Manager;
  counter: number = 0;
  constructor(client: Manager) {
    this.client = client;
    this.loader();
  }

  async loader() {
    for (const path of ["player", "track", "node"]) {
      let eventsPath = resolve(join(__dirname, "..", "..", "events", path));
      let eventsFile = await readdirRecursive(eventsPath);
      await this.registerPath(eventsFile);
    }
    this.client.logger.info(
      PlayerEventLoader.name,
      `${this.counter} sự kiện đã được nạp!`
    );
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
    this.client.Zklink.on(
      eName as "voiceEndSpeaking",
      events.execute.bind(null, this.client)
    );
  }
}
