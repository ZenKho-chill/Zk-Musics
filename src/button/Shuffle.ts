import {
  ButtonInteraction,
  CacheType,
  InteractionCollector,
  Message,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  User,
  MessageFlags,
} from "discord.js";
import { PlayerButton } from "../@types/Button.js";
import { Manager } from "../manager.js";
import { ReplyInteractionService } from "../services/ReplyInteractionService.js";
import { ZklinkPlayer, ZklinkTrack } from "../Zklink/main.js";
import { Config } from "../@types/Config.js";
import { ConfigData } from "../services/ConfigData.js";
import { TopggServiceEnum } from "../services/TopggService.js";
const data: Config = new ConfigData().data;
import axios from "axios";
export default class implements PlayerButton {
  name = "shuffle";
  accessableby = data.PLAYER_BUTTON.shuffle;
  async run(
    client: Manager,
    message: ButtonInteraction<CacheType>,
    language: string,
    player: ZklinkPlayer,
    nplaying: Message<boolean>,
    collector: InteractionCollector<ButtonInteraction<"cached">>
  ): Promise<any> {
    if (!client.user) {
      throw new Error("Người dùng client không có sẵn");
    }

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
      if (message.guild && data.guild_id === message.guild.id) {
        PremiumStore = true;
      }
    });
    /////////////////////////////// Kiểm tra Vai trò Premium - bắt đầu ////////////////////////////////
    const PremiumGuildID = client.config.PremiumRole.GuildID;
    const PremiumRoleID = client.config.PremiumRole.RoleID;
    const supportGuild = await client.guilds.fetch(PremiumGuildID).catch(() => null);
    const supportMember = supportGuild
      ? await supportGuild.members.fetch(String(message.user?.id)).catch(() => null)
      : null;
    const isPremiumRole = supportMember ? supportMember.roles.cache.has(PremiumRoleID) : false;
    /////////////////////////////// Kiểm tra Vai trò Premium - kết thúc ////////////////////////////////
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
        isOwner || isAdmin || isPremiumUser || isPremiumGuild || isPremiumRole || PremiumStore,
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
            name: client.i18n.get(language, "server.handlers", "topgg_error_author"),
          })
          .setDescription(
            client.i18n.get(language, "server.handlers", "topgg_error_desc", {
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
            name: client.i18n.get(language, "server.handlers", "topgg_unvote_author"),
          })
          .setDescription(
            client.i18n.get(language, "server.handlers", "topgg_unvote_desc", {
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
              .setLabel(client.i18n.get(language, "server.handlers", "topgg_unvote_button"))
              .setStyle(ButtonStyle.Link)
              .setEmoji(client.config.MENU_HELP_EMOJI.E_VOTE)
              .setURL(`https://top.gg/bot/${client.user?.id}/vote`)
          );
        }
        if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
          VoteButton.addComponents(
            new ButtonBuilder()
              .setLabel(client.i18n.get(language, "server.handlers", "premium_button"))
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
          name: client.i18n.get(language, "server.handlers", "no_premium_role_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "server.handlers", "no_premium_role_desc", {
            user: message.user?.id
              ? `<@${message.user.id}>`
              : `${message.user?.tag || "Người dùng không rõ"}`,
            serversupport: client.config.bot.SERVER_SUPPORT_URL,
            premium: client.config.bot.PREMIUM_URL,
          })}`
        )
        .setColor(client.color_main);
      const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
      if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(client.i18n.get(language, "server.handlers", "no_premium_role_button"))
            .setStyle(ButtonStyle.Link)
            .setEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM)
            .setURL(client.config.bot.PREMIUM_URL)
        );
      }

      return message.reply({
        content: " ",
        embeds: [embed],
        components: PremiumCheckButton.components.length ? [PremiumCheckButton] : [],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (this.accessableby === "Premium" && !userPerm.Premium) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(language, "server.handlers", "no_premium_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "server.handlers", "no_premium_desc", {
            user: message.user?.id
              ? `<@${message.user.id}>`
              : `${message.user?.tag || "Người dùng không rõ"}`,
            serversupport: client.config.bot.SERVER_SUPPORT_URL,
            premium: client.config.bot.PREMIUM_URL,
          })}`
        )
        .setColor(client.color_main);
      const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
      if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(client.i18n.get(language, "server.handlers", "no_premium_button"))
            .setStyle(ButtonStyle.Link)
            .setEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM)
            .setURL(client.config.bot.PREMIUM_URL)
        );
      }

      return message.reply({
        content: " ",
        embeds: [embed],
        components: PremiumCheckButton.components.length ? [PremiumCheckButton] : [],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (this.accessableby === "UserPremium" && !userPerm.UserPremium) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(language, "server.handlers", "no_user_premium_plan_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "server.handlers", "no_user_premium_plan_desc", {
            user: message.user?.id
              ? `<@${message.user.id}>`
              : `${message.user?.tag || "Người dùng không rõ"}`,
            serversupport: client.config.bot.SERVER_SUPPORT_URL,
            premium: client.config.bot.PREMIUM_URL,
          })}`
        )
        .setColor(client.color_main);
      const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
      if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(client.i18n.get(language, "server.handlers", "no_user_premium_button"))
            .setStyle(ButtonStyle.Link)
            .setEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM)
            .setURL(client.config.bot.PREMIUM_URL)
        );
      }

      return message.reply({
        content: " ",
        embeds: [embed],
        components: PremiumCheckButton.components.length ? [PremiumCheckButton] : [],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (this.accessableby === "GuildPremium" && !userPerm.GuildPremium) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(language, "server.handlers", "no_guild_premium_plan_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "server.handlers", "no_guild_premium_plan_desc", {
            user: message.user?.id
              ? `<@${message.user.id}>`
              : `${message.user?.tag || "Người dùng không rõ"}`,
            serversupport: client.config.bot.SERVER_SUPPORT_URL,
            premium: client.config.bot.PREMIUM_URL,
          })}`
        )
        .setColor(client.color_main);
      const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
      if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(client.i18n.get(language, "server.handlers", "no_guild_premium_button"))
            .setStyle(ButtonStyle.Link)
            .setEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM)
            .setURL(client.config.bot.PREMIUM_URL)
        );
      }

      return message.reply({
        content: " ",
        embeds: [embed],
        components: PremiumCheckButton.components.length ? [PremiumCheckButton] : [],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (this.accessableby === "PremiumStore" && !userPerm.PremiumStore) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(language, "server.handlers", "no_premium_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "server.handlers", "no_premium_desc", {
            user: message.user?.id
              ? `<@${message.user.id}>`
              : `${message.user?.tag || "Người dùng không rõ"}`,
            serversupport: client.config.bot.SERVER_SUPPORT_URL,
            premium: client.config.bot.PREMIUM_URL,
          })}`
        )
        .setColor(client.color_main);
      const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
      if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(client.i18n.get(language, "server.handlers", "no_premium_button"))
            .setStyle(ButtonStyle.Link)
            .setEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM)
            .setURL(client.config.bot.PREMIUM_URL)
        );
      }

      return message.reply({
        content: " ",
        embeds: [embed],
        components: PremiumCheckButton.components.length ? [PremiumCheckButton] : [],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!player) {
      collector.stop();
    }

    player.queue.shuffle();

    new ReplyInteractionService(
      client,
      message,
      `${client.i18n.get(language, "client.ui", "shuffle_msg", {
        user: message.user?.id
          ? `<@${message.user.id}>`
          : `${message.user?.tag || "Người dùng không rõ"}`,
      })}`
    );

    client.wsl.get(message.guild!.id)?.send({
      op: "playerQueueShuffle",
      guild: message.guild!.id,
      queue: player.queue.map((track) => {
        const requesterQueue = track.requester as User;
        return {
          title: track.title,
          uri: track.uri,
          length: track.duration,
          thumbnail: track.artworkUrl,
          author: track.author,
          requester: requesterQueue
            ? {
                id: requesterQueue.id,
                username: requesterQueue.username,
                globalName: requesterQueue.globalName,
                defaultAvatarURL: requesterQueue.defaultAvatarURL ?? null,
              }
            : null,
        };
      }),
    });
  }
  getTitle(client: Manager, tracks: ZklinkTrack): string {
    const truncate = (str: string, maxLength: number): string =>
      str.length > maxLength ? str.substring(0, maxLength - 3) + "..." : str;
    const title = truncate(tracks.title, 25);
    const author = truncate(tracks.author, 15);
    const supportUrl = client.config.bot.SERVER_SUPPORT_URL;

    if (client.config.features.HIDE_LINK) {
      return `\`${title}\` bởi \`${author}\``;
    } else if (client.config.features.REPLACE_LINK) {
      return `[\`${title}\`](${supportUrl}) bởi \`${author}\``;
    } else {
      return `[\`${title}\`](${tracks.uri || supportUrl}) bởi \`${author}\``;
    }
  }
}
