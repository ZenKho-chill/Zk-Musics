import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { EmbedBuilder, ApplicationCommandOptionType } from "discord.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["maintenance"];
  public description = "Bật/tắt chế độ bảo trì (vô hiệu hoá lệnh)";
  public category = "Admin";
  public accessableby = data.COMMANDS_ACCESS.ADMIN.Maintenance;
  public usage = "";
  public aliases = ["mt"];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "type",
      description: "Loại hành động (true/false)",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "Bật",
          value: "true",
        },
        {
          name: "Tắt",
          value: "false",
        },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    let option = ["true", "false"];

    if (!handler.args[0] || !option.includes(handler.args[0]))
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.admin",
                "maintenance_arg_error",
                {
                  text: "**true** hoặc **false**",
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });

    const value = handler.args[0];

    if (value === "true") {
      const type = await client.db.maintenance.set(handler.user!.id, value);
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.admin",
                "maintenance_true",
                {
                  type: String(type),
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });
    } else if (value === "false") {
      const type = await client.db.maintenance.deleteAll();

      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(
            handler.language,
            "commands.admin",
            "maintenance_false",
            {
              type: String(type),
            }
          )}`
        )
        .setColor(client.color_main);
      return handler.editReply({ embeds: [embed] });
    }
  }
}
