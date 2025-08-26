import { EmbedBuilder, ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
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
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.SilentDeferReply();

    const input = handler.args[0];

    const languages = client.i18n.getLocales();

    if (!languages.includes(input as string)) {
      const onsome = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(
            handler.language,
            "commands.settings",
            "provide_lang",
            {
              languages: languages.join(", "),
            }
          )}`
        )
        .setColor(client.color_main);
      return handler.editReply({ content: " ", embeds: [onsome] });
    }

    const newLang = await client.db.language.get(`${handler.guild!.id}`);

    if (!newLang) {
      await client.db.language.set(`${handler.guild!.id}`, input);
      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(
            handler.language,
            "commands.settings",
            "lang_set",
            {
              language: String(input),
            }
          )}`
        )
        .setColor(client.color_main);

      return handler.editReply({ content: " ", embeds: [embed] });
    } else if (newLang) {
      await client.db.language.set(`${handler.guild!.id}`, input);

      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(
            handler.language,
            "commands.settings",
            "lang_change",
            {
              language: String(input),
            }
          )}`
        )
        .setColor(client.color_main);

      return handler.editReply({ content: " ", embeds: [embed] });
    }
  }
}
