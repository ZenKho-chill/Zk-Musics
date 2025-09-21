import {
  PermissionsBitField,
  CommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ApplicationCommandOptionType,
  Attachment,
  GuildMember,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteractionOption,
  CacheType,
} from "discord.js";
import chalk from "chalk";
import { Manager } from "../../manager.js";
import { GlobalInteraction, NoAutoInteraction } from "../../@types/Interaction.js";
import {
  CheckPermissionResultInterface,
  CheckPermServices,
} from "../../services/CheckPermServices.js";
import axios from "axios";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Accessableby } from "../../structures/Command.js";
import { ConvertToMention } from "../../utilities/ConvertToMention.js";
import { RateLimitResponder } from "../../services/RateLimitResponder.js";
import { RateLimitManager } from "@sapphire/ratelimits";
import { AutocompleteManager } from "../../services/AutocompleteManager.js";
import { TopggServiceEnum } from "../../services/TopggService.js";
import { logWarn, logInfo, logError } from "../../utilities/Logger.js";
import { Mode247Builder } from "../../services/Mode247Builder.js";
const commandRateLimitManager = new RateLimitManager(1000);

/**
 * @param {GlobalInteraction} interaction
 */
// @param {GlobalInteraction} interaction - Tương tác toàn cục

export default class {
  async execute(client: Manager, interaction: GlobalInteraction) {
    if (interaction.isAutocomplete()) return new AutocompleteManager(client, interaction);
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild || interaction.user.bot) return;

    if (!client.isDatabaseConnected)
      return logWarn(
        "DatabaseService",
        "Cơ sở dữ liệu chưa kết nối nên sự kiện này tạm thời sẽ không chạy. Vui lòng thử lại sau!"
      );

