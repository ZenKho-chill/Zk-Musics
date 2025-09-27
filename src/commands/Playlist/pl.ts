import {
  ApplicationCommandOptionType,
  CommandInteraction,
  ChatInputCommandInteraction,
  CommandInteractionOptionResolver,
  AutocompleteInteraction,
} from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { AutocompleteInteractionChoices, GlobalInteraction } from "../../@types/Interaction.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { logInfo, logDebug, logWarn, logError } from "../../utilities/Logger.js";

const data: Config = new ConfigData().data;

export default class PlaylistCommand implements Command {
  public name = ["pl", "playlist"];
  public description = "Manage playlists"; // This will be overridden by i18n
  public category = "Playlist";
  public accessableby = data.COMMANDS_ACCESS.PLAYLIST.All;
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [
    {
      name: "action",
      description: "Action to perform", // Will be overridden by i18n
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Add song", value: "add" },
        { name: "View all songs", value: "all" },
        { name: "Create new", value: "create" },
        { name: "Delete", value: "delete" },
        { name: "Details", value: "detail" },
        { name: "Settings", value: "editor" },
        { name: "Import/Play", value: "import" },
        { name: "Information", value: "info" },
        { name: "Remove song", value: "remove" },
        { name: "Save queue", value: "savequeue" },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    // Lấy action từ options
    const options = (handler.interaction as ChatInputCommandInteraction)
      .options as CommandInteractionOptionResolver;
    const action = options.getString("action");
    
    if (!action) {
      await handler.deferReply({ ephemeral: true });
      return handler.editReply({
        content: client.i18n.get(handler.language, "client.commands.playlist", "errors.invalid_action"),
      });
    }

    // Import handlers dynamically  
    try {
      let handlerModule;
      
      switch (action) {
        case "add":
          await handler.deferReply({ ephemeral: true });
          handlerModule = await import("../../handlers/Playlist/AddHandler.js");
          await new handlerModule.PlaylistAddHandler().execute(client, handler);
          break;
        case "all":
          await handler.deferReply({ ephemeral: true });
          handlerModule = await import("../../handlers/Playlist/AllHandler.js");
          await new handlerModule.PlaylistAllHandler().execute(client, handler);
          break;
        case "create":
          // Không defer reply cho create vì cần show modal
          handlerModule = await import("../../handlers/Playlist/CreateHandler.js");
          await new handlerModule.PlaylistCreateHandler().execute(client, handler);
          break;
        case "delete":
          await handler.deferReply({ ephemeral: true });
          handlerModule = await import("../../handlers/Playlist/DeleteHandler.js");
          await new handlerModule.PlaylistDeleteHandler().execute(client, handler);
          break;
        case "detail":
          await handler.deferReply({ ephemeral: true });
          handlerModule = await import("../../handlers/Playlist/DetailHandler.js");
          await new handlerModule.PlaylistDetailHandler().execute(client, handler);
          break;
        case "editor":
          await handler.deferReply({ ephemeral: true });
          handlerModule = await import("../../handlers/Playlist/EditorHandler.js");
          await new handlerModule.PlaylistEditorHandler().execute(client, handler);
          break;
        case "import":
          await handler.deferReply({ ephemeral: true });
          handlerModule = await import("../../handlers/Playlist/ImportHandler.js");
          await new handlerModule.PlaylistImportHandler().execute(client, handler);
          break;
        case "info":
          await handler.deferReply({ ephemeral: true });
          handlerModule = await import("../../handlers/Playlist/InfoHandler.js");
          await new handlerModule.PlaylistInfoHandler().execute(client, handler);
          break;
        case "remove":
          await handler.deferReply({ ephemeral: true });
          handlerModule = await import("../../handlers/Playlist/RemoveHandler.js");
          await new handlerModule.PlaylistRemoveHandler().execute(client, handler);
          break;
        case "savequeue":
          await handler.deferReply({ ephemeral: true });
          handlerModule = await import("../../handlers/Playlist/SaveQueueHandler.js");
          await new handlerModule.PlaylistSaveQueueHandler().execute(client, handler);
          break;
        default:
          await handler.deferReply({ ephemeral: true });
          return handler.editReply({
            content: client.i18n.get(handler.language, "client.commands.playlist", "errors.invalid_action_with_value", {
              action: action,
            }),
          });
      }
    } catch (error) {
      logError("PlaylistCommand", `Error executing ${action} handler`, { error });
      // Chỉ defer nếu chưa được defer và không phải create action
      if (!handler.interaction.deferred && !handler.interaction.replied && action !== "create") {
        await handler.deferReply({ ephemeral: true });
        await handler.editReply({
          content: client.i18n.get(handler.language, "client.commands.playlist", "errors.execution_error"),
        });
      } else if (handler.interaction.deferred) {
        await handler.editReply({
          content: client.i18n.get(handler.language, "client.commands.playlist", "errors.execution_error"),
        });
      }
    }
  }

}