import { Manager } from "../../manager.js";
import {
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  Interaction,
  ButtonInteraction,
  MessageFlags,
} from "discord.js";
import chalk from "chalk";

export class Helper {
  client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }
  async execute() {
    this.client.on("interactionCreate", async (interaction: Interaction): Promise<void> => {
      if (!interaction.isButton()) return;
      const guildId = interaction.guild?.id;
      if (!guildId) return;

      let language = this.client.config.bot.LANGUAGE;

      const member = await interaction.guild?.members.fetch({
        user: interaction.user.id,
        force: true,
      });

      // Xử lý khi bấm nút chọn Role
      if (interaction.customId == "role-1") {
        this.client.logger.info(
          Helper.name,
          `Người dùng ${chalk.hex("#00D100").bold(interaction.user.displayName)} đã bấm nút ${chalk
            .hex("#00D100")
            .bold(this.client.config.HELPER_SETUP.SELECT_ROLES.NAME1)}`
        );
        if (member && !member.roles.cache.has(this.client.config.HELPER_SETUP.SELECT_ROLES.ID1)) {
          await member.roles.add(this.client.config.HELPER_SETUP.SELECT_ROLES.ID1);
          interaction.reply({
            content: `${this.client.i18n.get(language, "events.helper", "role_added", {
              rolename: this.client.config.HELPER_SETUP.SELECT_ROLES.NAME1,
            })}`,
            flags: MessageFlags.Ephemeral,
          });
        } else if (
          member &&
          member.roles.cache.has(this.client.config.HELPER_SETUP.SELECT_ROLES.ID1)
        ) {
          await member.roles.remove(this.client.config.HELPER_SETUP.SELECT_ROLES.ID1);
          interaction.reply({
            content: `${this.client.i18n.get(language, "events.helper", "role_removed", {
              rolename: this.client.config.HELPER_SETUP.SELECT_ROLES.NAME1,
            })}`,
            flags: MessageFlags.Ephemeral,
          });
        }
      } else if (interaction.customId == "role-2") {
        this.client.logger.info(
          Helper.name,
          `Người dùng ${chalk.hex("#00D100").bold(interaction.user.displayName)} đã bấm nút ${chalk
            .hex("#00D100")
            .bold(this.client.config.HELPER_SETUP.SELECT_ROLES.NAME2)}`
        );
        if (member && !member.roles.cache.has(this.client.config.HELPER_SETUP.SELECT_ROLES.ID2)) {
          await member.roles.add(this.client.config.HELPER_SETUP.SELECT_ROLES.ID2);
          interaction.reply({
            content: `${this.client.i18n.get(language, "events.helper", "role_added", {
              rolename: this.client.config.HELPER_SETUP.SELECT_ROLES.NAME2,
            })}`,
            flags: MessageFlags.Ephemeral,
          });
        } else if (
          member &&
          member.roles.cache.has(this.client.config.HELPER_SETUP.SELECT_ROLES.ID2)
        ) {
          await member.roles.remove(this.client.config.HELPER_SETUP.SELECT_ROLES.ID2);
          interaction.reply({
            content: `${this.client.i18n.get(language, "events.helper", "role_removed", {
              rolename: this.client.config.HELPER_SETUP.SELECT_ROLES.NAME2,
            })}`,
            flags: MessageFlags.Ephemeral,
          });
        }
      } else if (interaction.customId == "role-3") {
        this.client.logger.info(
          Helper.name,
          `Người dùng ${chalk.hex("#00D100").bold(interaction.user.displayName)} đã bấm nút ${chalk
            .hex("#00D100")
            .bold(this.client.config.HELPER_SETUP.SELECT_ROLES.NAME3)}`
        );
        if (member && !member.roles.cache.has(this.client.config.HELPER_SETUP.SELECT_ROLES.ID3)) {
          await member.roles.add(this.client.config.HELPER_SETUP.SELECT_ROLES.ID3);
          interaction.reply({
            content: `${this.client.i18n.get(language, "events.helper", "role_added", {
              rolename: this.client.config.HELPER_SETUP.SELECT_ROLES.NAME3,
            })}`,
            flags: MessageFlags.Ephemeral,
          });
        } else if (
          member &&
          member.roles.cache.has(this.client.config.HELPER_SETUP.SELECT_ROLES.ID3)
        ) {
          await member.roles.remove(this.client.config.HELPER_SETUP.SELECT_ROLES.ID3);
          interaction.reply({
            content: `${this.client.i18n.get(language, "events.helper", "role_removed", {
              rolename: this.client.config.HELPER_SETUP.SELECT_ROLES.NAME3,
            })}`,
            flags: MessageFlags.Ephemeral,
          });
        }
      } else if (interaction.customId == "role-4") {
        this.client.logger.info(
          Helper.name,
          `Người dùng ${chalk.hex("#00D100").bold(interaction.user.displayName)} đã bấm nút ${chalk
            .hex("#00D100")
            .bold(this.client.config.HELPER_SETUP.SELECT_ROLES.NAME4)}`
        );
        if (member && !member.roles.cache.has(this.client.config.HELPER_SETUP.SELECT_ROLES.ID4)) {
          await member.roles.add(this.client.config.HELPER_SETUP.SELECT_ROLES.ID4);
          interaction.reply({
            content: `${this.client.i18n.get(language, "events.helper", "role_added", {
              rolename: this.client.config.HELPER_SETUP.SELECT_ROLES.NAME4,
            })}`,
            flags: MessageFlags.Ephemeral,
          });
        } else if (
          member &&
          member.roles.cache.has(this.client.config.HELPER_SETUP.SELECT_ROLES.ID4)
        ) {
          await member.roles.remove(this.client.config.HELPER_SETUP.SELECT_ROLES.ID4);
          interaction.reply({
            content: `${this.client.i18n.get(language, "events.helper", "role_removed", {
              rolename: this.client.config.HELPER_SETUP.SELECT_ROLES.NAME4,
            })}`,
            flags: MessageFlags.Ephemeral,
          });
        }
      } else if (interaction.customId == "role-5") {
        this.client.logger.info(
          Helper.name,
          `Người dùng ${chalk.hex("#00D100").bold(interaction.user.displayName)} đã bấm nút ${chalk
            .hex("#00D100")
            .bold(this.client.config.HELPER_SETUP.VIEW_RULES.ROLE_NAME)}`
        );
        if (member && !member.roles.cache.has(this.client.config.HELPER_SETUP.VIEW_RULES.ROLE_ID)) {
          await member.roles.add(this.client.config.HELPER_SETUP.VIEW_RULES.ROLE_ID);
          interaction.reply({
            content: `${this.client.i18n.get(language, "events.helper", "role_rules_added", {
              rolename: this.client.config.HELPER_SETUP.VIEW_RULES.ROLE_NAME,
              user: `${interaction.member}`,
            })}`,
            flags: MessageFlags.Ephemeral,
          });
        } else if (
          member &&
          member.roles.cache.has(this.client.config.HELPER_SETUP.VIEW_RULES.ROLE_ID)
        ) {
          interaction.reply({
            content: `${this.client.i18n.get(language, "events.helper", "role_rules_already", {
              rolename: this.client.config.HELPER_SETUP.VIEW_RULES.ROLE_NAME,
              user: `${interaction.member}`,
            })}`,
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      // Các button đặc biệt
      switch (interaction.customId) {
        case "rule":
          if (interaction.isButton()) {
            await this.handleRulesInteraction(
              this.client,
              interaction as ButtonInteraction,
              language
            );
          }
          break;
        case "support-us":
          if (interaction.isButton()) {
            await this.handleSupportUsInteraction(
              this.client,
              interaction as ButtonInteraction,
              language
            );
          }
          break;
        case "role":
          if (interaction.isButton()) {
            await this.handleRoleInteraction(
              this.client,
              interaction as ButtonInteraction,
              language
            );
          }
          break;
        default:
          break;
      }
    });
  }

  // Xử lý khi bấm "Xem luật lệ"
  async handleRulesInteraction(
    client: Manager,
    interaction: ButtonInteraction,
    language: any
  ): Promise<void> {
    client.logger.info(
      Helper.name,
      `Người dùng ${chalk.hex("#00D100").bold(interaction.user.displayName)} đã bấm nút ${chalk
        .hex("#00D100")
        .bold("Xem Luật Lệ")}`
    );

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(client.config.HELPER_SETUP.VIEW_RULES.ROLE_NAME)
        .setStyle(ButtonStyle.Success)
        .setCustomId("role-5"),

      new ButtonBuilder()
        .setLabel(client.config.HELPER_SETUP.VIEW_RULES.NAME1)
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.HELPER_SETUP.VIEW_RULES.URL1),

      new ButtonBuilder()
        .setLabel(client.config.HELPER_SETUP.VIEW_RULES.NAME2)
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.HELPER_SETUP.VIEW_RULES.URL2)
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(client.config.HELPER_SETUP.VIEW_RULES.NAME3)
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.HELPER_SETUP.VIEW_RULES.URL3),

      new ButtonBuilder()
        .setLabel(client.config.HELPER_SETUP.VIEW_RULES.NAME4)
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.HELPER_SETUP.VIEW_RULES.URL4),

      new ButtonBuilder()
        .setLabel(client.config.HELPER_SETUP.VIEW_RULES.NAME5)
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.HELPER_SETUP.VIEW_RULES.URL5)
    );

    const embed = new EmbedBuilder()
      .setTitle(
        `${client.i18n.get(language, "events.helper", "rules_title", {
          support: client.config.HELPER_SETUP.SERVER_SUPPORT_URL,
          bot: `<@${client.user!.id}>`,
          guild: interaction.guild!.name,
        })}`
      )
      .setDescription(
        `${client.i18n.get(language, "events.helper", "rules_desc", {
          support: client.config.HELPER_SETUP.SERVER_SUPPORT_URL,
        })}`
      )
      .setColor(client.color_main);

    interaction.reply({
      embeds: [embed],
      components: [row1, row2],
      flags: MessageFlags.Ephemeral,
    });
  }

  // Xử lý khi bấm "Ủng hộ chúng tôi"
  async handleSupportUsInteraction(
    client: Manager,
    interaction: ButtonInteraction,
    language: any
  ): Promise<void> {
    client.logger.info(
      Helper.name,
      `Người dùng ${chalk.hex("#00D100").bold(interaction.user.displayName)} đã bấm nút ${chalk
        .hex("#00D100")
        .bold("Ủng Hộ Chúng Tôi")}`
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(client.config.HELPER_SETUP.SUPPORT_US.NAME1)
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.HELPER_SETUP.SUPPORT_US.URL1),

      new ButtonBuilder()
        .setLabel(client.config.HELPER_SETUP.SUPPORT_US.NAME2)
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.HELPER_SETUP.SUPPORT_US.URL2),

      new ButtonBuilder()
        .setLabel(client.config.HELPER_SETUP.SUPPORT_US.NAME3)
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.HELPER_SETUP.SUPPORT_US.URL3)
    );

    const embed = new EmbedBuilder()
      .setTitle(
        `${client.i18n.get(language, "events.helper", "support_us_title", {
          support: client.config.HELPER_SETUP.SERVER_SUPPORT_URL,
          bot: client.user!.username,
          guild: interaction.guild!.name,
        })}`
      )
      .setDescription(
        `${client.i18n.get(language, "events.helper", "support_us_desc", {
          support: client.config.HELPER_SETUP.SERVER_SUPPORT_URL,
          bot: client.user!.username,
          guild: interaction.guild!.name,
        })}`
      )
      .setFooter({
        text: `${client.i18n.get(language, "events.helper", "support_us_footer", {
          support: client.config.HELPER_SETUP.SERVER_SUPPORT_URL,
          bot: client.user!.username,
          guild: interaction.guild!.name,
        })}`,
      })
      .setColor(client.color_main);

    interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  }

  // Xử lý khi bấm "Roles"
  async handleRoleInteraction(
    client: Manager,
    interaction: ButtonInteraction,
    language: any
  ): Promise<void> {
    client.logger.info(
      Helper.name,
      `Người dùng ${chalk.hex("#00D100").bold(interaction.user.displayName)} đã bấm nút ${chalk
        .hex("#00D100")
        .bold("Chọn Role")}`
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(client.config.HELPER_SETUP.SELECT_ROLES.NAME1)
        .setCustomId("role-1")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setLabel(client.config.HELPER_SETUP.SELECT_ROLES.NAME2)
        .setCustomId("role-2")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setLabel(client.config.HELPER_SETUP.SELECT_ROLES.NAME3)
        .setCustomId("role-3")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setLabel(client.config.HELPER_SETUP.SELECT_ROLES.NAME4)
        .setCustomId("role-4")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setTitle(`${client.i18n.get(language, "events.helper", "role_title")}`)
      .setDescription(`${client.i18n.get(language, "events.helper", "role_desc")}`)
      .setColor(client.color_main);

    interaction.reply({
      content: " ",
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  }
}
