import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { ZklinkPlayer } from "../Zklink/Player/ZklinkPlayer.js";
import chalk from "chalk";
import { Manager } from "../manager.js";
import { GuildMember, Interaction } from "discord.js";
import { TopggServiceEnum } from "../services/TopggService.js";
import axios from "axios";
import { EmojiValidator } from "../utilities/EmojiValidator.js";
export default class FilterMenu {
  async execute(client: Manager) {
    const filterInfo: { [key: string]: string } = {
      reset: client.config.SELECT_MENU_FILTER.reset,
      threed: client.config.SELECT_MENU_FILTER.threed,
      bass: client.config.SELECT_MENU_FILTER.bass,
      bassboost: client.config.SELECT_MENU_FILTER.bassboost,
      chipmunk: client.config.SELECT_MENU_FILTER.chipmunk,
      darthvader: client.config.SELECT_MENU_FILTER.darthvader,
      daycore: client.config.SELECT_MENU_FILTER.daycore,
      doubletime: client.config.SELECT_MENU_FILTER.doubletime,
      earrape: client.config.SELECT_MENU_FILTER.earrape,
      karaoke: client.config.SELECT_MENU_FILTER.karaoke,
      nightcore: client.config.SELECT_MENU_FILTER.nightcore,
      pitch: client.config.SELECT_MENU_FILTER.pitch,
      pop: client.config.SELECT_MENU_FILTER.pop,
      rate: client.config.SELECT_MENU_FILTER.rate,
      slowmotion: client.config.SELECT_MENU_FILTER.slowmotion,
      soft: client.config.SELECT_MENU_FILTER.soft,
      speed: client.config.SELECT_MENU_FILTER.speed,
      superbass: client.config.SELECT_MENU_FILTER.superbass,
      china: client.config.SELECT_MENU_FILTER.china,
      televison: client.config.SELECT_MENU_FILTER.televison,
      treblebass: client.config.SELECT_MENU_FILTER.treblebass,
      tremolo: client.config.SELECT_MENU_FILTER.tremolo,
      vaporwave: client.config.SELECT_MENU_FILTER.vaporwave,
      vibrate: client.config.SELECT_MENU_FILTER.vibrate,
      vibrato: client.config.SELECT_MENU_FILTER.vibrato,
    };

    client.on("interactionCreate", async (interaction: Interaction): Promise<void> => {
      if (!interaction.isStringSelectMenu()) return;

      let player = client.Zklink.players.get(interaction.guild!.id) as ZklinkPlayer;

      const guildId = interaction.guild!.id;
      let guildModel = await client.db.language.get(guildId);
      const language = (guildModel = await client.db.language.set(
        guildId,
        client.config.bot.LANGUAGE
      ));

      if (interaction.customId == "filter") {
        const { values } = interaction;
        const selectedFilter = values[0];
        const userId = interaction.user.id;

        const { channel } = (interaction.member as GuildMember)!.voice;
        if (
          !channel ||
          (interaction.member as GuildMember)!.voice.channel !==
            interaction.guild!.members.me!.voice.channel
        ) {
          await interaction.reply({
            content: `${client.i18n.get(language, "events.player", "no_same_voice")}`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        if (!player || !player.queue.current) {
          await interaction.reply({
            content: `${client.i18n.get(language, "events.player", "no_player_filter")}`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const filterStatus = filterInfo[selectedFilter];
        const response = await axios.get(
          `https://discord.com/api/v10/applications/${client.user!.id}/entitlements`,
          {
            headers: {
              Authorization: `Bot ${client.config.bot.TOKEN}`,
            },
          }
        );
        let PremiumStore = false;
        response.data.forEach((data) => {
          if (data.guild_id === interaction.guild.id) {
            PremiumStore = true;
          }
        });

        /////////////////////////////// Kiểm tra Premium Role bắt đầu ////////////////////////////////
        const PremiumGuildID = client.config.PremiumRole.GuildID;
        const PremiumRoleID = client.config.PremiumRole.RoleID;
        const supportGuild = await client.guilds.fetch(PremiumGuildID).catch(() => null);
        const supportMember = supportGuild
          ? await supportGuild.members.fetch(String(interaction.user?.id)).catch(() => null)
          : null;
        const isPremiumRole = supportMember ? supportMember.roles.cache.has(PremiumRoleID) : false;
        /////////////////////////////// Kiểm tra Premium Role kết thúc ////////////////////////////////
        const User = await client.db.premium.get(interaction.user.id);
        const Guild = await client.db.preGuild.get(interaction.guild.id);
        const isPremiumUser = User && User.isPremium;
        const isPremiumGuild = Guild && Guild.isPremium;
        const isOwner = interaction.user.id == client.owner;
        const isAdmin = client.config.bot.ADMIN.includes(interaction.user.id);
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
          filterStatus === "Voter" &&
          client.topgg &&
          !userPerm.owner &&
          !userPerm.admin &&
          !userPerm.UserPremium &&
          !userPerm.GuildPremium &&
          !userPerm.PremiumRole &&
          !userPerm.Premium &&
          !userPerm.PremiumStore
        ) {
          const voteChecker = await client.topgg.checkVote(interaction.user.id);
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
              .setColor(client.color_main)
              .setTimestamp();
            await interaction.reply({
              content: " ",
              embeds: [embed],
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          if (voteChecker == TopggServiceEnum.UNVOTED) {
            const embed = new EmbedBuilder()
              .setAuthor({
                name: client.i18n.get(language, "interaction", "topgg_unvote_author"),
              })
              .setDescription(
                client.i18n.get(language, "interaction", "topgg_unvote_desc", {
                  user: `${interaction.user}`,
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
                  .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_VOTE))
                  .setURL(`https://top.gg/bot/${client.user?.id}/vote`)
              );
            }
            if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
              VoteButton.addComponents(
                new ButtonBuilder()
                  .setLabel(client.i18n.get(language, "interaction", "premium_button"))
                  .setStyle(ButtonStyle.Link)
                  .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM))
                  .setURL(client.config.bot.PREMIUM_URL)
              );
            }
            interaction.reply({
              content: " ",
              embeds: [embed],
              components: VoteButton.components.length ? [VoteButton] : [],
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
        }

        if (filterStatus === "PremiumRole" && !userPerm.PremiumRole) {
          const embed = new EmbedBuilder()
            .setAuthor({
              name: client.i18n.get(language, "interaction", "no_premium_role_author"),
            })
            .setDescription(
              `${client.i18n.get(language, "interaction", "no_premium_role_desc", {
                user: `${interaction.user}`,
                premium: client.config.bot.PREMIUM_URL,
                serversupport: client.config.bot.SERVER_SUPPORT_URL,
              })}`
            )
            .setColor(client.color_main);
          const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
          if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
            PremiumCheckButton.addComponents(
              new ButtonBuilder()
                .setLabel(client.i18n.get(language, "interaction", "no_premium_role_button"))
                .setStyle(ButtonStyle.Link)
                .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM))
                .setURL(client.config.bot.PREMIUM_URL)
            );

            interaction.reply({
              content: " ",
              embeds: [embed],
              components: [PremiumCheckButton],
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
        }

        if (filterStatus === "Premium" && !userPerm.Premium) {
          const embed = new EmbedBuilder()
            .setAuthor({
              name: client.i18n.get(language, "interaction", "no_premium_author"),
            })
            .setDescription(
              `${client.i18n.get(language, "interaction", "no_premium_desc", {
                user: `${interaction.user}`,
                premium: client.config.bot.PREMIUM_URL,
                serversupport: client.config.bot.SERVER_SUPPORT_URL,
              })}`
            )
            .setColor(client.color_main);
          const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
          if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
            PremiumCheckButton.addComponents(
              new ButtonBuilder()
                .setLabel(client.i18n.get(language, "interaction", "no_premium_button"))
                .setStyle(ButtonStyle.Link)
                .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM))
                .setURL(client.config.bot.PREMIUM_URL)
            );

            interaction.reply({
              content: " ",
              embeds: [embed],
              components: [PremiumCheckButton],
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
        }

        if (filterStatus === "UserPremium" && !userPerm.UserPremium) {
          const embed = new EmbedBuilder()
            .setAuthor({
              name: client.i18n.get(language, "interaction", "no_user_premium_plan_author"),
            })
            .setDescription(
              `${client.i18n.get(language, "interaction", "no_user_premium_plan_desc", {
                user: `${interaction.user}`,
                premium: client.config.bot.PREMIUM_URL,
                serversupport: client.config.bot.SERVER_SUPPORT_URL,
              })}`
            )
            .setColor(client.color_main);
          const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
          if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
            PremiumCheckButton.addComponents(
              new ButtonBuilder()
                .setLabel(client.i18n.get(language, "interaction", "no_user_premium_button"))
                .setStyle(ButtonStyle.Link)
                .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM))
                .setURL(client.config.bot.PREMIUM_URL)
            );

            interaction.reply({
              content: " ",
              embeds: [embed],
              components: [PremiumCheckButton],
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
        }

        if (filterStatus === "GuildPremium" && !userPerm.GuildPremium) {
          const embed = new EmbedBuilder()
            .setAuthor({
              name: client.i18n.get(language, "interaction", "no_guild_premium_plan_author"),
            })
            .setDescription(
              `${client.i18n.get(language, "interaction", "no_guild_premium_plan_desc", {
                user: `${interaction.user}`,
                premium: client.config.bot.PREMIUM_URL,
                serversupport: client.config.bot.SERVER_SUPPORT_URL,
              })}`
            )
            .setColor(client.color_main);
          const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
          if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
            PremiumCheckButton.addComponents(
              new ButtonBuilder()
                .setLabel(client.i18n.get(language, "interaction", "no_guild_premium_button"))
                .setStyle(ButtonStyle.Link)
                .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM))
                .setURL(client.config.bot.PREMIUM_URL)
            );

            await interaction.reply({
              content: " ",
              embeds: [embed],
              components: [PremiumCheckButton],
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
        }

        if (filterStatus === "PremiumStore" && !userPerm.PremiumStore) {
          const embed = new EmbedBuilder()
            .setAuthor({
              name: client.i18n.get(language, "interaction", "no_premium_author"),
            })
            .setDescription(
              `${client.i18n.get(language, "interaction", "no_premium_desc", {
                user: `${interaction.user}`,
                premium: client.config.bot.PREMIUM_URL,
                serversupport: client.config.bot.SERVER_SUPPORT_URL,
              })}`
            )
            .setColor(client.color_main);
          const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
          if (client.config.MENU_HELP_EMOJI.E_PREMIUM && client.config.bot.PREMIUM_URL) {
            PremiumCheckButton.addComponents(
              new ButtonBuilder()
                .setLabel(client.i18n.get(language, "interaction", "no_premium_button"))
                .setStyle(ButtonStyle.Link)
                .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM))
                .setURL(client.config.bot.PREMIUM_URL)
            );

            await interaction.reply({
              content: " ",
              embeds: [embed],
              components: [PremiumCheckButton],
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
        }

        switch (selectedFilter) {
          case "reset":
            const resetOptions = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {},
              },
            };
            await player?.send(resetOptions);
            await player?.setVolume(player?.volume);
            break;

          case "threed":
            const threed = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  rotation: { rotationHz: 0.2 },
                },
              },
            };

            await player?.send(threed);
            break;

          case "bass":
            const bass = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  equalizer: [
                    { band: 0, gain: 0.1 },
                    { band: 1, gain: 0.1 },
                    { band: 2, gain: 0.05 },
                    { band: 3, gain: 0.05 },
                    { band: 4, gain: -0.05 },
                    { band: 5, gain: -0.05 },
                    { band: 6, gain: 0 },
                    { band: 7, gain: -0.05 },
                    { band: 8, gain: -0.05 },
                    { band: 9, gain: 0 },
                    { band: 10, gain: 0.05 },
                    { band: 11, gain: 0.05 },
                    { band: 12, gain: 0.1 },
                    { band: 13, gain: 0.1 },
                  ],
                },
              },
            };

            await player?.send(bass);
            break;

          case "bassboost":
            const bassboost = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  equalizer: [
                    { band: 0, gain: 0.1 },
                    { band: 1, gain: 0.1 },
                    { band: 2, gain: 0.05 },
                    { band: 3, gain: 0.05 },
                    { band: 4, gain: -0.05 },
                    { band: 5, gain: -0.05 },
                    { band: 6, gain: 0 },
                    { band: 7, gain: -0.05 },
                    { band: 8, gain: -0.05 },
                    { band: 9, gain: 0 },
                    { band: 10, gain: 0.05 },
                    { band: 11, gain: 0.05 },
                    { band: 12, gain: 0.1 },
                    { band: 13, gain: 0.1 },
                  ],
                },
              },
            };

            await player?.send(bassboost);
            break;

          case "china":
            const china = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  timescale: {
                    speed: 0.75,
                    pitch: 1.25,
                    rate: 1.25,
                  },
                },
              },
            };

            await player?.send(china);
            break;

          case "chipmunk":
            const chipmunk = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  timescale: {
                    speed: 1.05,
                    pitch: 1.35,
                    rate: 1.25,
                  },
                },
              },
            };

            await player?.send(chipmunk);
            break;

          case "darthvader":
            const darthvader = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  timescale: {
                    speed: 0.975,
                    pitch: 0.5,
                    rate: 0.8,
                  },
                },
              },
            };

            await player?.send(darthvader);
            break;

          case "daycore":
            const daycore = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  equalizer: [
                    { band: 0, gain: 0 },
                    { band: 1, gain: 0 },
                    { band: 2, gain: 0 },
                    { band: 3, gain: 0 },
                    { band: 4, gain: 0 },
                    { band: 5, gain: 0 },
                    { band: 6, gain: 0 },
                    { band: 7, gain: 0 },
                    { band: 8, gain: -0.25 },
                    { band: 9, gain: -0.25 },
                    { band: 10, gain: -0.25 },
                    { band: 11, gain: -0.25 },
                    { band: 12, gain: -0.25 },
                    { band: 13, gain: -0.25 },
                  ],
                  timescale: {
                    pitch: 0.63,
                    rate: 1.05,
                  },
                },
              },
            };

            await player?.send(daycore);
            break;

          case "doubletime":
            const doubletime = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  timescale: {
                    speed: 1.165,
                  },
                },
              },
            };

            await player?.send(doubletime);
            break;

          case "earrape":
            const earrape = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {},
              },
            };

            await player?.send(earrape);
            await player?.setVolume(500);
            break;

          case "karaoke":
            const karaoke = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  karaoke: {
                    level: 1.0,
                    monoLevel: 1.0,
                    filterBand: 220.0,
                    filterWidth: 100.0,
                  },
                },
              },
            };

            await player?.send(karaoke);
            break;

          case "nightcore":
            const nightcore = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  timescale: {
                    speed: 1.05,
                    pitch: 1.125,
                    rate: 1.05,
                  },
                },
              },
            };

            await player?.send(nightcore);
            break;

          case "pitch":
            const pitch = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  timescale: { pitch: Number(2) },
                },
              },
            };
            await player?.send(pitch);
            break;

          case "pop":
            const pop = {
              op: "filters",
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  equalizer: [
                    { band: 0, gain: 0.65 },
                    { band: 1, gain: 0.45 },
                    { band: 2, gain: -0.45 },
                    { band: 3, gain: -0.65 },
                    { band: 4, gain: -0.35 },
                    { band: 5, gain: 0.45 },
                    { band: 6, gain: 0.55 },
                    { band: 7, gain: 0.6 },
                    { band: 8, gain: 0.6 },
                    { band: 9, gain: 0.6 },
                    { band: 10, gain: 0 },
                    { band: 11, gain: 0 },
                    { band: 12, gain: 0 },
                    { band: 13, gain: 0 },
                  ],
                },
              },
            };

            await player?.send(pop);
            break;

          case "rate":
            const rate = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  timescale: { rate: Number(1) },
                },
              },
            };

            await player?.send(rate);
            break;

          case "slowmotion":
            const slowmotion = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  timescale: {
                    speed: 0.5,
                    pitch: 1.0,
                    rate: 0.8,
                  },
                },
              },
            };

            await player?.send(slowmotion);
            break;

          case "soft":
            const soft = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  equalizer: [
                    { band: 0, gain: 0 },
                    { band: 1, gain: 0 },
                    { band: 2, gain: 0 },
                    { band: 3, gain: 0 },
                    { band: 4, gain: 0 },
                    { band: 5, gain: 0 },
                    { band: 6, gain: 0 },
                    { band: 7, gain: 0 },
                    { band: 8, gain: -0.25 },
                    { band: 9, gain: -0.25 },
                    { band: 10, gain: -0.25 },
                    { band: 11, gain: -0.25 },
                    { band: 12, gain: -0.25 },
                    { band: 13, gain: -0.25 },
                  ],
                },
              },
            };

            await player?.send(soft);
            break;

          case "speed":
            const speed = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  timescale: { speed: Number(2) },
                },
              },
            };

            await player?.send(speed);
            break;

          case "superbass":
            const superbass = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  equalizer: [
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
                  ],
                },
              },
            };

            await player?.send(superbass);
            break;

          case "television":
            const television = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  equalizer: [
                    { band: 0, gain: 0 },
                    { band: 1, gain: 0 },
                    { band: 2, gain: 0 },
                    { band: 3, gain: 0 },
                    { band: 4, gain: 0 },
                    { band: 5, gain: 0 },
                    { band: 6, gain: 0 },
                    { band: 7, gain: 0.65 },
                    { band: 8, gain: 0.65 },
                    { band: 9, gain: 0.65 },
                    { band: 10, gain: 0.65 },
                    { band: 11, gain: 0.65 },
                    { band: 12, gain: 0.65 },
                    { band: 13, gain: 0.65 },
                  ],
                },
              },
            };

            await player?.send(television);
            break;

          case "treblebass":
            const treblebass = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  equalizer: [
                    { band: 0, gain: 0.6 },
                    { band: 1, gain: 0.67 },
                    { band: 2, gain: 0.67 },
                    { band: 3, gain: 0 },
                    { band: 4, gain: -0.5 },
                    { band: 5, gain: 0.15 },
                    { band: 6, gain: -0.45 },
                    { band: 7, gain: 0.23 },
                    { band: 8, gain: 0.35 },
                    { band: 9, gain: 0.45 },
                    { band: 10, gain: 0.55 },
                    { band: 11, gain: 0.6 },
                    { band: 12, gain: 0.55 },
                    { band: 13, gain: 0 },
                  ],
                },
              },
            };

            await player?.send(treblebass);
            break;

          case "tremolo":
            const tremolo = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  tremolo: {
                    frequency: 4.0,
                    depth: 0.75,
                  },
                },
              },
            };

            await player?.send(tremolo);
            break;

          case "vaporwave":
            const vaporwave = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  equalizer: [
                    { band: 0, gain: 0 },
                    { band: 1, gain: 0 },
                    { band: 2, gain: 0 },
                    { band: 3, gain: 0 },
                    { band: 4, gain: 0 },
                    { band: 5, gain: 0 },
                    { band: 6, gain: 0 },
                    { band: 7, gain: 0 },
                    { band: 8, gain: 0.15 },
                    { band: 9, gain: 0.15 },
                    { band: 10, gain: 0.15 },
                    { band: 11, gain: 0.15 },
                    { band: 12, gain: 0.15 },
                    { band: 13, gain: 0.15 },
                  ],
                  timescale: {
                    pitch: 0.55,
                  },
                },
              },
            };

            await player?.send(vaporwave);
            break;

          case "vibrate":
            const vibrate = {
              guildId: interaction.guild!.id,
              playerOptions: {
                filters: {
                  vibrato: {
                    frequency: 4.0,
                    depth: 0.75,
                  },
                  tremolo: {
                    frequency: 4.0,
                    depth: 0.75,
                  },
                },
              },
            };

            await player?.send(vibrate);
            break;

          case "vibrato":
            const vibrato = {
              guildId: interaction.guild!.id,
              playerOptions: {
                vibrato: {
                  frequency: 4.0,
                  depth: 0.75,
                },
                filters: {
                  vibrato: {
                    frequency: 4.0,
                    depth: 0.75,
                  },
                },
              },
            };

            await player?.send(vibrato);
            break;
        }

        await interaction.reply({
          content: `${client.i18n.get(language, "events.player", "filter_menu_on", {
            name: selectedFilter,
          })}`,
          flags: MessageFlags.Ephemeral,
        });
        client.logger.info(
          "FilterMenu",
          `${chalk.hex("#00D100").bold(selectedFilter)} được sử dụng bởi ${chalk
            .hex("#00D100")
            .bold(`${interaction.user.displayName} (${interaction.user.id})`)} từ ${chalk
            .hex("#00D100")
            .bold(`${interaction.guild!.name} (${interaction.guild!.id})`)}`
        );
      }
    });
  }
}
