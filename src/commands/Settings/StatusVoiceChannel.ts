import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { EmbedBuilder, ApplicationCommandOptionType } from "discord.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["status", "voicechannel"];
  public description = "Cài đặt trạng thái kênh thoại";
  public category = "Settings";
  public accessableby = data.COMMANDS_ACCESS.SETTINGS.StatusVoiceChannel;
  public usage = "";
  public aliases = ["svc"];
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
                "commands.settings",
                "status_voice_channel_error",
                {
                  text: "**true** hoặc **false**",
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });

    const value = handler.args[0] === "true";

    // Lưu dưới dạng boolean vào cơ sở dữ liệu
    await client.db.StatusVoiceChannel.set(handler.guild!.id, value);

    const embed = new EmbedBuilder()
      .setDescription(
        `${client.i18n.get(
          handler.language,
          "commands.settings",
          value ? "status_voice_channel_true" : "status_voice_channel_false",
          { type: String(value) }
        )}`
      )
      .setColor(client.color_main);

    return handler.editReply({ embeds: [embed] });
  }
}
