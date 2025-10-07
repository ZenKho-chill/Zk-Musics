import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
} from "discord.js";
import moment from "moment";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { log } from "../../utilities/LoggerHelper.js";
const data: Config = ConfigData.getInstance().data;

export default class implements Command {
  public name = ["premium", "check"];
  public description = "Xem hồ sơ premium của bạn hoặc hồ sơ premium máy chủ!";
  public category = "Info";
  public accessableby = data.COMMANDS_ACCESS.INFO.PremiumCheck;
  public usage = "";
  public aliases = ["pmc"];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "type",
      description: "Loại hồ sơ để xem",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "user", value: "user" },
        { name: "guild", value: "guild" },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const type = handler.args[0] as string;

    if (type !== "user" && type !== "guild") {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.info", "premium_check_invalid", {
                prefix: client.prefix,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    if (type === "user") {
      if (handler.user?.id === client.owner) return this.owner(client, handler);
      if (client.config.bot.ADMIN.includes(handler.user?.id ?? "null"))
        return this.admin(client, handler);

      const PremiumPlan = await client.db.premium.get(handler.user!.id);
      if (!PremiumPlan) {
        return this.userProfileNotFound(client, handler);
      }

      const expires =
        PremiumPlan.expiresAt !== "lifetime"
          ? `<t:${Math.floor(moment(PremiumPlan.expiresAt).valueOf() / 1000)}:F>`
          : "lifetime";

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${client.i18n.get(
            handler.language,
            "commands.info",
            "premium_check_user_profile_author"
          )}`,
          iconURL: client.user!.displayAvatarURL(),
          url: `https://discord.com/oauth2/authorize?client_id=${
            client.user!.id
          }&permissions=8&scope=bot`,
        })
        .setDescription(
          `${client.i18n.get(handler.language, "commands.info", "premium_check_user_profile_desc", {
            user: String(handler.user?.displayName),
            plan:
              PremiumPlan.expiresAt !== "lifetime"
                ? `<t:${Math.floor(moment(PremiumPlan.expiresAt).valueOf() / 1000)}:R>`
                : "lifetime",
            expires: PremiumPlan.expiresAt == "lifetime" ? "lifetime" : expires,
          })}`
        )
        .setColor(client.color_main);

      return handler.editReply({ embeds: [embed] });
    } else if (type === "guild") {
      const PremiumPlan = await client.db.preGuild.get(handler.guild!.id);
      if (!PremiumPlan) {
        return this.guildProfileNotFound(client, handler);
      }

      const expires =
        PremiumPlan.expiresAt !== "lifetime"
          ? `<t:${Math.floor(moment(PremiumPlan.expiresAt).valueOf() / 1000)}:F>`
          : "lifetime";

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${client.i18n.get(
            handler.language,
            "commands.info",
            "premium_check_guild_profile_author"
          )}`,
          iconURL: client.user!.displayAvatarURL(),
          url: `https://discord.com/oauth2/authorize?client_id=${
            client.user!.id
          }&permissions=8&scope=bot`,
        })
        .setDescription(
          `${client.i18n.get(
            handler.language,
            "commands.info",
            "premium_check_guild_profile_desc",
            {
              guild: String(handler.guild?.name),
              plan:
                PremiumPlan.expiresAt !== "lifetime"
                  ? `<t:${Math.floor(moment(PremiumPlan.expiresAt).valueOf() / 1000)}:R>`
                  : "lifetime",
              expires: PremiumPlan.expiresAt == "lifetime" ? "lifetime" : expires,
            }
          )}`
        )
        .setColor(client.color_main);

      return handler.editReply({ embeds: [embed] });
    }
  }

  private owner(client: Manager, handler: CommandHandler) {
    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${client.i18n.get(
          handler.language,
          "commands.info",
          "premium_check_owner_profile_author"
        )}`,
        iconURL: client.user!.displayAvatarURL(),
        url: `https://discord.com/oauth2/authorize?client_id=${
          client.user!.id
        }&permissions=8&scope=bot`,
      })
      .setDescription(
        `${client.i18n.get(handler.language, "commands.info", "premium_check_user_profile_desc", {
          user: String(handler.user?.displayName),
          plan: "lifetime",
          expires: "lifetime",
        })}`
      )
      .setColor(client.color_main);
    return handler.editReply({ embeds: [embed] });
  }

  private admin(client: Manager, handler: CommandHandler) {
    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${client.i18n.get(
          handler.language,
          "commands.info",
          "premium_check_admin_profile_author"
        )}`,
        iconURL: client.user!.displayAvatarURL(),
        url: `https://discord.com/oauth2/authorize?client_id=${
          client.user!.id
        }&permissions=8&scope=bot`,
      })
      .setDescription(
        `${client.i18n.get(handler.language, "commands.info", "premium_check_user_profile_desc", {
          user: String(handler.user?.displayName),
          plan: "lifetime",
          expires: "lifetime",
        })}`
      )
      .setColor(client.color_main);
    return handler.editReply({ embeds: [embed] });
  }

  private userProfileNotFound(client: Manager, handler: CommandHandler) {
    const noPremiumEmbed = new EmbedBuilder()
      .setAuthor({
        name: `${client.i18n.get(
          handler.language,
          "commands.info",
          "premium_check_user_profile_author"
        )}`,
        iconURL: client.user!.displayAvatarURL(),
        url: `https://discord.com/oauth2/authorize?client_id=${
          client.user!.id
        }&permissions=8&scope=bot`,
      })
      .setDescription(
        `${client.i18n.get(
          handler.language,
          "commands.info",
          "premium_check_user_profile_error_desc",
          {
            user: String(handler.user?.displayName),
          }
        )}`
      )
      .setColor(client.color_main);

    const noPremiumButton = new ActionRowBuilder<ButtonBuilder>();
    if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
      noPremiumButton.addComponents(
        new ButtonBuilder()
          .setLabel(
            client.i18n.get(handler.language, "commands.info", "premium_check_premium_button")
          )
          .setStyle(ButtonStyle.Link)
          .setEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM)
          .setURL(client.config.bot.PREMIUM_URL)
      );
    }

    return handler.editReply({
      embeds: [noPremiumEmbed],
      components: noPremiumButton.components.length ? [noPremiumButton] : [],
    });
  }

  private guildProfileNotFound(client: Manager, handler: CommandHandler) {
    const noPremiumEmbed = new EmbedBuilder()
      .setAuthor({
        name: `${client.i18n.get(
          handler.language,
          "commands.info",
          "premium_check_guild_profile_author"
        )}`,
        iconURL: client.user!.displayAvatarURL(),
      })
      .setDescription(
        `${client.i18n.get(
          handler.language,
          "commands.info",
          "premium_check_guild_profile_error_desc",
          {
            guild: String(handler.guild?.name),
          }
        )}`
      )
      .setColor(client.color_main);

    const noPremiumButton = new ActionRowBuilder<ButtonBuilder>();
    if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
      noPremiumButton.addComponents(
        new ButtonBuilder()
          .setLabel(
            client.i18n.get(handler.language, "commands.info", "premium_check_premium_button")
          )
          .setStyle(ButtonStyle.Link)
          .setEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM)
          .setURL(client.config.bot.PREMIUM_URL)
      );
    }

    return handler.editReply({
      embeds: [noPremiumEmbed],
      components: noPremiumButton.components.length ? [noPremiumButton] : [],
    });
  }
}
