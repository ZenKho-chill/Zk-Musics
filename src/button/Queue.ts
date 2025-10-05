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
import { FormatDuration } from "../utilities/FormatDuration.js";
import { ProgressBar } from "../utilities/ProgressBar.js";
import { ZklinkPlayer, ZklinkTrack } from "../Zklink/main.js";
import { Config } from "../@types/Config.js";
import { ConfigData } from "../services/ConfigData.js";
import { TopggServiceEnum } from "../services/TopggService.js";
import { log } from "../utilities/LoggerHelper.js";
const data: Config = ConfigData.getInstance().data;
import axios from "axios";
export default class implements PlayerButton {
  name = "queue";
  accessableby = data.PLAYER_BUTTON.queue;
  async run(
    client: Manager,
    message: ButtonInteraction<CacheType>,
    language: string,
    player: ZklinkPlayer,
    nplaying: Message<boolean>,
    collector: InteractionCollector<ButtonInteraction<"cached">>
  ): Promise<any> {
    log.info(message.user.id, "Queue button pressed", message.guild?.id, `Player: ${player.guildId}`);
    
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
            name: client.i18n.get(language, "interaction", "topgg_error_author"),
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
            name: client.i18n.get(language, "interaction", "topgg_unvote_author"),
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
              .setLabel(client.i18n.get(language, "interaction", "topgg_unvote_button"))
              .setStyle(ButtonStyle.Link)
              .setEmoji(client.config.MENU_HELP_EMOJI.E_VOTE)
              .setURL(`https://top.gg/bot/${client.user?.id}/vote`)
          );
        }
        if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
          VoteButton.addComponents(
            new ButtonBuilder()
              .setLabel(client.i18n.get(language, "interaction", "premium_button"))
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
          name: client.i18n.get(language, "interaction", "no_premium_role_author"),
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
      if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(client.i18n.get(language, "interaction", "no_premium_role_button"))
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
      if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(client.i18n.get(language, "interaction", "no_premium_button"))
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
          name: client.i18n.get(language, "interaction", "no_user_premium_plan_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "interaction", "no_user_premium_plan_desc", {
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
            .setLabel(client.i18n.get(language, "interaction", "no_user_premium_button"))
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
          name: client.i18n.get(language, "interaction", "no_guild_premium_plan_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "interaction", "no_guild_premium_plan_desc", {
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
            .setLabel(client.i18n.get(language, "interaction", "no_guild_premium_button"))
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
      if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(client.i18n.get(language, "interaction", "no_premium_button"))
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
    const song = player.queue.current;
    const position = player.position;
    const qduration = `${new FormatDuration().parse(song!.duration + player.queue.duration)}`;
    const CurrentDuration = new FormatDuration().parse(position);
    const TotalDuration = new FormatDuration().parse(song!.duration);
    const bar = ProgressBar(position, song!.duration, 20);
    const thumbnail =
      song?.artworkUrl ?? `https://img.youtube.com/vi/${song!.identifier}/hqdefault.jpg`;

    const source = player.queue.current?.source || "unknown";
    let src = client.config.PLAYER_SOURCENAME.UNKNOWN; // Mặc định là UNKNOWN nếu nguồn không xác định
    if (source === "youtube") {
      src = client.config.PLAYER_SOURCENAME.YOUTUBE;
    } else if (source === "spotify") {
      src = client.config.PLAYER_SOURCENAME.SPOTIFY;
    } else if (source === "tidal") {
      src = client.config.PLAYER_SOURCENAME.TIDAL;
    } else if (source === "soundcloud") {
      src = client.config.PLAYER_SOURCENAME.SOUNDCLOUD;
    } else if (source === "deezer") {
      src = client.config.PLAYER_SOURCENAME.DEEZER;
    } else if (source === "twitch") {
      src = client.config.PLAYER_SOURCENAME.TWITCH;
    } else if (source === "apple") {
      src = client.config.PLAYER_SOURCENAME.APPLE_MUSIC;
    } else if (source === "applemusic") {
      src = client.config.PLAYER_SOURCENAME.APPLE_MUSIC;
    } else if (source === "youtube_music") {
      src = client.config.PLAYER_SOURCENAME.YOUTUBE_MUSIC;
    } else if (source === "http") {
      src = client.config.PLAYER_SOURCENAME.HTTP;
    }

    let pagesNum = Math.ceil(player.queue.length / 10);
    if (pagesNum === 0) pagesNum = 1;

    const songStrings: string[] = [];
    for (let i = 0; i < player.queue.length; i++) {
      const song = player.queue[i];
      songStrings.push(
        `**${i + 1}.** ${this.getTitle(
          client,
          song
        )} \`[${new FormatDuration().parse(song.duration)}]\`
        `
      );
    }

    const pages: EmbedBuilder[] = [];
    for (let i = 0; i < pagesNum; i++) {
      const str = songStrings.slice(i * 10, i * 10 + 10).join("");

      const embedQueue = new EmbedBuilder()
        .setTitle(`${client.i18n.get(language, "button.player.music", "queue_title")}`)
        .setThumbnail(thumbnail)
        .setColor(client.color_second)
        .setDescription(
          `${client.i18n.get(language, "button.player.music", "queue_description", {
            title: this.getTitle(client, song!),
            duration: new FormatDuration().parse(song?.duration),
            requester: `${song!.requester}`,
            list_song: str == "" ? "  `Không có bài`" : "\n" + str,
          })}`
        )
        .setFooter({
          text: `${client.i18n.get(language, "button.player.music", "queue_footer", {
            page: `${i + 1}`,
            pages: `${pagesNum}`,
            queue_lang: `${player.queue.length}`,
            total_duration: qduration,
          })}`,
        });

      pages.push(embedQueue);
    }
    if (player.queue.length === 0) {
      const fieldDataGlobal = [
        {
          name: `${client.config.TRACKS_EMOJI.Author} ${song?.author} ♪`,
          value: `${
            client.config.TRACKS_EMOJI.Timers
          } **${new FormatDuration().parse(song!.duration)}**`,
          inline: true,
        },
        {
          name: `**${
            player!.data.get("autoplay")
              ? `${client.config.TRACKS_EMOJI.Autoplay} Tự phát`
              : `${client.config.TRACKS_EMOJI.Volume} ${player.volume}%`
          }**`,
          value: `**${src}**`,
          inline: true,
        },
        {
          name: `**Thời lượng hiện tại**`,
          value: `\`${CurrentDuration} / ${new FormatDuration().parse(song!.duration)}\n${bar}\``,
          inline: false,
        },
      ];
      const embedNoQueue = new EmbedBuilder()
        .setDescription(`**${this.getTitle(client, song!)}**`)
        .setColor(client.color_second)
        .setThumbnail(
          source === "soundcloud"
            ? (client.user?.displayAvatarURL() as string)
            : (song?.artworkUrl ?? `https://img.youtube.com/vi/${song?.identifier}/hqdefault.jpg`)
        )
        .addFields(fieldDataGlobal);
      message.reply({ embeds: [embedNoQueue], ephemeral: true });
    } else {
      message.reply({ embeds: [pages[0]], ephemeral: true });
    }
  }

  getTitle(client: Manager, tracks: ZklinkTrack): string {
    const truncate = (str: string, maxLength: number): string =>
      str.length > maxLength ? str.substring(0, maxLength - 3) + "..." : str;
    const title = truncate(tracks.title, 25);
    const author = truncate(tracks.author, 15);
    const supportUrl = client.config.bot.SERVER_SUPPORT_URL;

    if (new FormatDuration().parse(tracks.duration) === "Live Stream") {
      return `${author}`;
    }
    if (client.config.features.HIDE_LINK) {
      return `\`${title}\` bởi \`${author}\``;
    } else if (client.config.features.REPLACE_LINK) {
      return `[${title}](${supportUrl}) bởi ${author}`;
    } else {
      return `[${title}](${tracks.uri || supportUrl}) bởi \`${author}\``;
    }
  }
}
