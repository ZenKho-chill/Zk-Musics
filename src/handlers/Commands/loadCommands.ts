import readdirRecursive from "recursive-readdir";
import { resolve, relative } from "path";
import { Manager } from "../../manager.js";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { KeyCheckerEnum } from "../../@types/KeyChecker.js";
import { Command } from "../../structures/Command.js";
import { log } from "../../utilities/LoggerHelper.js";
const __dirname = dirname(fileURLToPath(import.meta.url));

export class CommandLoader {
  client: Manager;
  constructor(client: Manager) {
    this.client = client;
    this.loader();
  }

  async loader() {
    let commandPath = resolve(join(__dirname, "..", "..", "commands"));
    let commandFiles = await readdirRecursive(commandPath);

    for await (const commandFile of commandFiles) {
      await this.register(commandFile);
    }

    if (this.client.commands.size) {
      const commandColl = this.client.commands;
      const totalCommands = this.client.commands.size;
      
      // Thống kê interaction commands
      const haveInteraction = commandColl.filter((command) => command.usingInteraction).size;
      const noInteraction = totalCommands - haveInteraction;
      
      // Thống kê theo category
      const categories = new Map<string, number>();
      commandColl.forEach((command) => {
        const category = command.category || "Unknown";
        categories.set(category, (categories.get(category) || 0) + 1);
      });
      
      const categoryStats = Array.from(categories.entries())
        .map(([cat, count]) => `${cat}: ${count}`)
        .join(" | ");
      
      log.completed(
        "lệnh", 
        totalCommands,
        `Tổng số: ${totalCommands} | Slash: ${haveInteraction} | Prefix: ${noInteraction}`
      );
      
      log.info("Phân loại commands", categoryStats);
    } else {
      log.warn("Không tìm thấy lệnh nào", "Command collection is empty");
    }
  }

  async register(commandFile: string) {
    const rltPath = relative(__dirname, commandFile);
    const command = new (await import(pathToFileURL(commandFile).toString())).default();

    if (!command.name?.length) {
      log.warn("File không có tên lệnh", `File: ${rltPath}`);
      return;
    }

    if (this.client.commands.has(command.name)) {
      log.warn("Lệnh đã tồn tại", `Lệnh: ${command.name} | File: ${rltPath}`);
      return;
    }

    const checkRes = this.keyChecker(command);

    if (checkRes !== KeyCheckerEnum.Pass) {
      log.error("Lệnh không đúng format", `Lệnh: ${command.name} | Lỗi: ${checkRes} | File: ${rltPath}`);
      return;
    }

    this.client.commands.set(command.name.join("-"), command);

    if (command.aliases && command.aliases.length !== 0)
      command.aliases.forEach((a: string) => this.client.aliases.set(a, command.name.join("-")));
  }

  keyChecker(obj: Record<string, any>): KeyCheckerEnum {
    const base = new Command();
    const baseKeyArray = Object.keys(base);
    const check = Object.keys(obj);
    const checkedKey: string[] = [];

    if (baseKeyArray.length > check.length) return KeyCheckerEnum.MissingKey;
    if (baseKeyArray.length < check.length) return KeyCheckerEnum.TooMuchKey;
    if (obj.execute == undefined) return KeyCheckerEnum.NoRunFunction;

    try {
      for (let i = 0; i < check.length; i++) {
        if (checkedKey.includes(check[i])) return KeyCheckerEnum.DuplicateKey;
        if (!(check[i] in base)) return KeyCheckerEnum.InvalidKey;
        checkedKey.push(check[i]);
      }
    } finally {
      checkedKey.length = 0;
      return KeyCheckerEnum.Pass;
    }
  }
}
