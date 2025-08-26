import { EmbedBuilder, ApplicationCommandOptionType } from "discord.js";
import id from "voucher-code-generator";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["pl", "create"];
  public description = "Tạo danh sách phát mới";
  public category = "Playlist";
  public accessableby = data.COMMANDS_ACCESS.PLAYLIST.Create;
  public usage = "<tên_playlist> <mô_tả_playlist>";
  public aliases = [];
  public lavalink = true;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [
    {
      name: "name",
      description: "Tên của danh sách phát",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "description",
      description: "Mô tả của danh sách phát",
      type: ApplicationCommandOptionType.String,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const value = handler.args[0];
    const des = handler.args[1];

    if (value == null || !value)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.playlist",
                "pl_create_invalid"
              )}`
            )
            .setColor(client.color_main),
        ],
      });

    if (value.length > 16)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.playlist",
                "pl_create_toolong"
              )}`
            )
            .setColor(client.color_main),
        ],
      });
    if (des && des.length > 1000)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.playlist",
                "pl_create_des_toolong"
              )}`
            )
            .setColor(client.color_main),
        ],
      });

    const fullList = await client.db.playlist.all();

    const Limit = fullList.filter((data) => {
      return data.value.owner == handler.user?.id;
    });

    if (Limit.length >= client.config.features.LIMIT_PLAYLIST) {
      handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.playlist",
                "pl_create_limit_playlist",
                {
                  limit: String(client.config.features.LIMIT_PLAYLIST),
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });
      return;
    }

    const idgen = id.generate({ length: 8, prefix: "pl-" });

    await client.db.playlist.set(`${idgen}`, {
      id: idgen[0],
      name: value,
      owner: handler.user?.id,
      tracks: [],
      private: true,
      created: Date.now(),
      description: des ? des : null,
    });

    const embed = new EmbedBuilder()
      .setDescription(
        `${client.i18n.get(
          handler.language,
          "commands.playlist",
          "pl_create_created",
          {
            playlist: String(value),
            id: idgen[0],
            desc: des ? des : "Chưa đặt",
          }
        )}`
      )
      .setColor(client.color_main)
      .setFooter({
        text: `${client.i18n.get(
          handler.language,
          "commands.playlist",
          "pl_create_created_footer"
        )}`,
      });
    handler.editReply({ content: " ", embeds: [embed] });
  }
}
