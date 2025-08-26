import { EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["superbass"];
  public description = "Bật bộ lọc Superbass";
  public category = "Filter";
  public accessableby = data.COMMANDS_ACCESS.FILTER.Superbass;
  public usage = "";
  public aliases = ["superbass"];
  public lavalink = true;
  public options = [];
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.SilentDeferReply();

    const player = client.zklink.players.get(handler.guild!.id);

    if (player?.data.get("filter-mode") == this.name[0])
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.filter",
                "filter_already",
                {
                  name: this.name[0],
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });

    player?.data.set("filter-mode", this.name[0]);
    player?.filter.setEqualizer([
      { band: 0, gain: 0.2 },
      { band: 1, gain: 0.3 },
      { band: 2, gain: 0 },
      { band: 3, gain: 0.8 },
      { band: 4, gain: 0 },
      { band: 5, gain: 0.5 },
      { band: 6, gain: 0 },
      { band: 7, gain: -0.5 },
      { band: 8, gain: 0 },
      { band: 9, gain: 0 },
      { band: 10, gain: 0 },
      { band: 11, gain: 0 },
      { band: 12, gain: 0 },
      { band: 13, gain: 0 },
    ]);

    const sbed = new EmbedBuilder()
      .setDescription(
        `${client.i18n.get(handler.language, "commands.filter", "filter_on", {
          name: this.name[0],
        })}`
      )
      .setColor(client.color_main);
    await handler.editReply({ content: " ", embeds: [sbed] });
  }
}
