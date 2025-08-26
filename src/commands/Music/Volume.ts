import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ZkslinkPlayer } from "../../zklink/main.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

// Mã chính
export default class implements Command {
  public name = ["volume"];
  public description = "Điều chỉnh âm lượng của bot";
  public category = "Âm nhạc";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.Volume;
  public usage = "<số>";
  public aliases = ["vol"];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [
    {
      name: "amount",
      description: "Mức âm lượng muốn đặt cho bot.",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const value = handler.args[0];
    if (value && isNaN(+value))
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.music",
                "volume_number_invalid"
              )}`
            )
            .setColor(client.color_main),
        ],
      });

    const player = client.zklink.players.get(
      handler.guild!.id
    ) as ZkslinkPlayer;

    if (!value)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.music",
                "volume_number_invalid"
              )}`
            )
            .setColor(client.color_main),
        ],
      });
    if (Number(value) <= 0 || Number(value) > 100)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.music",
                "volume_invalid"
              )}`
            )
            .setColor(client.color_main),
        ],
      });

    await player.setVolume(Number(value));

    client.wsl.get(handler.guild!.id)?.send({
      op: "playerVolume",
      guild: handler.guild!.id,
      volume: player.volume,
    });

    const changevol = new EmbedBuilder()
      .setDescription(
        `${client.i18n.get(handler.language, "commands.music", "volume_msg", {
          volume: value,
          user: handler.user!.displayName || handler.user!.tag,
        })}`
      )
      .setColor(client.color_main);

    handler.editReply({ content: " ", embeds: [changevol] });
  }
}
