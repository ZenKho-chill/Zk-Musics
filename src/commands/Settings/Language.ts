import { EmbedBuilder, ApplicationCommandOptionType, AutocompleteInteraction } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { AutocompleteInteractionChoices, GlobalInteraction } from "../../@types/Interaction.js";
import { SUPPORTED_LANGUAGES, getLanguageDisplayName, isLanguageSupported } from "../../languages/languageConfig.js";
import { GuildLanguageManager } from "../../utilities/GuildLanguageManager.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["language"];
  public description = "Thay đổi ngôn ngữ cho bot";
  public category = "Settings";
  public accessableby = data.COMMANDS_ACCESS.SETTINGS.Language;
  public usage = "<ngôn_ngữ>";
  public aliases = ["lang", "language"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [
    {
      name: "input",
      description: "Ngôn ngữ mới",
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.SilentDeferReply();

    const input = handler.args[0];

    // Kiểm tra ngôn ngữ có được hỗ trợ không bằng file config
    if (!isLanguageSupported(input as string)) {
      const supportedLanguagesList = SUPPORTED_LANGUAGES
        .map(lang => `\`${lang.code}\` - ${getLanguageDisplayName(lang.code)}`)
        .join("\n");
        
      const onsome = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "commands.settings", "provide_lang_list")}\n\n${supportedLanguagesList}`
        )
        .setColor(client.color_main);
      return handler.editReply({ content: " ", embeds: [onsome] });
    }

    const newLang = await client.db.language.get(`${handler.guild!.id}`);

    if (!newLang) {
      await GuildLanguageManager.updateGuildLanguage(client, handler.guild!.id, input);
      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "commands.settings", "lang_set", {
            language: getLanguageDisplayName(input),
          })}`
        )
        .setColor(client.color_main);

      return handler.editReply({ content: " ", embeds: [embed] });
    } else if (newLang) {
      await GuildLanguageManager.updateGuildLanguage(client, handler.guild!.id, input);

      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "commands.settings", "lang_change", {
            language: getLanguageDisplayName(input),
          })}`
        )
        .setColor(client.color_main);

      return handler.editReply({ content: " ", embeds: [embed] });
    }
  }

  // Hàm autocomplete cho các ngôn ngữ được hỗ trợ
  async autocomplete(client: Manager, interaction: GlobalInteraction, language: string) {
    let choice: AutocompleteInteractionChoices[] = [];
    const input = String((interaction as any).options.get("input")?.value || "");

    // Lọc các ngôn ngữ dựa trên input của user
    const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang => {
      const displayName = getLanguageDisplayName(lang.code);
      return lang.code.toLowerCase().includes(input.toLowerCase()) || 
             lang.name.toLowerCase().includes(input.toLowerCase()) ||
             lang.nativeName.toLowerCase().includes(input.toLowerCase()) ||
             displayName.toLowerCase().includes(input.toLowerCase());
    });

    // Tạo các lựa chọn autocomplete
    for (const lang of filteredLanguages.slice(0, 25)) { // Discord giới hạn 25 lựa chọn
      const displayName = getLanguageDisplayName(lang.code);
      choice.push({
        name: displayName,
        value: lang.code
      });
    }

    await (interaction as AutocompleteInteraction).respond(choice).catch(() => {});
  }
}
