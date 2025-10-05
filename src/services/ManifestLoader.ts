import fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ManifestInterface } from "../@types/Manifest.js";
import { log } from "../utilities/LoggerHelper.js";
const __dirname = dirname(fileURLToPath(import.meta.url));

export class ManifestLoader {
  get data(): ManifestInterface {
    log.debug("Loading manifest data", "Reading package.json");
    const data = fs.readFileSync(join(__dirname, "..", "..", "package.json"), "utf-8");
    const jsonData = JSON.parse(data);
    const countPackage = Object.keys(jsonData.dependencies).length;
    const countDevPackage = Object.keys(jsonData.devDependencies).length;
    const result: ManifestInterface = {
      metadata: {
        bot: {
          version: jsonData.version,
          codename: jsonData.zk.codename || "Zk Music",
          description: jsonData.description || "Ai muốn hát rồi cũng sẽ tìm thấy một bài ♪",
          developer: {
            name: jsonData.zk.developer?.name || "ZenKho",
            contact: jsonData.zk.developer?.contact || "https://zenkho.top"
          },
        },
        autofix: {
          version: jsonData.zk.autofix.version,
          codename: jsonData.zk.autofix.codename || "Pyrrion",
        },
      },
      package: {
        discordjs: jsonData.dependencies["discord.js"]
          ? jsonData.dependencies["discord.js"].replace(/^[\^~]/, "")
          : "unknown",
        typescript: jsonData.devDependencies["typescript"]
          ? jsonData.devDependencies["typescript"].replace(/^[\^~]/, "")
          : "unknown",
        globalAmount: countPackage,
        devAmount: countDevPackage,
        totalAmount: countDevPackage + countPackage,
      },
    };
    return result;
  }
}
