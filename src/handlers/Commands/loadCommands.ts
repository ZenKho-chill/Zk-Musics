import readdirRecursive from "recursive-readdir";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { resolve, relative } from "path";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Manager } from "../../manager.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { join, dirname } from "path";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { fileURLToPath, pathToFileURL } from "url";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { KeyCheckerEnum } from "../../@types/KeyChecker.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Command } from "../../structures/Command.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
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
      const array1 = commandColl.filter((command) => command.name.length === 1).size;
      const array2 = commandColl.filter((command) => command.name.length === 2).size;
      const array3 = commandColl.filter((command) => command.name.length === 3).size;
      const haveInteraction = commandColl.filter((command) => command.usingInteraction).size;
      this.logInfo(CommandLoader.name, `Kết quả tải lệnh:`);
      this.logInfo(CommandLoader.name, `${array1} lệnh không có tiền tố`);
      this.logInfo(CommandLoader.name, `${array2} lệnh có 1 tiền tố`);
      this.logInfo(CommandLoader.name, `${array3} lệnh có 2 tiền tố`);
      this.logInfo(
        CommandLoader.name,
        `${haveInteraction} lệnh hỗ trợ Interaction/Prefix`
      );
      this.logInfo(
        CommandLoader.name,
        `${commandColl.size - haveInteraction} lệnh chỉ hỗ trợ Prefix`
      );
      this.logInfo(
        CommandLoader.name,
        `Tổng cộng ${commandColl.size} lệnh đã được tải!`
      );
    } else {
      this.logWarn(CommandLoader.name, `Không có lệnh nào được tải, mọi thứ ổn chứ?`);
    }
  }

  async register(commandFile: string) {
    const rltPath = relative(__dirname, commandFile);
    const command = new (await import(pathToFileURL(commandFile).toString())).default();

    if (!command.name?.length) {
      this.logWarn(CommandLoader.name, `"${rltPath}" File lệnh không có tên. Bỏ qua...`);
      return;
    }

    if (this.client.commands.has(command.name)) {
      this.logWarn(
        CommandLoader.name,
        `"${command.name}" lệnh đã được cài đặt. Bỏ qua...`
      );
      return;
    }

    const checkRes = this.keyChecker(command);

    if (checkRes !== KeyCheckerEnum.Pass) {
      this.logWarn(
        CommandLoader.name,
        `"${command.name}" lệnh không được triển khai đúng [${checkRes}]. Bỏ qua...`
      );
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
