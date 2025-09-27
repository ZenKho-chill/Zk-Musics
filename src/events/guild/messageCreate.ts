import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Message,
  PermissionFlagsBits,
} from "discord.js";
import { Manager } from "../../manager.js";
import { EmbedBuilder } from "discord.js";
import {
  CheckPermissionResultInterface,
  CheckPermServices,
} from "../../services/CheckPermServices.js";
import chalk from "chalk";
import axios from "axios";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Accessableby } from "../../structures/Command.js";
import { RateLimitResponder } from "../../services/RateLimitResponder.js";
import { RateLimitManager } from "@sapphire/ratelimits";
import { TopggServiceEnum } from "../../services/TopggService.js";
import { Mode247Builder } from "../../services/Mode247Builder.js";
import { logWarn, logInfo, logError } from "../../utilities/Logger.js";
const commandRateLimitManager = new RateLimitManager(1000);

export default class {
  async execute(client: Manager, message: Message) {
    if (message.author.bot || message.channel.type == ChannelType.DM) return;

    if (!client.isDatabaseConnected)
      return logWarn(
        "DatabaseService",
        "Cơ sở dữ liệu chưa kết nối nên sự kiện này tạm thời sẽ không chạy. Vui lòng thử lại sau!"
      );

    let guildModel = await client.db.language.get(`${message.guild!.id}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(`${message.guild!.id}`, client.config.bot.LANGUAGE);
    }

    const language = guildModel;

    let PREFIX = client.prefix;

    const mention = new RegExp(`^<@!?${client.user!.id}>( |)$`);

    const GuildPrefix = await client.db.prefix.get(`${message.guild!.id}`);
    if (GuildPrefix) PREFIX = GuildPrefix;
    else if (!GuildPrefix)
      PREFIX = String(await client.db.prefix.set(`${message.guild!.id}`, client.prefix));

    if (message.content.match(mention)) {
      const MentionButton = new ActionRowBuilder<ButtonBuilder>();
      if (client.config.bot.PREMIUM_URL) {
        MentionButton.addComponents(
          new ButtonBuilder()
            .setLabel("Nhận Premium")
            .setStyle(ButtonStyle.Link)
            .setURL(client.config.bot.PREMIUM_URL)
        );
      }

      await message.reply({
        content: client.i18n.get(language, "server.handlers", "mention_content", {
          user: message.author.displayName,
          bots: client.user!.username,
          prefix: PREFIX,
          bot: `<@${client.user!.id}>`,
          support: client.config.bot.SERVER_SUPPORT_URL,
          website: client.config.bot.WEBSITE_URL,
          votelink: client.config.bot.VOTE_URL,
          premium: client.config.bot.PREMIUM_URL,
        }),
        embeds: [],
        components: MentionButton.components.length ? [MentionButton] : [],
      });
    }
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefixRegex = new RegExp(`^(<@!?${client.user!.id}>|${escapeRegex(PREFIX)})\\s*`);
    if (!prefixRegex.test(message.content)) return;
    const [matchedPrefix] = message.content.match(prefixRegex) as RegExpMatchArray;
    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/g);
    const cmd = args.shift()!.toLowerCase();

    const command =
      client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd) as string);
    if (!command) return;

    const setup = await client.db.setup.get(String(message.guildId));

    if (setup && setup.channel == message.channelId) return;

    //////////////////////////////// Kiểm tra giới hạn tốc độ bắt đầu ////////////////////////////////
    const ratelimit = commandRateLimitManager.acquire(
      `${message.author.id}@${command.name.join("-")}`
    );

    if (ratelimit.limited) {
      new RateLimitResponder({
        client: client,
        language: language,
        message: message,
        time: Number(((ratelimit.expires - Date.now()) / 1000).toFixed(1)),
      }).reply();
      return;
    }

    ratelimit.consume();
    //////////////////////////////// Kiểm tra giới hạn tốc độ kết thúc ////////////////////////////////

    //////////////////////////////// Kiểm tra quyền bắt đầu ////////////////////////////////
    const permissionChecker = new CheckPermServices();

    // Quyền mặc định
    const defaultPermissions = [
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.ReadMessageHistory,
    ];
    const allCommandPermissions = [PermissionFlagsBits.ManageMessages];
    const musicPermissions = [PermissionFlagsBits.Speak, PermissionFlagsBits.Connect];
    const managePermissions = [PermissionFlagsBits.ManageChannels];

    async function respondError(permissionResult: CheckPermissionResultInterface) {
      const selfErrorString = `${client.i18n.get(language, "server.handlers", "no_perms", {
        perm: permissionResult.result,
      })}`;
      const embed = new EmbedBuilder()
        .setDescription(
          permissionResult.channel == "Self"
            ? selfErrorString
            : `${client.i18n.get(language, "server.handlers", "no_perms_channel", {
                perm: permissionResult.result,
                channel: permissionResult.channel,
              })}`
        )
        .setColor(client.color_main);
      const dmChannel =
        message.author.dmChannel == null
          ? await message.author.createDM()
          : message.author.dmChannel;
      dmChannel.send({
        embeds: [embed],
      });
    }

    const returnData = await permissionChecker.message(message, defaultPermissions);
    if (returnData.result !== "PermissionPass") return respondError(returnData);

    if (command.accessableby.includes(Accessableby.Manager)) {
      const returnData = await permissionChecker.message(message, managePermissions);
      if (returnData.result !== "PermissionPass") return respondError(returnData);
    } else if (command.category == "Music") {
      const returnData = await permissionChecker.message(message, musicPermissions);
      if (returnData.result !== "PermissionPass") return respondError(returnData);
    } else if (command.name.join("-") !== "help") {
      const returnData = await permissionChecker.message(message, allCommandPermissions);
      if (returnData.result !== "PermissionPass") return respondError(returnData);
    } else if (command.permissions.length !== 0) {
      const returnData = await permissionChecker.message(message, command.permissions);
      if (returnData.result !== "PermissionPass") return respondError(returnData);
    }
    //////////////////////////////// Kiểm tra quyền kết thúc ////////////////////////////////

    //////////////////////////////// Kiểm tra khả dụng bắt đầu ////////////////////////////////
    if (command.lavalink && client.lavalinkUsing.length == 0) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(language, "server.handlers", "no_node")}`)
            .setColor(client.color_main),
        ],
      });
    }

    if (command.playerCheck) {
      const player = client.Zklink.players.get(message.guild!.id);
      const twentyFourBuilder = new Mode247Builder(client);
      const is247 = await twentyFourBuilder.get(message.guild!.id);
      if (
        !player ||
        (is247 && is247.twentyfourseven && player.queue.length == 0 && !player.queue.current)
      )
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${client.i18n.get(language, "server.handlers", "no_player")}`)
              .setColor(client.color_main),
          ],
        });
    }

    if (command.sameVoiceCheck) {
      const { channel } = message.member!.voice;
      if (!channel || message.member!.voice.channel !== message.guild!.members.me!.voice.channel)
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${client.i18n.get(language, "server.handlers", "no_same_voice")}`)
              .setColor(client.color_main),
          ],
        });
    }

    if (
      command.accessableby.includes(Accessableby.Manager) &&
      !message.member!.permissions.has(PermissionFlagsBits.ManageGuild)
    )
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(language, "server.handlers", "no_manage_guild_perms", {
                perm: "ManageGuild",
              })}`
            )
            .setColor(client.color_main),
        ],
      });
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
      if (data.guild_id === message.guild.id) {
        PremiumStore = true;
      }
    });
    /////////////////////////////// Check Premium Role start ////////////////////////////////
    const PremiumGuildID = client.config.PremiumRole.GuildID;
    const PremiumRoleID = client.config.PremiumRole.RoleID;
    const supportGuild = await client.guilds.fetch(PremiumGuildID).catch(() => null);
    const supportMember = supportGuild
      ? await supportGuild.members.fetch(String(message.author?.id)).catch(() => null)
      : null;
    const isPremiumRole = supportMember ? supportMember.roles.cache.has(PremiumRoleID) : false;
    /////////////////////////////// Check Premium Role end ////////////////////////////////
    const User = await client.db.premium.get(message.author.id);
    const Guild = await client.db.preGuild.get(String(message.guild?.id));
    const isPremiumUser = User && User.isPremium;
    const isPremiumGuild = Guild && Guild.isPremium;
    const isOwner = message.author.id == client.owner;
    const isAdmin = client.config.bot.ADMIN.includes(message.author.id);
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

    const BlacklistUser = await client.db.BlacklistUser.get(message.author.id);
    if (BlacklistUser) {
      return message.reply({
        embeds: [
          new EmbedBuilder().setColor(client.color_main).setDescription(
            `${client.i18n.get(language, "server.handlers", "blacklist_user", {
              user: message.author.displayName,
              serversupport: client.config.bot.SERVER_SUPPORT_URL,
            })}`
          ),
        ],
      });
    }

    const BlacklistGuild = await client.db.BlacklistGuild.get(message.guild!.id);
    if (!isOwner && !isAdmin && BlacklistGuild) {
      return message.reply({
        embeds: [
          new EmbedBuilder().setColor(client.color_main).setDescription(
            `${client.i18n.get(language, "server.handlers", "blacklist_guild", {
              user: message.author.displayName,
              guild: message.guild!.name,
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
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle(`${client.i18n.get(language, "server.handlers", "maintenance_title")}`)
                .setColor(client.color_main)
                .setDescription(
                  `${client.i18n.get(language, "server.handlers", "maintenance_desc", {
                    bot: client.user!.username,
                    serversupport: client.config.bot.SERVER_SUPPORT_URL,
                  })}`
                ),
            ],
          });
        }
      }
    }

    if (command.accessableby.includes(Accessableby.Owner) && !userPerm.owner)
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(language, "server.handlers", "owner_only")}`)
            .setColor(client.color_main),
        ],
      });

    if (command.accessableby.includes(Accessableby.Admin) && !userPerm.admin)
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(language, "server.handlers", "no_admin_perms", {
                perm: "admin",
              })}`
            )
            .setColor(client.color_main),
        ],
      });

    if (command.accessableby.includes(Accessableby.Premium) && !userPerm.Premium) {
      const noPremiumEmbed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(language, "server.handlers", "no_premium_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "server.handlers", "no_premium_desc", {
            user: `<@${message.author.id}>`,
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
        embeds: [noPremiumEmbed],
        components: PremiumCheckButton.components.length ? [PremiumCheckButton] : [],
      });
    }

    if (command.accessableby.includes(Accessableby.PremiumRole) && !userPerm.PremiumRole) {
      const noPremiumRoleEmbed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(language, "server.handlers", "no_premium_role_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "server.handlers", "no_premium_role_desc", {
            user: `<@${message.author.id}>`,
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
        embeds: [noPremiumRoleEmbed],
        components: PremiumCheckButton.components.length ? [PremiumCheckButton] : [],
      });
    }

    if (command.accessableby.includes(Accessableby.UserPremium) && !userPerm.UserPremium) {
      const noPremiumUserEmbed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(language, "server.handlers", "no_user_premium_plan_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "server.handlers", "no_user_premium_plan_desc", {
            user: `<@${message.author.id}>`,
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
        embeds: [noPremiumUserEmbed],
        components: PremiumCheckButton.components.length ? [PremiumCheckButton] : [],
      });
    }

    if (command.accessableby.includes(Accessableby.GuildPremium) && !userPerm.GuildPremium) {
      const noPremiumGuildEmbed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(language, "server.handlers", "no_guild_premium_plan_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "server.handlers", "no_guild_premium_plan_desc", {
            user: `<@${message.author.id}>`,
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
        embeds: [noPremiumGuildEmbed],
        components: PremiumCheckButton.components.length ? [PremiumCheckButton] : [],
      });
    }

    // const isNotPassAll = Object.values(userPerm).some((data) => data === false);
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
          const voteChecker = await client.topgg.checkVote(message.author.id);
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
            const sentMessage = await message.reply({
              content: " ",
              embeds: [embed],
            });
            setTimeout(async () => {
              try {
                await sentMessage.delete();
              } catch (error) {
                logError("TopggService", `Top gg service error`);
              }
            }, client.config.features.DELETE_MSG_TIMEOUT);
          }

          if (voteChecker == TopggServiceEnum.UNVOTED) {
            const embed = new EmbedBuilder()
              .setAuthor({
                name: client.i18n.get(language, "server.handlers", "topgg_unvote_author"),
              })
              .setDescription(
                client.i18n.get(language, "server.handlers", "topgg_unvote_desc", {
                  user: `<@${message.author.id}>`,
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
            });
          }
        }
      }
    }

    if (command.accessableby.includes(Accessableby.PremiumStore) && !userPerm.PremiumStore) {
      const noPremiumGuildEmbed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(language, "server.handlers", "no_premium_author"),
        })
        .setDescription(
          `${client.i18n.get(language, "server.handlers", "no_premium_desc", {
            user: `<@${message.author.id}>`,
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
        embeds: [noPremiumGuildEmbed],
        components: PremiumCheckButton.components.length ? [PremiumCheckButton] : [],
      });
    }
    //////////////////////////////// Kiểm tra quyền truy cập kết thúc ////////////////////////////////

    try {
      const handler = new CommandHandler({
        message: message,
        language: language,
        client: client,
        args: args,
        prefix: PREFIX || client.prefix || "me",
      });

      if (message.attachments.size !== 0) handler.addAttachment(message.attachments);

      logInfo(
        "Prefix Commands",
        `${chalk.hex("#00FFC3")(command.name.join("-"))} được sử dụng bởi ${chalk.hex("#00FFC3")(
          message.author.displayName
        )} (${chalk.hex("#00FFC3")(message.author.id)}) từ ${chalk.hex("#00FFC3")(
          message.guild?.name
        )} (${chalk.hex("#00FFC3")(message.guild?.id)})`
      );

      ////////// Thống kê Sử dụng Lệnh Người Dùng //////////
      let commandUsage = await client.db.CommandUserUsage.get(`${message.author.id}`);
      if (!commandUsage) {
        commandUsage = await client.db.CommandUserUsage.set(`${message.author.id}`, {
          userid: message.author.id,
          username: message.author.username,
          total: 1,
        });
      } else {
        commandUsage.total += 1;
        await client.db.CommandUserUsage.set(`${message.author.id}`, commandUsage);
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
      message.reply({
        content: `${client.i18n.get(language, "server.handlers", "unexpected_error")}\n ${error}`,
      });
    }
  }
}