    let guildModel = await client.db.language.get(`${interaction.guild.id}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(
        `${interaction.guild.id}`,
        client.config.bot.LANGUAGE
      );
    }

    const language = guildModel;

    let subCommandName = "";
    try {
      subCommandName = interaction.options.getSubcommand();
    } catch {}
    let subCommandGroupName;
    try {
      subCommandGroupName = interaction.options.getSubcommandGroup();
    } catch {}

    const commandNameArray = [];

    if (interaction.commandName) commandNameArray.push(interaction.commandName);
    if (subCommandName.length !== 0 && !subCommandGroupName) commandNameArray.push(subCommandName);
    if (subCommandGroupName) {
      commandNameArray.push(subCommandGroupName);
      commandNameArray.push(subCommandName);
    }

    const command = client.commands.get(commandNameArray.join("-"));

    if (!command) return commandNameArray.length == 0;

    //////////////////////////////// Kiểm tra giới hạn tốc độ bắt đầu ////////////////////////////////
    const ratelimit = commandRateLimitManager.acquire(
      `${interaction.user.id}@${command.name.join("-")}`
    );

    if (ratelimit.limited) {
      new RateLimitResponder({
        client: client,
        language: language,
        interaction: interaction,
        time: Number(((ratelimit.expires - Date.now()) / 1000).toFixed(1)),
      }).reply();
      return;
    } else if (ratelimit.limited) return;

    ratelimit.consume();
    //////////////////////////////// Kiểm tra giới hạn tốc độ kết thúc ////////////////////////////////

    //////////////////////////////// Kiểm tra quyền bắt đầu ////////////////////////////////
    const permissionChecker = new CheckPermServices();

    // Quyền mặc định
    const defaultPermissions = [
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.ReadMessageHistory,
    ];
    const musicPermissions = [PermissionFlagsBits.Speak, PermissionFlagsBits.Connect];
    const managePermissions = [PermissionFlagsBits.ManageChannels];

    async function respondError(
      interaction: ChatInputCommandInteraction | CommandInteraction,
      permissionResult: CheckPermissionResultInterface
    ) {
      const selfErrorString = `${client.i18n.get(language, "interaction", "no_perms", {
        perm: permissionResult.result,
      })}`;
      const embed = new EmbedBuilder()
        .setDescription(
          permissionResult.channel == "Self"
            ? selfErrorString
            : `${client.i18n.get(language, "interaction", "no_perms_channel", {
                perm: permissionResult.result,
                channel: permissionResult.channel,
              })}`
        )
        .setColor(client.color_main);
      await interaction.reply({
        embeds: [embed],
      });
    }

    if (command.name[0] !== "help") {
      const returnData = await permissionChecker.interaction(interaction, defaultPermissions);
      if (returnData.result !== "PermissionPass") return respondError(interaction, returnData);
    }
    if (command.category.toLocaleLowerCase() == "music") {
      const returnData = await permissionChecker.interaction(interaction, musicPermissions);
      if (returnData.result !== "PermissionPass") return respondError(interaction, returnData);
    }
    if (command.accessableby.includes(Accessableby.Manager)) {
      const returnData = await permissionChecker.interaction(interaction, managePermissions);
      if (returnData.result !== "PermissionPass") return respondError(interaction, returnData);
    } else if (command.permissions.length !== 0) {
      const returnData = await permissionChecker.interaction(interaction, command.permissions);
      if (returnData.result !== "PermissionPass") return respondError(interaction, returnData);
    }
    //////////////////////////////// Kiểm tra quyền kết thúc ////////////////////////////////

    //////////////////////////////// Kiểm tra khả dụng bắt đầu ////////////////////////////////
    const isNotManager = !(interaction.member!.permissions as Readonly<PermissionsBitField>).has(
      PermissionsBitField.Flags.ManageGuild
    );

    if (command.accessableby.includes(Accessableby.Manager) && isNotManager)
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(language, "interaction", "no_manage_guild_perms", {
                perm: "ManageGuild",
              })}`
            )
            .setColor(client.color_main),
        ],
      });

    if (command.playerCheck) {
      const player = client.Zklink.players.get(interaction.guild!.id);
      const twentyFourBuilder = new Mode247Builder(client);
      const is247 = await twentyFourBuilder.get(interaction.guild!.id);
      if (
        !player ||
        (is247 && is247.twentyfourseven && player.queue.length == 0 && !player.queue.current)
      )
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${client.i18n.get(language, "interaction", "no_player")}`)
              .setColor(client.color_main),
          ],
        });
    }

    if (command.sameVoiceCheck) {
      const { channel } = (interaction.member as GuildMember)!.voice;
      if (
        !channel ||
        (interaction.member as GuildMember)!.voice.channel !==
          interaction.guild!.members.me!.voice.channel
      )
        return (interaction as NoAutoInteraction).reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${client.i18n.get(language, "interaction", "no_same_voice")}`)
              .setColor(client.color_main),
          ],
        });
    }

    if (command.lavalink && client.lavalinkUsing.length == 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(language, "interaction", "no_node")}`)
            .setColor(client.color_main),
        ],
      });
    }
    //////////////////////////////// Kiểm tra khả dụng kết thúc ////////////////////////////////

    //////////////////////////////// Kiểm tra quyền truy cập bắt đầu ////////////////////////////////
    const response = await axios.get(
      `https://discord.com/api/v10/applications/${client.user?.id}/entitlements`,
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
    /////////////////////////////// Check Premium Role start ////////////////////////////////
    const PremiumGuildID = client.config.PremiumRole.GuildID;
    const PremiumRoleID = client.config.PremiumRole.RoleID;
    const supportGuild = await client.guilds.fetch(PremiumGuildID).catch(() => null);
    const supportMember = supportGuild
      ? await supportGuild.members.fetch(String(interaction.user?.id)).catch(() => null)
      : null;
    const isPremiumRole = supportMember ? supportMember.roles.cache.has(PremiumRoleID) : false;
    /////////////////////////////// Check Premium Role end ////////////////////////////////
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

    const BlacklistUser = await client.db.BlacklistUser.get(interaction.user.id);
    if (BlacklistUser) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder().setColor(client.color_main).setDescription(
            `${client.i18n.get(language, "interaction", "blacklist_user", {
              user: interaction.user.displayName,
              serversupport: client.config.bot.SERVER_SUPPORT_URL,
            })}`
          ),
        ],
      });
    }

    const BlacklistGuild = await client.db.BlacklistGuild.get(interaction.guild.id);
    if (!isOwner && !isAdmin && BlacklistGuild) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder().setColor(client.color_main).setDescription(
            `${client.i18n.get(language, "interaction", "blacklist_guild", {
              user: interaction.user.displayName,
              guild: interaction.guild.name,
              serversupport: client.config.bot.SERVER_SUPPORT_URL,
            })}`
          ),
        ],
      });
    }

    if (!isOwner && !isAdmin) {
      const maintenanceData = await client.db.maintenance.all();
      for (const entry of maintenanceData) {
        if (entry.value === "true") {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle(`${client.i18n.get(language, "interaction", "maintenance_title")}`)
                .setColor(client.color_main)
                .setDescription(
                  `${client.i18n.get(language, "interaction", "maintenance_desc", {
                    bot: client.user!.username,
                    serversupport: client.config.bot.SERVER_SUPPORT_URL,
                  })}`
                ),
            ],
          });
        }
      }
    }

    if (command.accessableby.includes(Accessableby.Premium) && !userPerm.Premium) {
      const noPremiumUserEmbed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(language, "interaction", "no_premium_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "interaction", "no_premium_desc", {
            user: `${interaction.user}`,
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

      return interaction.reply({
        embeds: [noPremiumUserEmbed],
        components: PremiumCheckButton.components.length ? [PremiumCheckButton] : [],
      });
    }

    if (command.accessableby.includes(Accessableby.PremiumRole) && !userPerm.PremiumRole) {
      const noPremiumUserEmbed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(language, "interaction", "no_premium_role_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "interaction", "no_premium_role_desc", {
            user: `${interaction.user}`,
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

      return interaction.reply({
        embeds: [noPremiumUserEmbed],
        components: PremiumCheckButton.components.length ? [PremiumCheckButton] : [],
      });
    }

    if (command.accessableby.includes(Accessableby.Owner) && !userPerm.owner)
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(language, "interaction", "owner_only")}`)
            .setColor(client.color_main),
        ],
      });

    if (command.accessableby.includes(Accessableby.Admin) && !userPerm.admin)
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(language, "interaction", "no_admin_perms", {
                perm: "admin",
              })}`
            )
            .setColor(client.color_main),
        ],
      });

    if (command.accessableby.includes(Accessableby.UserPremium) && !userPerm.UserPremium) {
      const noPremiumUserEmbed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(language, "interaction", "no_user_premium_plan_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "interaction", "no_user_premium_plan_desc", {
            user: `${interaction.user}`,
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

      return interaction.reply({
        embeds: [noPremiumUserEmbed],
        components: PremiumCheckButton.components.length ? [PremiumCheckButton] : [],
      });
    }

    if (command.accessableby.includes(Accessableby.GuildPremium) && !userPerm.GuildPremium) {
      const noPremiumGuildEmbed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(language, "interaction", "no_guild_premium_plan_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "interaction", "no_guild_premium_plan_desc", {
            user: `${interaction.user}`,
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

      return interaction.reply({
        embeds: [noPremiumGuildEmbed],
        components: PremiumCheckButton.components.length ? [PremiumCheckButton] : [],
      });
    }

    if (client.topgg) {
      if (command.accessableby.includes(Accessableby.Voter)) {
        if (
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
              .setColor(client.color_main);
            return interaction.reply({
              content: " ",
              embeds: [embed],
            });
          }
          setTimeout(async () => {
            await interaction.deleteReply();
          }, client.config.features.DELETE_MSG_TIMEOUT);

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
            return interaction.reply({
              content: " ",
              embeds: [embed],
              components: VoteButton.components.length ? [VoteButton] : [],
            });
          }
        }
      }
    }

    if (command.accessableby.includes(Accessableby.PremiumStore) && !userPerm.PremiumStore) {
      const url = `https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`;
      const json = {
        type: 10,
        data: {},
      };
      return await fetch(url, {
        method: "POST",
        body: JSON.stringify(json),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    //////////////////////////////// Kiểm tra quyền truy cập kết thúc ////////////////////////////////

    try {
      const args: string[] = [];
      let attachments: Attachment | undefined;
      let subCommandGroupName: string;

      function argConvert(dataArray: readonly CommandInteractionOption<CacheType>[]) {
        for (const data of dataArray) {
          if (data.type === ApplicationCommandOptionType.Subcommand) {
            argConvert(data.options!);
          }
          if (data.type === ApplicationCommandOptionType.SubcommandGroup) {
            const subCommandGroupOptions = data.options?.find(
              (option) => option.name === subCommandGroupName
            )?.options;
            if (subCommandGroupOptions) {
              argConvert(subCommandGroupOptions);
            }
          }
          const check = new ConvertToMention().execute({
            type: data.type,
            value: String(data.value),
          });
          if (check !== "error") {
            args.push(check);
          } else if (data.type === ApplicationCommandOptionType.Attachment) {
            attachments = data.attachment;
          } else {
            if (data.value) args.push(String(data.value));
            if (data.options) {
              for (const optionData of data.options) {
                if (optionData.value) args.push(String(optionData.value));
              }
            }
          }
        }
      }

      argConvert(interaction.options.data);

      const handler = new CommandHandler({
        interaction: interaction as CommandInteraction,
        language: language,
        client: client,
        args: args,
        prefix: "/",
      });

      if (attachments) handler.attactments.push(attachments);

      logInfo(
        "Slash Commands",
        `${chalk.hex("#00D100").bold(commandNameArray.join("-"))} được sử dụng bởi ${chalk.hex(
          "#00D100"
        )(interaction.user.displayName)} (${chalk.hex("#00D100")(
          interaction.user.id
        )}) từ ${chalk.hex("#00D100")(interaction.guild.name)} (${chalk.hex("#00D100")(
          interaction.guild.id
        )})`
      );

      ////////// Thống kê Sử dụng Lệnh Người Dùng //////////
      let commandUsage = await client.db.CommandUserUsage.get(`${interaction.user.id}`);
      if (!commandUsage) {
        commandUsage = await client.db.CommandUserUsage.set(`${interaction.user.id}`, {
          userid: interaction.user.id,
          username: interaction.user.username,
          total: 1,
        });
      } else {
        commandUsage.total += 1;
        await client.db.CommandUserUsage.set(`${interaction.user.id}`, commandUsage);
      }
      ////////// Thống kê Sử dụng Lệnh Người Dùng //////////

      ////////// Thống kê Sử dụng Lệnh Toàn Cục //////////
      let globalCommandUsage = await client.db.CommandGlobalUsage.get("global");
      if (!globalCommandUsage) {
        globalCommandUsage = await client.db.CommandGlobalUsage.set("global", {
          total: 1,
        });
      } else {
        globalCommandUsage.total += 1;
        await client.db.CommandGlobalUsage.set("global", globalCommandUsage);
      }
      ////////// Thống kê Sử dụng Lệnh Toàn Cục //////////

      command.execute(client, handler);
    } catch (error) {
      logError("CommandManager", error);
      interaction.reply({
        content: `${client.i18n.get(language, "interaction", "unexpected_error")}\n ${error}`,
      });
    }
  }
}
