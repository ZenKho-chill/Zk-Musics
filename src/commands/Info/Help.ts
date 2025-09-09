import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { stripIndents } from "common-tags";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { EmojiValidator } from "../../utilities/EmojiValidator.js";
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
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.SilentDeferReply();

    if (handler.args[0]) {
      const embed = new EmbedBuilder()
        .setThumbnail(client.user!.displayAvatarURL({ size: 2048 }))
        .setColor(client.color_main);

      let command = client.commands.get(
        client.aliases.get(handler.args[0].toLowerCase()) ||
          handler.args[0].toLowerCase()
      );
      if (!command)
        return handler.editReply({
          embeds: [
            embed
              .setTitle(
                `${client.i18n.get(
                  handler.language,
                  "commands.info",
                  "finder_invalid"
                )}`
              )
              .setDescription(
                `${client.i18n.get(
                  handler.language,
                  "commands.info",
                  "finder_example",
                  {
                    command: `${handler.prefix}${this.name[0]}`,
                  }
                )}`
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
              handler.interaction
                ? command.name.join(" ")
                : command.name.join("-")
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
      .setTitle(
        `${client.i18n.get(
          handler.language,
          "commands.info",
          "homepage_title"
        )}`
      )
      .setImage(client.config.bot.IMAGES_URL_HELPMENU)
      .setColor(client.color_main)
      .setDescription(
        `${client.i18n.get(handler.language, "commands.info", "homepage_desc", {
          premium: client.config.bot.PREMIUM_URL,
          bot: client.user!.username,
        })}`
      );

    const ButtonHome = new ActionRowBuilder<ButtonBuilder>();
    if (
      client.config.bot.WEBSITE_URL &&
      client.config.MENU_HELP_EMOJI.E_WEBSITE
    ) {
      ButtonHome.addComponents(
        new ButtonBuilder()
          .setLabel("Trang web")
          .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_WEBSITE))
          .setStyle(ButtonStyle.Link)
          .setURL(client.config.bot.WEBSITE_URL)
      );
    }
    if (
      client.config.bot.SERVER_SUPPORT_URL &&
      client.config.MENU_HELP_EMOJI.E_SUPPORT
    ) {
      ButtonHome.addComponents(
        new ButtonBuilder()
          .setLabel("Hỗ trợ")
          .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_SUPPORT))
          .setStyle(ButtonStyle.Link)
          .setURL(client.config.bot.SERVER_SUPPORT_URL)
      );
    }
    if (
      client.config.bot.PREMIUM_URL &&
      client.config.MENU_HELP_EMOJI.E_PREMIUM
    ) {
      ButtonHome.addComponents(
        new ButtonBuilder()
          .setLabel("Nhận Premium")
          .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM))
          .setStyle(ButtonStyle.Link)
          .setURL(client.config.bot.PREMIUM_URL)
      );
    }

    const selectmenu =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
        new StringSelectMenuBuilder()
          .setCustomId("help-category")
          .setPlaceholder(
            `${client.i18n.get(
              handler.language,
              "commands.info",
              "select_menu"
            )}`
          )
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
              .setLabel("Bộ lọc")
              .setValue("Filter")
              .setEmoji(EmojiValidator.safeEmoji(client.config.MENU_HELP_EMOJI.E_FILTER, "❓")),
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
        components: [
          selectmenu,
          ...(ButtonHome.components.length ? [ButtonHome] : []),
        ],
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
                    (handler.message &&
                      i.user.id == handler.message.author.id))) ||
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
                      `${client.i18n.get(
                        handler.language,
                        "commands.info",
                        "homepage_title"
                      )}`
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

                  for (const [category, commands] of Object.entries(
                    categoriesAndCommands
                  )) {
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
                    components: [
                      selectmenu,
                      ...(ButtonHome.components.length ? [ButtonHome] : []),
                    ],
                  });
                } else {
                  const filteredCommands = client.commands.filter(
                    (c) => c.category === directory
                  );
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
                  components: [
                    selectmenu,
                    ...(ButtonHome.components.length ? [ButtonHome] : []),
                  ],
                });
              }
            } catch (error) {
              client.logger.error("Help Command", `Collector error: ${error}`);
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
      name: `${client.i18n.get(
        handler.language,
        "commands.info",
        "finder_name"
      )}`,
      des: `${client.i18n.get(
        handler.language,
        "commands.info",
        "finder_des"
      )}`,
      usage: `${client.i18n.get(
        handler.language,
        "commands.info",
        "finder_usage"
      )}`,
      access: `${client.i18n.get(
        handler.language,
        "commands.info",
        "finder_access"
      )}`,
      aliases: `${client.i18n.get(
        handler.language,
        "commands.info",
        "finder_aliases"
      )}`,
      slash: `${client.i18n.get(
        handler.language,
        "commands.info",
        "finder_slash"
      )}`,
      desNone: `${client.i18n.get(
        handler.language,
        "commands.info",
        "finder_des_no"
      )}`,
      usageNone: `${client.i18n.get(
        handler.language,
        "commands.info",
        "finder_usage_no"
      )}`,
      aliasesPrefix: `${client.i18n.get(
        handler.language,
        "commands.info",
        "finder_aliases_prefix"
      )}`,
      aliasesNone: `${client.i18n.get(
        handler.language,
        "commands.info",
        "finder_aliases_no"
      )}`,
      slashEnable: `${client.i18n.get(
        handler.language,
        "commands.info",
        "finder_slash_enable"
      )}`,
      slashDisable: `${client.i18n.get(
        handler.language,
        "commands.info",
        "finder_slash_disable"
      )}`,
    };
  }
}
