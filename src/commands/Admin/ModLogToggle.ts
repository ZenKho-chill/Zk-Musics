import { Manager } from "../../manager.js";
import { Command, CommandOptionInterface } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import {
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  StringSelectMenuInteraction,
  ComponentType,
  TextChannel,
} from "discord.js";
import { ModLogToggle } from "../../database/schema/ModLogToggle.js";
import { getModLogToggles, toggleModLogEvent } from "../../@guild-helpers/ModLogUtils.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;
let collectorActive = false;

export default class implements Command {
  public name = ["modlogs", "toggle"];
  public description = "Bật/tắt các sự kiện ghi mod";
  public category = "Admin";
  public accessableby = data.COMMANDS_ACCESS.ADMIN.ModLogToggle;
  public usage = "";
  public aliases = ["sml"];
  public lavalink = false;
  public options = [];
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const guildId = handler.guild!.id;

    const modLogChannel = await client.db.ModLogChannel.get(guildId);
    if (!modLogChannel) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.admin", "modlogs_toggle_not_setup", {
                user: handler.user!.displayName || handler.user!.tag,
                botname: client.user!.username || client.user!.displayName,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    if (collectorActive) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.admin",
                "modlogs_toggle_collector_active",
                {
                  user: handler.user!.displayName || handler.user!.tag,
                  botname: client.user!.username || client.user!.displayName,
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    collectorActive = true;

    const currentToggles = await getModLogToggles(guildId, client.db);

    if (!currentToggles) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.admin", "modlogs_toggle_notfound", {
                user: handler.user!.displayName || handler.user!.tag,
                botname: client.user!.username || client.user!.displayName,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    const categories = {
      "Sự kiện lệnh ứng dụng": [
        "applicationCommandPermissionsUpdate",
        "applicationCommandCreate",
        "applicationCommandDelete",
        "applicationCommandUpdate",
        "applicationCommandInvocation",
        "applicationCommandCooldownBypass",
      ],
      "Sự kiện tự động kiểm duyệt": [
        "autoModerationRuleCreate",
        "autoModerationRuleUpdate",
        "autoModerationRuleDelete",
        "autoModerationActionExecution",
      ],
      "Sự kiện kênh": [
        "channelCreate",
        "channelDelete",
        "channelUpdate",
        "channelOverwriteUpdate",
        "channelPinsUpdate",
        "channelNSFWToggle",
        "channelSlowmodeUpdate",
      ],
      "Sự kiện emoji & sticker": [
        "emojiCreate",
        "emojiDelete",
        "emojiUpdate",
        "stickerCreate",
        "stickerDelete",
        "stickerUpdate",
      ],
      "Sự kiện máy chủ": [
        "guildBanAdd",
        "guildBanRemove",
        "guildUpdate",
        "guildIntegrationsUpdate",
        "guildScheduledEventCreate",
        "guildScheduledEventDelete",
        "guildScheduledEventUpdate",
        "guildScheduledEventCancel",
        "guildScheduledEventStartEnd",
        "guildAuditLogEntryCreate",
        "guildOnboardingUpdate",
        "guildVanityURLUpdate",
        "guildVanityURLRemove",
        "guildBoostLevelRemoval",
        "guildMFALevelUpdate",
        "guildVerificationLevelUpdate",
        "guildExplicitContentFilterUpdate",
        "guildNotificationSettingsUpdate",
        "guildAFKChannelUpdate",
        "guildRulesChannelUpdate",
        "guildWelcomeScreenUpdate",
        "guildDiscoveryUpdate",
        "guildSystemChannelUpdate",
      ],
      "Sự kiện tích hợp": [
        "integrationCreate",
        "integrationDelete",
        "integrationUpdate",
        "integrationExpiration",
      ],
      "Sự kiện thành viên": [
        "guildMemberAdd",
        "guildMemberRemove",
        "guildMemberUpdate",
        "guildMemberRoleAddRemove",
        "guildMemberPermissionsUpdate",
        "guildMemberAvatarUpdate",
        "guildMemberJoinDateUpdate",
        "guildMemberBoost",
        "guildMemberTimeout",
        "guildMemberOnlineStatusUpdate",
        "guildMemberTemporaryBanUnban",
        "guildMemberPrune",
        "memberTimeoutUpdate",
        "guildAFKUpdate",
        "guildMemberNicknameChange",
        "voiceStateUpdate",
      ],
      "Sự kiện quản trị": ["moderationCommandInvocation"],
      "Sự kiện tin nhắn": [
        "messageDelete",
        "messageUpdate",
        "messageDeleteBulk",
        "messagePinned",
        "messageUnpinned",
        "messageEmbedUpdate",
      ],
      "Sự kiện trạng thái": [
        "presenceUpdate",
        "presenceActivityUpdate",
        "guildMemberPresenceUpdate",
      ],
      "Sự kiện vai trò": [
        "roleCreate",
        "roleDelete",
        "roleUpdate",
        "rolePermissionsUpdate",
        "roleMentionableUpdate",
        "roleHierarchyUpdate",
        "roleMentionableToggle",
      ],
      "Sự kiện chủ đề": [
        "threadCreate",
        "threadDelete",
        "threadUpdate",
        "threadMemberUpdate",
        "threadAutoArchived",
        "threadArchiveUnarchive",
      ],
      "Sự kiện gõ & người dùng": ["typingStart", "userUpdate"],
      "Các sự kiện khác": [
        "auditLogPrune",
        "guildWebhookCreate",
        "guildWebhookDelete",
        "guildBannerRemoval",
        "inviteCreate",
        "inviteDelete",
        "webhookUpdate",
        "stageInstanceCreate",
        "stageInstanceDelete",
        "stageInstanceUpdate",
      ],
    };

    const categoryOptions = Object.keys(categories).map((category) => ({
      label: category,
      description: `Bật/tắt ghi log cho ${category}`,
      value: category,
    }));

    const categorySelectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_category")
      .setPlaceholder("Chọn danh mục")
      .addOptions(categoryOptions);

    const categoryRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      categorySelectMenu
    );

