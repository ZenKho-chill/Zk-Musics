import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  AutocompleteInteraction,
} from "discord.js";
import { stripIndents } from "common-tags";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Manager } from "../../manager.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Config } from "../../@types/Config.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { ConfigData } from "../../services/ConfigData.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { EmojiValidator } from "../../utilities/EmojiValidator.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { AutocompleteInteractionChoices, GlobalInteraction } from "../../@types/Interaction.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["help"];
  public description = "Hiển thị tất cả lệnh mà bot có.";
  public category = "Info";
  public accessableby = data.COMMANDS_ACCESS.INFO.Help;
  public usage = "<tên_lệnh>";
  public aliases = ["h"];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "command",
      description: "Tên lệnh",
      type: ApplicationCommandOptionType.String,
      required: false,
      autocomplete: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.SilentDeferReply();

    if (handler.args[0]) {
      const embed = new EmbedBuilder()
        .setThumbnail(client.user!.displayAvatarURL({ size: 2048 }))
        .setColor(client.color_main);

      let command = client.commands.get(
        client.aliases.get(handler.args[0].toLowerCase()) || handler.args[0].toLowerCase()
      );
      if (!command)
        return handler.editReply({
          embeds: [
            embed
              .setTitle(`${client.i18n.get(handler.language, "commands.info", "finder_invalid")}`)
              .setDescription(
                `${client.i18n.get(handler.language, "commands.info", "finder_example", {
                  command: `${handler.prefix}${this.name[0]}`,
                })}`
              ),
          ],
        });

      const eString = this.transalatedFinder(client, handler);

      embed.setDescription(stripIndents`
        ${eString.name} \`${command.name.join("-")}\`
        ${eString.des} \`${command.description || eString.desNone}\`
        ${eString.usage} ${
          command.usage
            ? `\`${handler.prefix}${
                handler.interaction ? command.name.join(" ") : command.name.join("-")
              } ${command.usage}\``
            : `\`${eString.usageNone}\``
        }
        ${eString.access} \`${command.accessableby}\`
        ${eString.aliases} \`${
          command.aliases && command.aliases.length !== 0
            ? command.aliases.join(", ") + eString.aliasesPrefix
            : eString.aliasesNone
        }\`
        ${eString.slash} \`${
          command.usingInteraction ? eString.slashEnable : eString.slashDisable
        }\`
        `);

      return handler.editReply({ embeds: [embed] });
    }

    const EmbedHome = new EmbedBuilder()
      .setAuthor({
        name: `${client.user!.username} — Menu Trợ giúp ♪`,
        iconURL: client.user!.displayAvatarURL(),
        url: `https://discord.com/oauth2/authorize?client_id=${
          client.user!.id
        }&permissions=8&scope=bot`,
      })
      .setTitle(`${client.i18n.get(handler.language, "commands.info", "homepage_title")}`)
      .setImage(client.config.bot.IMAGES_URL_HELPMENU)
      .setColor(client.color_main)
      .setDescription(
        `${client.i18n.get(handler.language, "commands.info", "homepage_desc", {
          premium: client.config.bot.PREMIUM_URL,
          bot: client.user!.username,
        })}`
      );

    const ButtonHome = new ActionRowBuilder<ButtonBuilder>();
    if (client.config.bot.WEBSITE_URL && client.config.MENU_HELP_EMOJI.E_WEBSITE) {
      ButtonHome.addComponents(
        new ButtonBuilder()
          .setLabel("Trang web")
          .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_WEBSITE))
          .setStyle(ButtonStyle.Link)
          .setURL(client.config.bot.WEBSITE_URL)
      );
    }
    if (client.config.bot.SERVER_SUPPORT_URL && client.config.MENU_HELP_EMOJI.E_SUPPORT) {
      ButtonHome.addComponents(
        new ButtonBuilder()
          .setLabel("Hỗ trợ")
          .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_SUPPORT))
          .setStyle(ButtonStyle.Link)
          .setURL(client.config.bot.SERVER_SUPPORT_URL)
      );
    }
    if (client.config.bot.PREMIUM_URL && client.config.MENU_HELP_EMOJI.E_PREMIUM) {
      ButtonHome.addComponents(
        new ButtonBuilder()
          .setLabel("Nhận Premium")
          .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM))
          .setStyle(ButtonStyle.Link)
          .setURL(client.config.bot.PREMIUM_URL)
      );
    }

    const selectmenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
      new StringSelectMenuBuilder()
        .setCustomId("help-category")
        .setPlaceholder(`${client.i18n.get(handler.language, "commands.info", "select_menu")}`)
        .setMaxValues(1)
        .setMinValues(1)
        .setOptions([
          new StringSelectMenuOptionBuilder()
            .setLabel("Trang chủ")
            .setValue("Home")
            .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_HOME, "❓")),
          new StringSelectMenuOptionBuilder()
            .setLabel("Thông tin")
            .setValue("Info")
            .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_INFO, "❓")),
          new StringSelectMenuOptionBuilder()
            .setLabel("Nhạc")
            .setValue("Music")
            .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_MUSIC, "❓")),
          new StringSelectMenuOptionBuilder()
            .setLabel("Danh sách phát")
            .setValue("Playlist")
            .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_PLAYLIST, "❓")),
          new StringSelectMenuOptionBuilder()
            .setLabel("Tiện ích")
            .setValue("Utils")
            .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_UTILS, "❓")),
          new StringSelectMenuOptionBuilder()
            .setLabel("Cài đặt")
            .setValue("Settings")
            .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_SETTING, "❓")),
          new StringSelectMenuOptionBuilder()
            .setLabel("Quản trị")
            .setValue("Admin")
            .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_ADMIN, "❓")),
          new StringSelectMenuOptionBuilder()
            .setLabel("Tất cả lệnh")
            .setValue("All")
            .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_ALLCMD, "❓")),
        ]),
    ]);
    await handler
      .editReply({
        embeds: [EmbedHome],
        components: [selectmenu, ...(ButtonHome.components.length ? [ButtonHome] : [])],
      })
      .then(async (msg) => {
        if (msg) {
          let collector = await msg.createMessageComponentCollector({
            filter: async (i) => {
              return (
                (i.isStringSelectMenu() &&
                  i.user &&
                  i.message.author.id == client.user!.id &&
                  (i.user.id == handler.interaction?.user.id ||
                    (handler.message && i.user.id == handler.message.author.id))) ||
                false
              );
            },
            time: 60000,
          });

          collector.on("collect", async (m) => {
            if (m.isStringSelectMenu()) {
              if (m.customId === "help-category") {
                await m.deferUpdate();
                let [directory] = m.values;

                if (directory === "All") {
                  const categoriesAndCommands = client.commands.reduce(
                    (accumulator, command) => {
                      if (!accumulator[command.category]) {
                        accumulator[command.category] = [];
                      }
                      accumulator[command.category].push(`\`${command.name}\``);
                      return accumulator;
                    },
                    {} as { [key: string]: string[] }
                  );

                  const EmbedAllCommands = new EmbedBuilder()
                    .setAuthor({
                      name: `${client.user!.username} — Menu Trợ giúp ♪`,
                      iconURL: client.user!.displayAvatarURL(),
                      url: `https://discord.com/oauth2/authorize?client_id=${
                        client.user!.id
                      }&permissions=8&scope=bot`,
                    })
                    .setTitle(
                      `${client.i18n.get(handler.language, "commands.info", "homepage_title")}`
                    )
                    .setImage(client.config.bot.IMAGES_URL_COMMAND)
                    .setDescription(`Tiền tố bot: \`${client.prefix} hoặc /\``)
                    .setColor(client.color_main)
                    .setFooter({
                      text: `${client.user?.displayName} ${client.i18n.get(
                        handler.language,
                        "commands.info",
                        "footer"
                      )} | Total Commands: ${client.commands.size}`,
                    });

                  for (const [category, commands] of Object.entries(categoriesAndCommands)) {
                    const commandList = commands
                      .map((c) => `\`${c.split(",").join("-")}\``)
                      .join(", ");
                    EmbedAllCommands.addFields({
                      name: `${
                        client.config.MENU_HELP_EMOJI.E_ALLCATEGORIES
                      } ${category.toUpperCase()}`,
                      value: commandList,
                      inline: false,
                    });
                  }

                  msg.edit({ embeds: [EmbedAllCommands] });
                } else if (directory === "Home") {
                  msg.edit({
                    embeds: [EmbedHome],
                    components: [selectmenu, ...(ButtonHome.components.length ? [ButtonHome] : [])],
                  });
                } else {
                  const filteredCommands = client.commands.filter((c) => c.category === directory);
                  const EmbedSingleCommands = new EmbedBuilder()
                    .setAuthor({
                      name: `${client.user!.username} — Menu Trợ giúp ♪`,
                      iconURL: client.user!.displayAvatarURL(),
                      url: `https://discord.com/oauth2/authorize?client_id=${
                        client.user!.id
                      }&permissions=8&scope=bot`,
                    })
                    // .setThumbnail(client.user!.displayAvatarURL({ size: 2048 }))
                    .setImage(client.config.bot.IMAGES_URL_COMMAND)
                    .setTitle(
                      `${
                        client.config.MENU_HELP_EMOJI.E_ALLCATEGORIES
                      } ${directory.toUpperCase()} LỆNH`
                    )
                    .setColor(client.color_main)
                    .setFooter({
                      text: `${client.i18n.get(
                        handler.language,
                        "commands.info",
                        "footer"
                      )} | Total Commands: ${client.commands.size}`,
                    });

                  if (filteredCommands.size > 0) {
                    const commandList = filteredCommands
                      .map(
                        (c) =>
                          `**[${c.name.join("-")}](${
                            client.config.bot.COMMANDS_URL
                          })** : **${c.description}**`
                      )
                      .join("\n");
                    EmbedSingleCommands.setDescription(`${commandList}`);
                  } else {
                    EmbedSingleCommands.setDescription(
                      `${
                        client.config.MENU_HELP_EMOJI.E_ALLCATEGORIES
                      }  ${directory.toUpperCase()} [0]\nKhông tìm thấy lệnh.`
                    );
                  }
                  msg.edit({ embeds: [EmbedSingleCommands] });
                }
              }
            }
          });

          collector.on("end", async (collected, reason) => {
            try {
              if (reason === "time") {
                const timedMessage = `${client.i18n.get(
                  handler.language,
                  "commands.info",
                  "help_timeout",
                  {
                    prefix: client.prefix,
                  }
                )}`;
                selectmenu.components[0].setDisabled(true);

                await handler.editReply({
                  content: timedMessage,
                  embeds: [EmbedHome],
                  components: [selectmenu, ...(ButtonHome.components.length ? [ButtonHome] : [])],
                });
              }
            } catch (error) {
              logError("Help Command", `Collector error: ${error}`);
            } finally {
              // Đảm bảo collector được cleanup
              collector.removeAllListeners();
              collector.stop();
            }
          });
        }
      });
  }

  private transalatedFinder(client: Manager, handler: CommandHandler) {
    return {
      name: `${client.i18n.get(handler.language, "commands.info", "finder_name")}`,
      des: `${client.i18n.get(handler.language, "commands.info", "finder_des")}`,
      usage: `${client.i18n.get(handler.language, "commands.info", "finder_usage")}`,
      access: `${client.i18n.get(handler.language, "commands.info", "finder_access")}`,
      aliases: `${client.i18n.get(handler.language, "commands.info", "finder_aliases")}`,
      slash: `${client.i18n.get(handler.language, "commands.info", "finder_slash")}`,
      desNone: `${client.i18n.get(handler.language, "commands.info", "finder_des_no")}`,
      usageNone: `${client.i18n.get(handler.language, "commands.info", "finder_usage_no")}`,
      aliasesPrefix: `${client.i18n.get(
        handler.language,
        "commands.info",
        "finder_aliases_prefix"
      )}`,
      aliasesNone: `${client.i18n.get(handler.language, "commands.info", "finder_aliases_no")}`,
      slashEnable: `${client.i18n.get(handler.language, "commands.info", "finder_slash_enable")}`,
      slashDisable: `${client.i18n.get(handler.language, "commands.info", "finder_slash_disable")}`,
    };
  }

  // Hàm autocomplete cho tìm kiếm lệnh theo từ khóa
  async autocomplete(client: Manager, interaction: GlobalInteraction, language: string) {
    let choice: AutocompleteInteractionChoices[] = [];
    const input = String((interaction as any).options.get("command")?.value || "");

    // Lấy tất cả commands
    const allCommands = Array.from(client.commands.values());

    // Nếu không có input, hiển thị một số lệnh phổ biến
    if (!input.trim()) {
      const popularCommands = allCommands
        .filter(cmd => ["play", "pause", "skip", "stop", "queue", "help", "info"].includes(cmd.name[0]))
        .slice(0, 10);
      
      for (const cmd of popularCommands) {
        choice.push({
          name: `${this.getCategoryIcon(cmd.category)} ${cmd.name[0]} - ${cmd.description}`,
          value: cmd.name[0]
        });
      }
    } else {
      // Tách từ khóa tìm kiếm
      const searchKeywords = input.toLowerCase().split(/\s+/).filter(keyword => keyword.length > 0);
      
      // Xử lý trường hợp đặc biệt cho "pl"
      if (input.toLowerCase().trim() === "pl") {
        // 1. Tìm lệnh play có alias "pl"
        const playCommand = allCommands.find(cmd => 
          cmd.aliases && cmd.aliases.includes("pl") && cmd.name[0] === "play"
        );
        if (playCommand) {
          choice.push({
            name: `🎵 pl (play) - ${playCommand.description}`,
            value: "pl"
          });
        }
        
        // 2. Tìm tất cả lệnh playlist có format ["pl", "subcommand"]
        const playlistCommands = allCommands.filter(cmd => 
          cmd.name.length >= 2 && cmd.name[0] === "pl"
        );
        
        for (const cmd of playlistCommands) {
          const subCommand = cmd.name[1];
          const displayName = `pl ${subCommand}`;
          choice.push({
            name: `📝 ${displayName} - ${cmd.description}`,
            value: cmd.name.join("-") // Sử dụng format pl-add thay vì pl add
          });
        }
      } else {
        // Tìm kiếm theo từ khóa với hệ thống scoring
        const commandScores = allCommands.map(cmd => {
          let score = 0;
          const searchableText = [
            ...cmd.name,
            ...(cmd.aliases || []),
            cmd.description || "",
            cmd.category || ""
          ].join(" ").toLowerCase();

          // Tính điểm cho từng từ khóa
          for (const keyword of searchKeywords) {
            // Từ khóa xuất hiện trong tên lệnh (điểm cao nhất)
            if (cmd.name.some(name => name.toLowerCase().includes(keyword))) {
              score += 100;
            }
            
            // Từ khóa xuất hiện trong aliases
            if (cmd.aliases && cmd.aliases.some(alias => alias.toLowerCase().includes(keyword))) {
              score += 80;
            }
            
            // Từ khóa xuất hiện trong description
            if (cmd.description && cmd.description.toLowerCase().includes(keyword)) {
              score += 60;
            }
            
            // Từ khóa xuất hiện trong category
            if (cmd.category && cmd.category.toLowerCase().includes(keyword)) {
              score += 40;
            }
            
            // Bonus điểm cho exact match
            if (cmd.name.some(name => name.toLowerCase() === keyword)) {
              score += 50;
            }
            
            // Bonus điểm cho match với aliases
            if (cmd.aliases && cmd.aliases.some(alias => alias.toLowerCase() === keyword)) {
              score += 30;
            }
          }
          
          // Bonus điểm nếu tất cả từ khóa đều có trong searchableText
          const allKeywordsFound = searchKeywords.every(keyword => 
            searchableText.includes(keyword)
          );
          if (allKeywordsFound && searchKeywords.length > 1) {
            score += 20;
          }

          return { command: cmd, score };
        });

        // Lọc và sắp xếp theo điểm
        const filteredCommands = commandScores
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 25);

        // Tạo choices
        for (const { command: cmd } of filteredCommands) {
          const categoryIcon = this.getCategoryIcon(cmd.category);
          
          // Xác định display name và return value
          let returnValue: string;
          let displayName: string;
          
          if (cmd.name.length > 1) {
            returnValue = cmd.name.join("-"); // Sử dụng format pl-add
            displayName = cmd.name.join(" "); // Hiển thị pl add
          } else {
            const primaryName = cmd.name[0];
            returnValue = primaryName;
            displayName = primaryName;
            
            // Kiểm tra nếu có alias match với từ khóa
            if (cmd.aliases) {
              const matchingAlias = cmd.aliases.find(alias => 
                searchKeywords.some(keyword => alias.toLowerCase().includes(keyword))
              );
              if (matchingAlias) {
                displayName = `${matchingAlias} (${primaryName})`;
                
                // Nếu alias match exact với input, ưu tiên alias làm return value
                if (cmd.aliases.some(alias => alias.toLowerCase() === input.toLowerCase())) {
                  returnValue = matchingAlias;
                }
              }
            }
          }
          
          choice.push({
            name: `${categoryIcon} ${displayName} - ${cmd.description}`,
            value: returnValue
          });
        }
      }
      
      // Nếu không tìm thấy gì, hiển thị thông báo
      if (choice.length === 0) {
        choice.push({
          name: `❌ Không tìm thấy lệnh cho "${input}"`,
          value: "help"
        });
      }
    }

    await (interaction as AutocompleteInteraction).respond(choice).catch(() => {});
  }

  // Helper function để lấy icon cho từng category
  private getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      "Music": "🎵",
      "Playlist": "📝", 
      "Info": "ℹ️",
      "Settings": "⚙️",
      "Utils": "🔧",
      "Admin": "👑",
      "default": "📋"
    };
    
    return iconMap[category] || iconMap["default"];
  }
}
