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

const data: Config = new ConfigData().data;

export default class PlaylistCommand implements Command {
  public name = ["pl", "playlist"];
  public description = "Quản lý danh sách phát";
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
      description: "Hành động thực hiện",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Thêm bài hát", value: "add" },
        { name: "Xem tất cả bài hát", value: "all" },
        { name: "Tạo mới", value: "create" },
        { name: "Xóa", value: "delete" },
        { name: "Chi tiết", value: "detail" },
        { name: "Chế độ", value: "editor" },
        { name: "Phát nhạc", value: "import" },
        { name: "Thông tin", value: "info" },
        { name: "Xóa bài hát", value: "remove" },
        { name: "Lưu hàng đợi", value: "savequeue" },
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
        content: "❌ Vui lòng chọn một hành động hợp lệ!",
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
            content: `❌ Hành động không hợp lệ: ${action}`,
          });
      }
    } catch (error) {
      console.error(`Error executing ${action} handler:`, error);
      // Chỉ defer nếu chưa được defer và không phải create action
      if (!handler.interaction.deferred && !handler.interaction.replied && action !== "create") {
        await handler.deferReply({ ephemeral: true });
        await handler.editReply({
          content: "❌ Đã xảy ra lỗi khi thực hiện lệnh!",
        });
      } else if (handler.interaction.deferred) {
        await handler.editReply({
          content: "❌ Đã xảy ra lỗi khi thực hiện lệnh!",
        });
      }
    }
  }

}