import * as discordTranscripts from "discord-html-transcripts";
import { Manager } from "../../manager.js";
import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ChannelType,
  TextChannel,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Interaction,
  MessageFlags,
} from "discord.js";

export class TicketHandler {
  client: Manager;

  // Khởi tạo class với client (bot)
  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }

  async execute() {
    this.client.on(
      "interactionCreate",
      async (interaction: Interaction): Promise<void> => {
        if (!interaction.guild) return;
        const guildId = interaction.guild.id;

        // Lấy ngôn ngữ đã lưu của server từ database
        let guildModel = await this.client.db.language.get(guildId);
        const language = (guildModel = await this.client.db.language.set(
          guildId,
          this.client.config.bot.LANGUAGE
        ));

        // Lấy dữ liệu cấu hình Ticket (role hỗ trợ, category để đóng ticket)
        const TicketSetupData = await this.client.db.TicketSetup.get(guildId);
        const roleId = TicketSetupData?.roleId;
        const closeCategoryId = TicketSetupData?.closeCategory;

        if (interaction.isButton()) {
          // Khi nhấn nút mở ticket mới
          if (
            interaction.customId.startsWith(
              `ticket-setup-${interaction.guild.id}`
            )
          ) {
            const id = interaction.customId.split("-")[3]; // lấy ID ticket setup

            const modal = new ModalBuilder()
              .setCustomId(`modal-${interaction.guild.id}-${id}`)
              .setTitle(`Ticket của ${interaction.guild.name}`);

            // Ô nhập lý do mở ticket
            const ticketreason: TextInputBuilder = new TextInputBuilder()
              .setCustomId(`ticket-reason`)
              .setLabel("Lý do")
              .setPlaceholder(
                `${this.client.i18n.get(
                  language,
                  "events.ticket",
                  "ticket_reason"
                )}`
              )
              .setStyle(TextInputStyle.Short)
              .setMinLength(10)
              .setMaxLength(500);

            const firstActionRow: ActionRowBuilder<TextInputBuilder> =
              new ActionRowBuilder<TextInputBuilder>().addComponents(
                ticketreason
              );

            modal.addComponents([firstActionRow]);

            await interaction.showModal(modal); // hiển thị modal cho người dùng
          }

          // Khi nhấn nút đóng ticket
          if (interaction.customId.startsWith(`close-ticket`)) {
            await interaction.deferUpdate(); // xác nhận trước khi xử lý

            const id = interaction.customId.split("-")[2]; // lấy ID ticket
            const ticketData = await this.client.db.TicketData.get(id); // lấy dữ liệu ticket

            if (!ticketData) {
              interaction.followUp({
                content: `${this.client.i18n.get(
                  language,
                  "events.ticket",
                  "ticket_already_closed",
                  {
                    id: id,
                  }
                )}`,
                flags: MessageFlags.Ephemeral,
              });
              return;
            }

            const user = await interaction.guild.members
              .fetch(ticketData.userId)
              .catch(() => null);
            const channel = interaction.guild.channels.cache.get(
              interaction.channelId
            ) as TextChannel;

            // Kiểm tra quyền quản lý kênh
            if (
              !channel
                ?.permissionsFor(interaction.user.id)
                ?.has("ManageChannels")
            ) {
              interaction.followUp({
                content: `${this.client.i18n.get(
                  language,
                  "events.ticket",
                  "ticket_close_user"
                )}`,
                flags: MessageFlags.Ephemeral,
              });
              return;
            }

            // Xuất bản log hội thoại của ticket (transcript)
            const attachment = await discordTranscripts.createTranscript(
              channel as any,
              {
                limit: -1,
                returnType: discordTranscripts.ExportReturnType.Attachment,
                filename: `${ticketData.Username}.html`,
                saveImages: true,
                footerText: "Đã xuất {number} tin nhắn",
                poweredBy: true,
                hydrate: true,
              }
            );

            const message = await channel.send({
              files: [attachment],
            });

            const attachmentUrl = message.attachments.first().url; // link file transcript

            // Kiểm tra category đóng, nếu có thì di chuyển channel vào
            const TicketSetupData = await this.client.db.TicketSetup.get(
              guildId
            );
            const closeCategoryId = TicketSetupData?.closeCategory;

            if (!closeCategoryId) {
              this.client.logger.warn(
                TicketHandler.name,
                `⚠️ Chưa cấu hình category đóng ticket cho server ${guildId}`
              );
              return;
            }

            try {
              // Chuyển channel vào category "Đã đóng"
              const closeCategory =
                interaction.guild.channels.cache.get(closeCategoryId);
              if (
                closeCategory &&
                closeCategory.type === ChannelType.GuildCategory
              ) {
                await channel.setParent(closeCategory);
              }
            } catch (error) {
              this.client.logger.error(
                TicketHandler.name,
                `❌ Lỗi khi di chuyển kênh ticket: ${error}`
              );
            }

            // Gửi DM cho user kèm link transcript
            const buttonDmUser =
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setLabel(
                    this.client.i18n.get(
                      language,
                      "events.ticket",
                      "label_name_closed"
                    )
                  )
                  .setURL(attachmentUrl)
                  .setStyle(ButtonStyle.Link)
              );

            const embedDmUser = new EmbedBuilder()
              .setColor(this.client.color_main)
              .setTitle(
                `${this.client.i18n.get(
                  language,
                  "events.ticket",
                  "ticket_closed_dm_title"
                )}`
              )
              .setDescription(
                `${this.client.i18n.get(
                  language,
                  "events.ticket",
                  "ticket_closed_dm_desc",
                  {
                    bot: this.client.user!.username,
                  }
                )}`
              );

            if (user) {
              try {
                await user.send({
                  content: " ",
                  components: [buttonDmUser],
                  embeds: [embedDmUser],
                });
                this.client.logger.info(
                  TicketHandler.name,
                  `✅ Đã gửi DM cho người dùng ${user.user.tag} sau khi đóng ticket`
                );
              } catch (error) {
                this.client.logger.info(
                  TicketHandler.name,
                  `⚠️ Không thể gửi DM cho ${user.user.tag}: ${error}`
                );
              }
            } else {
              this.client.logger.info(
                TicketHandler.name,
                `⚠️ Không tìm thấy user ID ${ticketData.userId} trong server, tiếp tục đóng ticket`
              );
            }

            // Cập nhật quyền, đổi tên kênh, gửi nút xóa cho staff
            try {
              await channel.permissionOverwrites.set([
                {
                  id: interaction.guild.roles.everyone.id,
                  deny: ["ViewChannel"],
                },
                {
                  id: roleId,
                  allow: ["ViewChannel", "SendMessages"],
                },
                {
                  id: interaction.client.user.id,
                  allow: ["ManageChannels"],
                },
              ]);

              const newName = `closed-${ticketData.Username}`;
              await channel.setName(newName);

              // Nút xóa ticket (cho staff)
              const deleteButton = new ButtonBuilder()
                .setCustomId(`delete-ticket-${ticketData.userId}`)
                .setLabel(
                  `${this.client.i18n.get(
                    language,
                    "events.ticket",
                    "ticket_delete_label"
                  )}`
                )
                .setStyle(ButtonStyle.Danger);

              const linkButton = new ButtonBuilder()
                .setLabel(
                  this.client.i18n.get(
                    language,
                    "events.ticket",
                    "label_name_closed"
                  )
                )
                .setURL(attachmentUrl)
                .setStyle(ButtonStyle.Link);

              const buttonRow =
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                  deleteButton,
                  linkButton
                );

              const closedEmbed = new EmbedBuilder()
                .setTitle(
                  `${this.client.i18n.get(
                    language,
                    "events.ticket",
                    "ticket_closed_title"
                  )}`
                )
                .setDescription(
                  `${this.client.i18n.get(
                    language,
                    "events.ticket",
                    "ticket_closed_desc"
                  )}`
                )
                .setColor(this.client.color_main);

              await channel.send({
                embeds: [closedEmbed],
                components: [buttonRow],
              });

              await this.client.db.TicketData.delete(id);
            } catch (error) {
              this.client.logger.info(
                TicketHandler.name,
                `❌ Lỗi khi cập nhật channel: ${error}`
              );
            }
          }

          // Khi nhấn nút xóa ticket
          if (interaction.customId.startsWith("delete-ticket")) {
            // Chỉ staff có quyền ManageChannels mới xóa được
            if (!interaction.channel) return;
            const channel = interaction.channel as TextChannel;
            if (
              !channel
                .permissionsFor(interaction.user.id)
                ?.has("ManageChannels")
            ) {
              interaction.reply({
                content: `${this.client.i18n.get(
                  language,
                  "events.ticket",
                  "ticket_delete_user"
                )}`,
                flags: MessageFlags.Ephemeral,
              });
              return;
            }

            await interaction.reply({
              content: `${this.client.i18n.get(
                language,
                "events.ticket",
                "ticket_deleting_action"
              )}`,
              flags: MessageFlags.Ephemeral,
            });
            try {
              await channel.delete(); // Xóa kênh ticket
            } catch (error) {
              this.client.logger.warn(
                TicketHandler.name,
                `❌ Lỗi khi xóa ticket: ${error}`
              );
            }
          }
        }

        if (interaction.isModalSubmit()) {
          if (
            interaction.customId.startsWith(`modal-${interaction.guild.id}`)
          ) {
            // Kiểm tra user có ticket đang mở không
            const existingTicket = await this.client.db.TicketData.get(
              interaction.user.id
            );
            if (existingTicket) {
              await interaction.reply({
                content: `${this.client.i18n.get(
                  language,
                  "events.ticket",
                  "ticket_already_open",
                  {
                    channel: `<#${existingTicket.ChannelId}>`,
                  }
                )}`,
                flags: MessageFlags.Ephemeral,
              });
              return;
            }
            const id = interaction.customId.split("-")[2];
            const reason =
              interaction.fields.getTextInputValue("ticket-reason");
            const category = interaction.guild.channels.cache.get(id);

            // Lấy số lượng ticket đã tạo trong server
            let ticketCount = await this.client.db.TicketCount.get(
              interaction.guild.id
            );
            if (!ticketCount) ticketCount = 0;
            ticketCount++; // tăng count khi tạo mới

            await this.client.db.TicketCount.set(
              interaction.guild.id,
              ticketCount
            );

            // Tạo tên kênh theo số thứ tự + tên user
            const channelName = `${ticketCount}-${interaction.user.username}`;

            await interaction.guild.channels
              .create({
                parent: category!.id,
                name: `ticket-${channelName}`,
                permissionOverwrites: [
                  {
                    id: interaction.user.id,
                    allow: ["SendMessages", "ViewChannel"],
                  },
                  {
                    id: interaction.guild.roles.everyone,
                    deny: ["ViewChannel"],
                  },
                  {
                    id: interaction.client.user.id,
                    allow: ["ManageChannels"],
                  },
                ],
                type: ChannelType.GuildText,
              })
              .then(async (c: TextChannel) => {
                // Lưu dữ liệu ticket vào database
                await this.client.db.TicketData.set(interaction.user.id, {
                  userId: interaction.user.id,
                  Username: interaction.user.username,
                  ChannelId: c.id,
                  ticketCount,
                });

                interaction.reply({
                  content: `${this.client.i18n.get(
                    language,
                    "events.ticket",
                    "ticket_create",
                    {
                      channel: `<#${c.id}>`,
                    }
                  )}`,
                  flags: MessageFlags.Ephemeral,
                });

                // Nút đóng ticket
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                  new ButtonBuilder()
                    .setCustomId(`close-ticket-${interaction.user.id}`)
                    .setLabel(
                      `${this.client.i18n.get(
                        language,
                        "events.ticket",
                        "ticket_closed_label"
                      )}`
                    )
                    .setStyle(ButtonStyle.Danger)
                );

                const embed = new EmbedBuilder()
                  .setTitle(
                    `${this.client.i18n.get(
                      language,
                      "events.ticket",
                      "ticket_create_title"
                    )}`
                  )
                  .setAuthor({
                    name: `Ticket của ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL(),
                  })
                  .setDescription(
                    `${this.client.i18n.get(
                      language,
                      "events.ticket",
                      "ticket_create_desc"
                    )}`
                  )
                  .setTimestamp()
                  .addFields({ name: "Lý do", value: `${reason}` })
                  .setColor(this.client.color_main);

                c.send({
                  content: `${interaction.user} <@&${roleId}>`,
                  components: [row],
                  embeds: [embed],
                });
              });
          }
        }
      }
    );
  }
}
