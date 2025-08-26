import { EmbedBuilder, ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ControlButtonEnum } from "../../database/schema/ControlButton.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["control", "buttons"];
  public description = "Bật hoặc tắt các nút điều khiển player";
  public category = "Settings";
  public accessableby = data.COMMANDS_ACCESS.SETTINGS.ControlMode;
  public usage = "<enable> hoặc <disable>";
  public aliases = ["song-noti", "snt", "sn"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [
    {
      name: "type",
      description: "Chọn bật hoặc tắt",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "Bật",
          value: "enable",
        },
        {
          name: "Tắt",
          value: "disable",
        },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.SilentDeferReply();

    const value = handler.args[0];
    const originalValue = await client.db.ControlButton.get(
      `${handler.guild!.id}`
    );

    if (value === "enable") {
      if (originalValue === ControlButtonEnum.Enable)
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(
                  handler.language,
                  "commands.settings",
                  "control_already",
                  {
                    mode: handler.modeLang.enable,
                  }
                )}`
              )
              .setColor(client.color_main),
          ],
        });

      await client.db.ControlButton.set(
        `${handler.guild!.id}`,
        ControlButtonEnum.Enable
      );

      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(
            handler.language,
            "commands.settings",
            "control_set",
            {
              toggle: handler.modeLang.enable,
            }
          )}`
        )
        .setColor(client.color_main);

      return handler.editReply({ embeds: [embed] });
    } else if (value === "disable") {
      if (originalValue === ControlButtonEnum.Disable)
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(
                  handler.language,
                  "commands.settings",
                  "control_already",
                  {
                    mode: handler.modeLang.disable,
                  }
                )}`
              )
              .setColor(client.color_main),
          ],
        });

      await client.db.ControlButton.set(
        `${handler.guild!.id}`,
        ControlButtonEnum.Disable
      );
      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(
            handler.language,
            "commands.settings",
            "control_set",
            {
              toggle: handler.modeLang.disable,
            }
          )}`
        )
        .setColor(client.color_main);

      return handler.editReply({ embeds: [embed] });
    } else {
      const onsome = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(
            handler.language,
            "commands.settings",
            "control_arg_error",
            {
              text: "**enable** hoặc **disable**",
            }
          )}`
        )
        .setColor(client.color_main);
      return handler.editReply({ content: " ", embeds: [onsome] });
    }
  }
}
