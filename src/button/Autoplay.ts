import {
  ButtonInteraction,
  CacheType,
  InteractionCollector,
  Message,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
} from "discord.js";
import { PlayerButton } from "../@types/Button.js";
import { Manager } from "../manager.js";
import { ReplyInteractionService } from "../services/ReplyInteractionService.js";
import { ZkslinkPlayer } from "../zklink/main.js";
import { Config } from "../@types/Config.js";
import { ConfigData } from "../services/ConfigData.js";
import { TopggServiceEnum } from "../services/TopggService.js";
const data: Config = new ConfigData().data;
import axios from "axios";
export default class implements PlayerButton {
  name = "autoplay";
  accessableby = data.PLAYER_BUTTON.autoplay;
  async run(
    client: Manager,
    message: ButtonInteraction<CacheType>,
    language: string,
    player: ZkslinkPlayer,
    nplaying: Message<boolean>,
    collector: InteractionCollector<ButtonInteraction<"cached">>
  ): Promise<any> {
    const response = await axios.get(
      `https://discord.com/api/v10/applications/${client.user.id}/entitlements`,
      {
        headers: {
          Authorization: `Bot ${client.config.bot.TOKEN}`,
        },
      }
    );
    let PremiumStore = false;
    response.data.forEach((data) => {
      if (data.guild_id === message.guild.id) {
        PremiumStore = true;
      }
    });
    /////////////////////////////// Check Premium Role start ////////////////////////////////
    const PremiumGuildID = client.config.PremiumRole.GuildID;
    const PremiumRoleID = client.config.PremiumRole.RoleID;
    const supportGuild = await client.guilds
      .fetch(PremiumGuildID)
      .catch(() => null);
    const supportMember = supportGuild
      ? await supportGuild.members
          .fetch(String(message.user?.id))
          .catch(() => null)
      : null;
    const isPremiumRole = supportMember
      ? supportMember.roles.cache.has(PremiumRoleID)
      : false;
    /////////////////////////////// Check Premium Role end ////////////////////////////////
    const User = await client.db.premium.get(message.user.id);
    const Guild = await client.db.preGuild.get(String(message.guild?.id));
    const isPremiumUser = User && User.isPremium;
    const isPremiumGuild = Guild && Guild.isPremium;
    const isOwner = message.user.id == client.owner;
    const isAdmin = client.config.bot.ADMIN.includes(message.user.id);
    const userPerm = {
      owner: isOwner,
      admin: isOwner || isAdmin,
      PremiumStore: PremiumStore,
      PremiumRole: isOwner || isAdmin || isPremiumRole,
      UserPremium: isOwner || isAdmin || isPremiumUser,
      GuildPremium: isOwner || isAdmin || isPremiumGuild,
      Premium:
        isOwner ||
        isAdmin ||
        isPremiumUser ||
        isPremiumGuild ||
        isPremiumRole ||
        PremiumStore,
    };
    if (
      this.accessableby === "Voter" &&
      client.topgg &&
      !userPerm.owner &&
      !userPerm.admin &&
      !userPerm.UserPremium &&
      !userPerm.GuildPremium &&
      !userPerm.PremiumRole &&
      !userPerm.Premium &&
      !userPerm.PremiumStore
    ) {
      const voteChecker = await client.topgg.checkVote(message.user!.id);
      if (voteChecker == TopggServiceEnum.ERROR) {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: client.i18n.get(
              language,
              "interaction",
              "topgg_error_author"
            ),
          })
          .setDescription(
            client.i18n.get(language, "interaction", "topgg_error_desc", {
              serversupport: client.config.bot.SERVER_SUPPORT_URL,
              premium: client.config.bot.PREMIUM_URL,
            })
          )
          .setColor(client.color_main);
        return message.reply({
          content: " ",
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      }

      if (voteChecker == TopggServiceEnum.UNVOTED) {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: client.i18n.get(
              language,
              "interaction",
              "topgg_unvote_author"
            ),
          })
          .setDescription(
            client.i18n.get(language, "interaction", "topgg_unvote_desc", {
              user: message.user?.id
                ? `<@${message.user.id}>`
                : `${message.user?.tag || "Người dùng không rõ"}`,
              serversupport: client.config.bot.SERVER_SUPPORT_URL,
              premium: client.config.bot.PREMIUM_URL,
            })
          )
          .setColor(client.color_main);
        const VoteButton = new ActionRowBuilder<ButtonBuilder>();
        if (client.config.MENU_HELP_EMOJI.E_VOTE) {
          VoteButton.addComponents(
            new ButtonBuilder()
              .setLabel(
                client.i18n.get(language, "interaction", "topgg_unvote_button")
              )
              .setStyle(ButtonStyle.Link)
              .setEmoji(client.config.MENU_HELP_EMOJI.E_VOTE)
              .setURL(`https://top.gg/bot/${client.user?.id}/vote`)
          );
        }
        if (
          client.config.MENU_HELP_EMOJI.E_PREMIUM &&
          client.config.bot.PREMIUM_URL
        ) {
          VoteButton.addComponents(
            new ButtonBuilder()
              .setLabel(
                client.i18n.get(language, "interaction", "premium_button")
              )
              .setStyle(ButtonStyle.Link)
              .setEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM)
              .setURL(client.config.bot.PREMIUM_URL)
          );
        }
        return message.reply({
          content: " ",
          embeds: [embed],
          components: VoteButton.components.length ? [VoteButton] : [],
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    if (this.accessableby === "PremiumRole" && !userPerm.PremiumRole) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(
            language,
            "interaction",
            "no_premium_role_author"
          ),
        })
        .setDescription(
          `${client.i18n.get(language, "interaction", "no_premium_role_desc", {
            user: message.user?.id
              ? `<@${message.user.id}>`
              : `${message.user?.tag || "Người dùng không rõ"}`,
            serversupport: client.config.bot.SERVER_SUPPORT_URL,
            premium: client.config.bot.PREMIUM_URL,
          })}`
        )
        .setColor(client.color_main);
      const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
      if (
        client.config.MENU_HELP_EMOJI.E_PREMIUM &&
        client.config.bot.PREMIUM_URL
      ) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(
              client.i18n.get(language, "interaction", "no_premium_role_button")
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM)
            .setURL(client.config.bot.PREMIUM_URL)
        );
      }

      return message.reply({
        content: " ",
        embeds: [embed],
        components: PremiumCheckButton.components.length
          ? [PremiumCheckButton]
          : [],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (this.accessableby === "Premium" && !userPerm.Premium) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(language, "interaction", "no_premium_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "interaction", "no_premium_desc", {
            user: message.user?.id
              ? `<@${message.user.id}>`
              : `${message.user?.tag || "Người dùng không rõ"}`,
            serversupport: client.config.bot.SERVER_SUPPORT_URL,
            premium: client.config.bot.PREMIUM_URL,
          })}`
        )
        .setColor(client.color_main);
      const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
      if (
        client.config.MENU_HELP_EMOJI.E_PREMIUM &&
        client.config.bot.PREMIUM_URL
      ) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(
              client.i18n.get(language, "interaction", "no_premium_button")
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM)
            .setURL(client.config.bot.PREMIUM_URL)
        );
      }

      return message.reply({
        content: " ",
        embeds: [embed],
        components: PremiumCheckButton.components.length
          ? [PremiumCheckButton]
          : [],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (this.accessableby === "UserPremium" && !userPerm.UserPremium) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(
            language,
            "interaction",
            "no_user_premium_plan_author"
          ),
        })
        .setDescription(
          `${client.i18n.get(
            language,
            "interaction",
            "no_user_premium_plan_desc",
            {
              user: message.user?.id
                ? `<@${message.user.id}>`
                : `${message.user?.tag || "Người dùng không rõ"}`,
              serversupport: client.config.bot.SERVER_SUPPORT_URL,
              premium: client.config.bot.PREMIUM_URL,
            }
          )}`
        )
        .setColor(client.color_main);
      const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
      if (
        client.config.MENU_HELP_EMOJI.E_PREMIUM &&
        client.config.bot.PREMIUM_URL
      ) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(
              client.i18n.get(language, "interaction", "no_user_premium_button")
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM)
            .setURL(client.config.bot.PREMIUM_URL)
        );
      }

      return message.reply({
        content: " ",
        embeds: [embed],
        components: PremiumCheckButton.components.length
          ? [PremiumCheckButton]
          : [],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (this.accessableby === "GuildPremium" && !userPerm.GuildPremium) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(
            language,
            "interaction",
            "no_guild_premium_plan_author"
          ),
        })
        .setDescription(
          `${client.i18n.get(
            language,
            "interaction",
            "no_guild_premium_plan_desc",
            {
              user: message.user?.id
                ? `<@${message.user.id}>`
                : `${message.user?.tag || "Người dùng không rõ"}`,
              serversupport: client.config.bot.SERVER_SUPPORT_URL,
              premium: client.config.bot.PREMIUM_URL,
            }
          )}`
        )
        .setColor(client.color_main);
      const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
      if (
        client.config.MENU_HELP_EMOJI.E_PREMIUM &&
        client.config.bot.PREMIUM_URL
      ) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(
              client.i18n.get(
                language,
                "interaction",
                "no_guild_premium_button"
              )
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM)
            .setURL(client.config.bot.PREMIUM_URL)
        );
      }

      return message.reply({
        content: " ",
        embeds: [embed],
        components: PremiumCheckButton.components.length
          ? [PremiumCheckButton]
          : [],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (this.accessableby === "PremiumStore" && !userPerm.PremiumStore) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(language, "interaction", "no_premium_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "interaction", "no_premium_desc", {
            user: message.user?.id
              ? `<@${message.user.id}>`
              : `${message.user?.tag || "Unknown User"}`,
            serversupport: client.config.bot.SERVER_SUPPORT_URL,
            premium: client.config.bot.PREMIUM_URL,
          })}`
        )
        .setColor(client.color_main);
      const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
      if (
        client.config.MENU_HELP_EMOJI.E_PREMIUM &&
        client.config.bot.PREMIUM_URL
      ) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(
              client.i18n.get(language, "interaction", "no_premium_button")
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM)
            .setURL(client.config.bot.PREMIUM_URL)
        );
      }

      return message.reply({
        content: " ",
        embeds: [embed],
        components: PremiumCheckButton.components.length
          ? [PremiumCheckButton]
          : [],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!client.config.features.AUTOPLAY_SUPPORT) {
      const AutoplayDisabledEmbed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(language, "commands.music", "autoplay_disabled", {
            user: message.user?.id
              ? `<@${message.user.id}>`
              : `${message.user?.tag || "Unknown User"}`,
            botname: client.user!.username || client.user!.displayName,
            serversupport: client.config.bot.SERVER_SUPPORT_URL,
          })}`
        )
        .setColor(client.color_main);

      return message.reply({
        content: " ",
        embeds: [AutoplayDisabledEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!player) {
      collector.stop();
    }

    if (player.data.get("autoplay") === true) {
      player.data.set("autoplay", false);
      player.data.set("identifier", null);
      player.data.set("requester", null);
      player.queue.clear();

      await new ReplyInteractionService(
        client,
        message,
        `${client.i18n.get(language, "button.player.music", "autoplay_off", {
          mode: "Enable",
        })}`
      );
    } else {
      if (!player!.queue.current) {
        await new ReplyInteractionService(
          client,
          message,
          `${client.i18n.get(
            language,
            "button.player.music",
            "autoplay_no_song"
          )}`
        );
      }

      const identifier = player.queue.current!.identifier;

      player.data.set("autoplay", true);
      player.data.set("identifier", identifier);
      player.data.set("requester", message.user);
      player.data.set("source", player.queue.current?.source);
      player.data.set("author", player.queue.current?.author);
      player.data.set("title", player.queue.current?.title);

      await new ReplyInteractionService(
        client,
        message,
        `${client.i18n.get(language, "button.player.music", "autoplay_on", {
          mode: "Enable",
        })}`
      );
    }
  }
}
