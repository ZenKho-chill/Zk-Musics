import { fileURLToPath, pathToFileURL } from "url";
import { Manager } from "../manager.js";
import path from "path";
import readdirRecursive from "recursive-readdir";
import { ApplicationCommandOptionType, REST, Routes } from "discord.js";
import { CommandInterface, UploadCommandInterface } from "../@types/Interaction.js";
import { join, dirname } from "path";
import { BotInfoType } from "../@types/User.js";
import { logDebug, logInfo, logWarn, logError } from "../utilities/Logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export class CommandDeployer {
  client: Manager;
  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }

  protected async combineDir() {
    const store: CommandInterface[] = [];

    const interactionsFolder = path.resolve(join(__dirname, "..", "commands"));

    let interactionFilePaths = await readdirRecursive(interactionsFolder);

    interactionFilePaths = interactionFilePaths.filter((i: string) => {
      let state = path.basename(i).startsWith("-");
      return !state;
    });

    for await (const interactionFilePath of interactionFilePaths) {
      const cmd = new (await import(pathToFileURL(interactionFilePath).toString())).default();
      cmd.usingInteraction ? store.push(cmd) : true;
    }

    return store;
  }

  async execute() {
    const command = [];

    logInfo(CommandDeployer.name, "Đang đọc file interaction...");

    const store = await this.combineDir();

    command.push(...this.parseEngine(store));

    logInfo(
      CommandDeployer.name,
      "Đã đọc xong file interaction, đang thiết lập REST..."
    );

    const rest = new REST({ version: "10" }).setToken(this.client.config.bot.TOKEN);
    const client = await rest.get(Routes.user());

    logInfo(
      CommandDeployer.name,
      `Đã thiết lập REST cho ${(client as BotInfoType).username}#${
        (client as BotInfoType).discriminator
      } (${(client as BotInfoType).id})`
    );

    if (command.length === 0)
      return logInfo(
        CommandDeployer.name,
        "Không có interaction nào được load. Kết thúc auto deploy..."
      );

    await rest.put(Routes.applicationCommands((client as BotInfoType).id), {
      body: command,
    });

    logInfo(
      CommandDeployer.name,
      `Đã triển khai interaction! Kết thúc auto deploy...`
    );
  }

  protected parseEngine(store: CommandInterface[]) {
    return store.reduce(
      (all: UploadCommandInterface[], current: CommandInterface) =>
        this.commandReducer(all, current),
      []
    );
  }

  protected commandReducer(all: UploadCommandInterface[], current: CommandInterface) {
    // Thêm lệnh đơn (tên 1 phần)
    if (current.name.length == 1) all.push(this.singleCommandMaker(current));
    // Thêm lệnh 2 phần (subcommand)
    if (current.name.length == 2) {
      let baseItem = all.find((i: UploadCommandInterface) => {
        return i.name == current.name[0] && i.type == current.type;
      });
      if (!baseItem) all.push(this.doubleCommandMaker(current));
      else baseItem.options!.push(this.singleItemMaker(current, 1));
    }
    // Thêm lệnh 3 phần (group -> subcommand)
    if (current.name.length == 3) {
      let SubItem = all.find((i: UploadCommandInterface) => {
        return i.name == current.name[0] && i.type == current.type;
      });
      let GroupItem = SubItem
        ? SubItem.options!.find((i: UploadCommandInterface) => {
            return (
              i.name == current.name[1] && i.type == ApplicationCommandOptionType.SubcommandGroup
            );
          })
        : undefined;

      if (!SubItem) {
        all.push(this.tribleCommandMaker(current));
      } else if (SubItem && !GroupItem) {
        SubItem.options!.push(this.doubleSubCommandMaker(current));
      } else if (SubItem && GroupItem) {
        GroupItem.options!.push(this.singleItemMaker(current, 2));
      }
    }

    // Trả về tất cả
    return all;
  }

  protected singleCommandMaker(current: CommandInterface) {
    return {
      type: current.type,
      name: current.name[0],
      description: current.description,
      defaultPermission: current.defaultPermission,
      options: current.options,
    };
  }

  protected doubleCommandMaker(current: CommandInterface) {
    return {
      type: current.type,
      name: current.name[0],
      description: `${current.name[0]} lệnh.`,
      defaultPermission: current.defaultPermission,
      options: [this.singleItemMaker(current, 1)],
    };
  }

  protected singleItemMaker(current: CommandInterface, nameIndex: number) {
    return {
      type: ApplicationCommandOptionType.Subcommand,
      description: current.description,
      name: current.name[nameIndex],
      options: current.options,
    };
  }

  protected tribleCommandMaker(current: CommandInterface) {
    return {
      type: current.type,
      name: current.name[0],
      description: `${current.name[0]} lệnh.`,
      defaultPermission: current.defaultPermission,
      options: [
        {
          type: ApplicationCommandOptionType.SubcommandGroup,
          description: `${current.name[1]} lệnh.`,
          name: current.name[1],
          options: [this.singleItemMaker(current, 2)],
        },
      ],
    };
  }

  protected doubleSubCommandMaker(current: CommandInterface) {
    return {
      type: ApplicationCommandOptionType.SubcommandGroup,
      description: `${current.name[1]} lệnh.`,
      name: current.name[1],
      options: [this.singleItemMaker(current, 2)],
    };
  }
}
