import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Premium } from "../../database/schema/Premium.js";
import { GuildPremium } from "../../database/schema/GuildPremium.js";
import { Page } from "../../structures/Page.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = ConfigData.getInstance().data;

export default class implements Command {
  public name = ["premium", "list"];
  public description = "Liệt kê người dùng hoặc máy chủ Premium";
  public category = "Admin";
  public accessableby = data.COMMANDS_ACCESS.ADMIN.PremiumList;
  public usage = "";
  public aliases = ["pml"];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "type",
      description: "Chọn loại danh sách: user hoặc guild.",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Người dùng", value: "user" },
        { name: "Máy chủ", value: "guild" },
      ],
    },
    {
      name: "page",
      description: "Số trang để hiển thị.",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const type = handler.args[0];
    const pageInput = handler.args[1];

    if (!["user", "guild"].includes(type))
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.admin", "premiumlist_invalid_type", {
                example: `\`${client.prefix} pml <user|guild> <số trang>\``,
                user: String(handler.user?.displayName || handler.user?.tag),
                botname: client.user!.username || client.user!.displayName,
              })}`
            )
            .setColor(client.color_main),
        ],
      });

    if (pageInput && isNaN(+pageInput))
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.admin",
                "premiumlist_invalid_page_number"
              )}`
            )
            .setColor(client.color_main),
        ],
      });

    const dataList =
      type === "user"
        ? Array.from(await client.db.premium.all<Premium>()).map((data) => data.value)
        : Array.from(await client.db.preGuild.all<GuildPremium>()).map((data) => data.value);

    let pagesNum = Math.ceil(dataList.length / 10);
    if (pagesNum === 0) pagesNum = 1;

    const strings: string[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      const redeemedBy = data.redeemedBy;
      const name = "username" in redeemedBy ? redeemedBy.username : redeemedBy.name;
      if (type === "user") {
        strings.push(`\`${i + 1}. ${name}/${data.id} - ${data.plan}\``);
      } else {
        strings.push(`\`${i + 1}. ${name}/${data.id} - ${data.plan}\``);
      }
    }

    const pages: EmbedBuilder[] = [];
    for (let i = 0; i < pagesNum; i++) {
      const str = strings.slice(i * 10, i * 10 + 10).join("\n");

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${client.i18n.get(
            handler.language,
            "commands.admin",
            `premiumlist_${type}_list_title`,
            {
              user: String(handler.user?.displayName || handler.user?.tag),
              botname: client.user!.username || client.user!.displayName,
            }
          )}`,
        })
        .setColor(client.color_main)
        .setDescription(str == "" ? "  Không có dữ liệu" : "\n" + str)
        .setFooter({
          text: `${String(i + 1)}/${String(pagesNum)}`,
        });

      pages.push(embed);
    }

    const pageNum = Number(pageInput) > 0 ? Number(pageInput) - 1 : 0;
    if (pageNum >= pagesNum)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.admin", "premiumlist_page_not_found", {
                page: String(pagesNum),
                user: String(handler.user?.displayName || handler.user?.tag),
                botname: client.user!.username || client.user!.displayName,
              })}`
            )
            .setColor(client.color_main),
        ],
      });

    if (pages.length > 1 && dataList.length > 10) {
      if (handler.message) {
        await new Page(client, pages, 60000, handler.language).prefixPage(handler.message);
      } else if (handler.interaction) {
        await new Page(client, pages, 60000, handler.language).slashPage(handler.interaction);
      } else return;
    } else {
      return handler.editReply({ embeds: [pages[pageNum]] });
    }
  }
}
