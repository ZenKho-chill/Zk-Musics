import { EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["vibrato"];
  public description = "Bật bộ lọc Vibrato";
  public category = "Filter";
  public accessableby = data.COMMANDS_ACCESS.FILTER.Vibrato;
  public usage = "";
  public aliases = ["vibrato"];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [];

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
    player?.filter.set("vibrato");

    const embed = new EmbedBuilder()
      .setDescription(
        `${client.i18n.get(handler.language, "commands.filter", "filter_on", {
          name: this.name[0],
        })}`
      )
      .setColor(client.color_main);
    await handler.editReply({ content: " ", embeds: [embed] });
  }
}
