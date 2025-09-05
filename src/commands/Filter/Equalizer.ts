import { EmbedBuilder, ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["equalizer"];
  public description = "Bộ cân bằng (Equalizer) tuỳ chỉnh";
  public category = "Filter";
  public accessableby = data.COMMANDS_ACCESS.FILTER.Equalizer;
  public usage = "<number>";
  public aliases = ["equalizer"];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [
    {
      name: "bands",
      description: "Số băng tần sử dụng (tối đa 10 băng tần)",
      type: ApplicationCommandOptionType.String,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.SilentDeferReply();

    const value = handler.args[0];

    if (value && isNaN(+value))
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "error", "number_invalid")}`
            )
            .setColor(client.color_main),
        ],
      });

    const player = client.Zklink.players.get(handler.guild!.id);

    if (!value) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${client.i18n.get(
            handler.language,
            "commands.filter",
            "eq_author"
          )}`,
          iconURL: `${client.i18n.get(
            handler.language,
            "commands.filter",
            "eq_icon"
          )}`,
        })
        .setColor(client.color_main)
        .setDescription(
          `${client.i18n.get(handler.language, "commands.filter", "eq_desc")}`
        )
        .addFields({
          name: `${client.i18n.get(
            handler.language,
            "commands.filter",
            "eq_field_title"
          )}`,
          value: `${client.i18n.get(
            handler.language,
            "commands.filter",
            "eq_field_value",
            {
              prefix: handler.prefix,
            }
          )}`,
          inline: false,
        })
        .setFooter({
          text: `${client.i18n.get(
            handler.language,
            "commands.filter",
            "eq_footer",
            {
              prefix: handler.prefix,
            }
          )}`,
        });
      return handler.editReply({ embeds: [embed] });
    } else if (value == "off" || value == "reset")
      return player?.filter.clear();

    const bands = value.split(/[ ]+/);
    let bandsStr = "";
    for (let i = 0; i < bands.length; i++) {
      if (i > 13) break;
      if (isNaN(+bands[i]))
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(
                  handler.language,
                  "commands.filter",
                  "eq_number"
                )}`
              )
              .setColor(client.color_main),
          ],
        });
      if (Number(bands[i]) > 10)
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(
                  handler.language,
                  "commands.filter",
                  "eq_than"
                )}`
              )
              .setColor(client.color_main),
          ],
        });

      if (Number(bands[i]) < -10)
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(
                  handler.language,
                  "commands.filter",
                  "eq_greater"
                )}`
              )
              .setColor(client.color_main),
          ],
        });
    }

    for (let i = 0; i < bands.length; i++) {
      if (i > 13) break;
      player?.filter.setEqualizer([{ band: i, gain: Number(bands[i]) / 10 }]);
      bandsStr += `${bands[i]} `;
    }

    player?.data.set("filter-mode", this.name[0]);

    const embed = new EmbedBuilder()
      .setDescription(
        `${client.i18n.get(handler.language, "commands.filter", "eq_on", {
          bands: bandsStr,
        })}`
      )
      .setColor(client.color_main);
    return handler.editReply({ content: " ", embeds: [embed] });
  }
}
