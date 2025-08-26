import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  WebhookClient,
} from "discord.js";
import moment from "moment";
import voucher_codes from "voucher-code-generator";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["premium", "code"];
  public description = "Tạo mã Premium";
  public category = "Admin";
  public accessableby = data.COMMANDS_ACCESS.ADMIN.PremiumCode;
  public usage = "<type> <số lượng>";
  public aliases = [];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "plan",
      description: "Có sẵn: daily, weekly, monthly, yearly, lifetime",
      required: true,
      type: ApplicationCommandOptionType.String,
      choices: [
        {
          name: "Hàng ngày",
          value: "daily",
        },
        {
          name: "Hàng tuần",
          value: "weekly",
        },
        {
          name: "Hàng tháng",
          value: "monthly",
        },
        {
          name: "Hàng năm",
          value: "yearly",
        },
        {
          name: "Trọn đời",
          value: "lifetime",
        },
      ],
    },
    {
      name: "amount",
      description: "Số lượng mã muốn tạo",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const plans = this.options[0].choices!.map((data) => data.value);
    const name = handler.args[0];
    const camount = Number(handler.args[1]);

    if (!name || !plans.includes(name))
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.admin",
                "premium_code_arg_error",
                {
                  text: "**Hàng ngày**, **Hàng tuần**, **Hàng tháng**, **Hàng năm**, **Trọn đời**",
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });
    if (!camount)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.admin",
                "premium_code_arg_error",
                {
                  text: "**Số**",
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });

    let codes = [];

    const plan = name;

    let time;
    switch (plan) {
      case "daily":
        time = Date.now() + 86400000;
        break;
      case "weekly":
        time = Date.now() + 86400000 * 7;
        break;
      case "monthly":
        time = Date.now() + 86400000 * 30;
        break;
      case "yearly":
        time = Date.now() + 86400000 * 365;
        break;
      case "lifetime":
        time = "lifetime";
        break;
    }

    let amount = camount;
    if (!amount) amount = 1;

    for (var i = 0; i < amount; i++) {
      const codePremium = voucher_codes.generate({
        pattern: "#############-#########-######",
      });

      const code = codePremium.toString().toUpperCase();
      const find = await client.db.code.get(`${code}`);

      if (!find) {
        await client.db.code.set(`${code}`, {
          code: code,
          plan: plan,
          expiresAt: time,
        });
        codes.push(`${i + 1}. ${code}`);
      }
    }

    const embed = new EmbedBuilder()
      .setColor(client.color_main)
      .setAuthor({
        name: `${client.user!.username} Mã Premium!`,
        iconURL: client.user!.displayAvatarURL(),
        url: `https://discord.com/oauth2/authorize?client_id=${
          client.user!.id
        }&permissions=8&scope=bot`,
      })
      .setDescription(
        `${client.i18n.get(
          handler.language,
          "commands.admin",
          "premium_code_desc",
          {
            codes_length: String(codes.length),
            codes: codes.join("\n"),
            plan: String(plan),
            expires:
              time == "lifetime"
                ? "lifetime"
                : moment(time).format("dddd, MMMM Do YYYY (HH:mm:ss)"),
          }
        )}`
      )
      .addFields([
        {
          name: `${client.i18n.get(
            handler.language,
            "commands.admin",
            "premium_code_plan"
          )}`,
          value: `${
            plan === "lifetime"
              ? "Trọn đời"
              : `<t:${Math.floor(time / 1000)}:R>`
          }`,
          inline: false,
        },
        {
          name: `${client.i18n.get(
            handler.language,
            "commands.admin",
            "premium_code_expired"
          )}`,
          value: `${
            plan === "lifetime"
              ? "Trọn đời"
              : `<t:${Math.floor(time / 1000)}:F>`
          }`,
          inline: false,
        },
        {
          name: `${client.i18n.get(
            handler.language,
            "commands.admin",
            "premium_code_generateby"
          )}`,
          value: `${handler.user!.displayName} - ${handler.user!.id}`,
          inline: false,
        },
      ]);

    handler.editReply({ embeds: [embed] });
    await this.sendGenerateLog(client, handler, codes, plan, time as string);
  }

  protected async sendGenerateLog(
    client: Manager,
    handler: CommandHandler,
    codes: string[],
    plan: string,
    expiresAt: number | string
  ): Promise<void> {
    if (!client.config.logchannel.GenerateCodeChannelID) return;
    const language = client.config.bot.LANGUAGE;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${client.user!.username} Nhật ký mã Premium!`,
        iconURL: client.user!.displayAvatarURL(),
        url: `https://discord.com/oauth2/authorize?client_id=${
          client.user!.id
        }&permissions=8&scope=bot`,
      })
      .setDescription(
        `${client.i18n.get(language, "commands.admin", "premium_code_desc", {
          codes_length: String(codes.length),
          codes: codes.join("\n"),
          plan: String(plan),
          expires:
            expiresAt == "lifetime"
              ? "lifetime"
              : moment(expiresAt).format("dddd, MMMM Do YYYY (HH:mm:ss)"),
        })}`
      )
      .addFields([
        {
          name: `${client.i18n.get(
            language,
            "commands.admin",
            "premium_code_plan"
          )}`,
          value: `${
            plan === "lifetime"
              ? "Trọn đời"
              : `<t:${Math.floor(Number(expiresAt) / 1000)}:R>`
          }`,
          inline: false,
        },
        {
          name: `${client.i18n.get(
            language,
            "commands.admin",
            "premium_code_expired"
          )}`,
          value: `${
            plan === "lifetime"
              ? "Trọn đời"
              : `<t:${Math.floor(Number(expiresAt) / 1000)}:F>`
          }`,
          inline: false,
        },
        {
          name: `${client.i18n.get(
            language,
            "commands.admin",
            "premium_code_generateby"
          )}`,
          value: `${handler.user!.displayName} - ${handler.user!.id}`,
          inline: false,
        },
      ])
      .setColor(client.color_main)
      .setTimestamp();

    try {
      const channel = await client.channels
        .fetch(client.config.logchannel.GenerateCodeChannelID)
        .catch(() => undefined);
      if (!channel || (channel && !channel.isTextBased())) return;
      channel.messages.channel.send({ embeds: [embed] });
    } catch {}

    return;
  }
}
