import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import {
  ApplicationCommandOptionType,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  CommandInteractionOptionResolver,
  ChannelType,
  TextChannel,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} from "discord.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

let modalActive = false;

export default class implements Command {
  public name = ["ticket", "setup"];
  public description = "Cài đặt hệ thống ticket trong máy chủ của bạn";
  public category = "Admin";
  public accessableby = data.COMMANDS_ACCESS.ADMIN.TicketSetup;
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "channel",
      description: "Chọn kênh để đặt hệ thống ticket",
      type: ApplicationCommandOptionType.Channel,
      required: true,
    },
    {
      name: "open_category",
      description: "Chọn category chứa ticket đang mở",
      type: ApplicationCommandOptionType.Channel,
      required: true,
    },
    {
      name: "close_category",
      description: "Chọn category chứa ticket đã đóng",
      type: ApplicationCommandOptionType.Channel,
      required: true,
    },
    {
      name: "role",
      description: "Chọn role được gán cho ticket",
      type: ApplicationCommandOptionType.Role,
      required: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    if (!handler.interaction) return;

    if (modalActive) {
      return handler.interaction.reply({
        content: `${client.i18n.get(handler.language, "events.ticket", "ticket_modal_active")}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    modalActive = true;

    const guildId = handler.interaction.guild!.id;
    const existingSetup = await client.db.TicketSetup.get(guildId);

    if (existingSetup) {
      modalActive = false;
      return handler.interaction.reply({
        content: `${client.i18n.get(handler.language, "events.ticket", "ticket_already_setup")}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!client.config.utilities.TicketSystem.Enable) {
      modalActive = false;
      await handler.interaction.reply({
        content: `${client.i18n.get(handler.language, "events.ticket", "disable_ticket_system")}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const interaction = handler.interaction as any;
    const options = interaction.options as CommandInteractionOptionResolver;
    const dataChannel = await options.getChannel("channel");
    const openCategoryData = await options.getChannel("open_category");
    const closeCategoryData = await options.getChannel("close_category");
    const roleData = await options.getRole("role");

    const channel = handler.interaction.guild?.channels.cache.get(dataChannel?.id!);
    const openCategory = handler.interaction.guild?.channels.cache.get(openCategoryData?.id!);
    const closeCategory = handler.interaction.guild?.channels.cache.get(closeCategoryData?.id!);
    const role = handler.interaction.guild?.roles.cache.get(roleData?.id!);

    if (!channel || !openCategory || !closeCategory || !role) {
      modalActive = false;
      return handler.interaction.reply({
        content: `${client.i18n.get(
          handler.language,
          "events.ticket",
          "invalid_channel_category"
        )}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!channel.viewable) {
      modalActive = false;
      return handler.interaction.reply({
        content: `${client.i18n.get(handler.language, "events.ticket", "channel_viewable")}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (openCategory.type !== ChannelType.GuildCategory) {
      modalActive = false;
      return handler.interaction.reply({
        content: `${client.i18n.get(handler.language, "events.ticket", "invalid_open_category")}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (closeCategory.type !== ChannelType.GuildCategory) {
      modalActive = false;
      return handler.interaction.reply({
        content: `${client.i18n.get(handler.language, "events.ticket", "invalid_close_category")}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!openCategory.viewable || !closeCategory.viewable) {
      modalActive = false;
      return handler.interaction.reply({
        content: `${client.i18n.get(handler.language, "events.ticket", "category_viewable")}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // Nút & Cấu hình Modal
    const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket-setup-${handler.interaction.guild?.id}-${openCategory.id}`)
        .setLabel("Tạo Ticket")
        .setStyle(ButtonStyle.Success)
    );

    const modal = new ModalBuilder()
      .setCustomId(`ticket-embed-modal-${handler.interaction.guild!.id}`)
      .setTitle("Cài đặt Embed cho Ticket");

    const titleInput = new TextInputBuilder()
      .setCustomId("embed_title")
      .setLabel(
        client.i18n.get(handler.language, "events.ticket", "ticket_setup_label_embed_title")
      )
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(
        client.i18n.get(handler.language, "events.ticket", "ticket_setup_placeholder_embed_title")
      )
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("embed_description")
      .setLabel(
        client.i18n.get(handler.language, "events.ticket", "ticket_setup_label_embed_description")
      )
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(
        client.i18n.get(
          handler.language,
          "events.ticket",
          "ticket_setup_placeholder_embed_description"
        )
      )
      .setRequired(true);

    const thumbnailInput = new TextInputBuilder()
      .setCustomId("embed_thumbnail")
      .setLabel(
        client.i18n.get(handler.language, "events.ticket", "ticket_setup_label_embed_thumbnail_url")
      )
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(
        client.i18n.get(
          handler.language,
          "events.ticket",
          "ticket_setup_placeholder_embed_thumbnail_url"
        )
      )
      .setRequired(false);

    const imageInput = new TextInputBuilder()
      .setCustomId("embed_image")
      .setLabel(
        client.i18n.get(handler.language, "events.ticket", "ticket_setup_label_embed_image_url")
      )
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(
        client.i18n.get(
          handler.language,
          "events.ticket",
          "ticket_setup_placeholder_embed_image_url"
        )
      )
      .setRequired(false);

    const footerInput = new TextInputBuilder()
      .setCustomId("embed_footer")
      .setLabel(
        client.i18n.get(handler.language, "events.ticket", "ticket_setup_label_embed_footer")
      )
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(
        client.i18n.get(handler.language, "events.ticket", "ticket_setup_placeholder_embed_footer")
      )
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(thumbnailInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(footerInput)
    );

    await handler.interaction.showModal(modal);

    try {
      if (!handler.interaction) return;

      const submitted = await handler.interaction
        .awaitModalSubmit({
          time: 60000,
          filter: (i) =>
            i.customId === `ticket-embed-modal-${handler.interaction?.guild!.id}` &&
            i.user.id === handler.interaction?.user.id,
        })
        .catch(() => null);

      if (!submitted) {
        if (handler.interaction) {
          await handler.interaction.followUp({
            content: client.i18n.get(handler.language, "events.ticket", "ticket_setup_timeout"),
            flags: MessageFlags.Ephemeral,
          });
        }
        return;
      }

      const embedTitle = submitted.fields.getTextInputValue("embed_title");
      const embedDescription = submitted.fields.getTextInputValue("embed_description");
      const thumbnailURL = submitted.fields.getTextInputValue("embed_thumbnail");
      const embedImage = submitted.fields.getTextInputValue("embed_image");
      const footerText = submitted.fields.getTextInputValue("embed_footer");

      const isValidUrl = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      const embed = new EmbedBuilder().setColor(client.color_main);
      if (embedTitle) embed.setTitle(embedTitle);
      if (embedDescription) embed.setDescription(embedDescription);
      if (thumbnailURL && isValidUrl(thumbnailURL)) embed.setThumbnail(thumbnailURL);
      if (embedImage && isValidUrl(embedImage)) embed.setImage(embedImage);
      if (footerText) embed.setFooter({ text: footerText });

      if (thumbnailURL && !isValidUrl(thumbnailURL)) {
        return submitted.reply({
          content: client.i18n.get(
            handler.language,
            "events.ticket",
            "ticket_setup_invalid_url_thumbnail"
          ),
          flags: MessageFlags.Ephemeral,
        });
      }

      if (embedImage && !isValidUrl(embedImage)) {
        return submitted.reply({
          content: client.i18n.get(
            handler.language,
            "events.ticket",
            "ticket_setup_invalid_url_image"
          ),
          flags: MessageFlags.Ephemeral,
        });
      }

      await (channel as TextChannel).send({
        embeds: [embed],
        components: [button],
      });

      const new_data = {
        channelId: channel.id,
        openCategory: openCategory.id,
        closeCategory: closeCategory.id,
        roleId: role.id,
      };
      await client.db.TicketSetup.set(guildId, new_data);

      await submitted.reply({
        content: client.i18n.get(handler.language, "events.ticket", "setup_ticket_succes", {
          channel: `${channel}`,
        }),
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      await handler.interaction.followUp({
        content: client.i18n.get(handler.language, "events.ticket", "ticket_setup_modal_error"),
        flags: MessageFlags.Ephemeral,
      });
    } finally {
      modalActive = false;
      handler.interaction.client.removeAllListeners("modalSubmit");
    }
  }
}