    await handler.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${client.i18n.get(
              handler.language,
              "commands.admin",
              "modlogs_toggle_select_category",
              {
                user: handler.user!.displayName || handler.user!.tag,
                botname: client.user!.username || client.user!.displayName,
              }
            )}`
          )
          .setThumbnail(client.user!.displayAvatarURL({ size: 512 }))
          .setColor(client.color_second),
      ],
      components: [categoryRow],
    });

    const filter = (i: StringSelectMenuInteraction) =>
      i.customId === "select_category" && i.user.id === (handler.user?.id || "");

    const collector = (handler?.channel! as TextChannel).createMessageComponentCollector({
      filter,
      componentType: ComponentType.StringSelect,
      time: 60000,
    });

    collector.on("collect", async (interaction: StringSelectMenuInteraction) => {
      const selectedCategory = interaction.values[0];
      const events = categories[selectedCategory as keyof typeof categories];

      if (!events) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(
                  handler.language,
                  "commands.admin",
                  "modlogs_toggle_category_not_valid",
                  {
                    user: handler.user!.displayName || handler.user!.tag,
                    botname: client.user!.username || client.user!.displayName,
                  }
                )}`
              )
              .setColor(client.color_main),
          ],
        });
      }

      const eventOptions = events.map((event) => ({
        label: event,
        description: `Hiện tại: ${
          currentToggles[event as keyof ModLogToggle] ? "đang bật" : "đang tắt"
        }`,
        value: event,
      }));

      const eventSelectMenu = new StringSelectMenuBuilder()
        .setCustomId("select_event")
        .setPlaceholder(`Chọn sự kiện từ ${selectedCategory}`)
        .addOptions(eventOptions);

      const eventRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        eventSelectMenu
      );

      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.admin",
                "modlogs_toggle_select_event",
                {
                  user: handler.user!.displayName || handler.user!.tag,
                  botname: client.user!.username || client.user!.displayName,
                  categories: selectedCategory,
                }
              )}`
            )
            .setThumbnail(client.user!.displayAvatarURL({ size: 512 }))
            .setColor(client.color_second),
        ],
        components: [eventRow],
      });

      const eventCollector = (handler?.channel! as TextChannel).createMessageComponentCollector({
        filter: (i) => i.customId === "select_event" && i.user.id === (handler.user?.id || ""),
        componentType: ComponentType.StringSelect,
        time: 60000,
      });

      eventCollector.on("collect", async (interaction: StringSelectMenuInteraction) => {
        const selectedEvent = interaction.values[0] as keyof ModLogToggle;
        const currentState = currentToggles[selectedEvent];
        const newState = !currentState;

        await toggleModLogEvent(guildId, selectedEvent, newState, client.db);

        const EmbedEnds = new EmbedBuilder().setColor(client.color_main).setDescription(
          `${client.i18n.get(handler.language, "commands.admin", "modlogs_toggle_selected", {
            user: handler.user!.displayName || handler.user!.tag,
            botname: client.user!.username || client.user!.displayName,
            categories: selectedCategory,
            events: String(selectedEvent),
            state: newState ? "đã bật" : "đã tắt",
          })}`
        );
        await interaction.update({
          embeds: [EmbedEnds],
          components: [],
        });

        eventCollector.stop("finished");
      });

      eventCollector.on("end", async (_, reason) => {
        collectorActive = false;
        if (reason === "finished") {
          collector.removeAllListeners();
          return;
        }
        if (reason === "time") {
          eventRow.components[0].setDisabled(true);
          eventCollector.removeAllListeners();
          await handler.editReply({
            components: [eventRow],
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${client.i18n.get(handler.language, "commands.admin", "modlogs_toggle_timeout", {
                    user: handler.user!.displayName || handler.user!.tag,
                    botname: client.user!.username || client.user!.displayName,
                  })}`
                )
                .setThumbnail(client.user!.displayAvatarURL({ size: 512 }))
                .setColor(client.color_second),
            ],
          });
        }
      });
    });

    collector.on("end", async (_, reason) => {
      collectorActive = false;
      if (reason === "finished") {
        collector.removeAllListeners();
        return;
      }
      if (reason === "time") {
        categoryRow.components[0].setDisabled(true);
        collector.removeAllListeners();
        await handler.editReply({
          components: [categoryRow],
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(handler.language, "commands.admin", "modlogs_toggle_timeout", {
                  user: handler.user!.displayName || handler.user!.tag,
                  botname: client.user!.username || client.user!.displayName,
                })}`
              )
              .setThumbnail(client.user!.displayAvatarURL({ size: 512 }))
              .setColor(client.color_second),
          ],
        });
      }
    });
  }
}
