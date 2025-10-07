import readdirRecursive from "recursive-readdir";
import { resolve, relative } from "path";
import { Manager } from "../../manager.js";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { KeyCheckerEnum } from "../../@types/KeyChecker.js";
import { PlayerButton } from "../../@types/Button.js";
const __dirname = dirname(fileURLToPath(import.meta.url));

export class PlayerButtonsLoader {
  client: Manager;
  constructor(client: Manager) {
    this.client = client;
    this.loader();
  }

  async loader() {
    let commandPath = resolve(join(__dirname, "..", "..", "button"));
    let commandFiles = await readdirRecursive(commandPath);

    for await (const commandFile of commandFiles) {
      await this.register(commandFile);
    }

    if (this.client.plButton.size) {
      // Log đã bị xóa - Nút điều khiển player đã được tải
    } else {
      // Log đã bị xóa - Không có nút player nào được tải
    }
  }

  async register(commandFile: string) {
    const rltPath = relative(__dirname, commandFile);
    const command = new (await import(pathToFileURL(commandFile).toString())).default();

    if (!command.name?.length) {
      // Log đã bị xóa - File nút player không có tên
      return;
    }

    if (this.client.plButton.get(command.name)) {
      // Log đã bị xóa - Nút player đã được cài
      return;
    }

    const checkRes = this.keyChecker(command);

    if (checkRes !== KeyCheckerEnum.Pass) {
      // Log đã bị xóa - Nút player chưa được triển khai đúng
      return;
    }

    this.client.plButton.set(command.name, command);
  }

  keyChecker(obj: Record<string, any>): KeyCheckerEnum {
    const base = new PlayerButton();
    const baseKeyArray = Object.keys(base);
    const check = Object.keys(obj);
    const checkedKey: string[] = [];

    if (baseKeyArray.length > check.length) return KeyCheckerEnum.MissingKey;
    if (baseKeyArray.length < check.length) return KeyCheckerEnum.TooMuchKey;
    if (obj.run == undefined) return KeyCheckerEnum.NoRunFunction;

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
