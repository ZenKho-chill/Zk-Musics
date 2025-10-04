import { ApplicationCommandOptionType, MessageFlags, AutocompleteInteraction } from "discord.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { getAvailableThemes } from "zkcard";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["themes"];
  public description = "Thay đổi giao diện thẻ nhạc";
  public category = "Settings";
  public accessableby = data.COMMANDS_ACCESS.SETTINGS.Themes;
  public usage = "<theme>";
  public aliases = [];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "themes",
      description: "Chọn theme cho thẻ nhạc từ danh sách có sẵn",
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    },
  ];



  public async autocomplete(client: Manager, interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const availableThemes = getAvailableThemes();
    
    // Tạo danh sách choices từ available themes - sử dụng trực tiếp tên theme
    const choices = availableThemes
      .filter(theme => theme.toLowerCase().includes(focusedValue))
      .map(theme => ({
        name: theme,
        value: theme
      }))
      .slice(0, 25); // Discord giới hạn 25 choices

    await interaction.respond(choices);
  }
  
  public async execute(client: Manager, handler: CommandHandler) {
    if (!handler.interaction) return;
    let name = handler.args[0];
    
    // Kiểm tra theme có hợp lệ không
    const availableThemes = getAvailableThemes();
    if (!availableThemes.includes(name)) {
      await handler.interaction.reply({
        content: `${client.i18n.get(handler.language, "commands.settings", "error_themes")}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Sử dụng trực tiếp tên theme từ package
    const themeName = name;

    const new_data = {
      userId: handler.user!.id,
      username: handler.user!.username,
      theme: name,
    };

    await client.db.Themes.set(`${handler.user!.id}`, new_data);
    await handler.interaction.reply({
      content: `${client.i18n.get(handler.language, "commands.settings", "succes_themes", {
        themes: themeName,
      })}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
