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

  // Hàm khởi tạo khởi tạo lớp với instance client
  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }

  async execute() {
    this.client.on("interactionCreate", async (interaction: Interaction): Promise<void> => {
      if (!interaction.guild) return;
      const guildId = interaction.guild.id;

      // Lấy cài đặt ngôn ngữ của server từ cơ sở dữ liệu
      let guildModel = await this.client.db.language.get(guildId);
      const language = (guildModel = await this.client.db.language.set(
        guildId,
        this.client.config.bot.LANGUAGE
      ));

      // Lấy thông tin cấu hình ticket của server (role ID, category đóng)
      const TicketSetupData = await this.client.db.TicketSetup.get(guildId);
      const roleId = TicketSetupData?.roleId;
      const closeCategoryId = TicketSetupData?.closeCategory;

      if (interaction.isButton()) {
        // Xử lý tương tác nút để mở ticket mới
        if (interaction.customId.startsWith(`ticket-setup-${interaction.guild.id}`)) {
          const id = interaction.customId.split("-")[3]; // Lấy ID cấu hình ticket

          const modal = new ModalBuilder()
            .setCustomId(`modal-${interaction.guild.id}-${id}`)
            .setTitle(`${interaction.guild.name} — Phiếu hỗ trợ`);

          // Tạo ô nhập để mô tả lý do mở ticket
          const ticketreason: TextInputBuilder = new TextInputBuilder()
            .setCustomId(`ticket-reason`)
            .setLabel("Lý do")
            .setPlaceholder(`${this.client.i18n.get(language, "events.ticket", "ticket_reason")}`)
            .setStyle(TextInputStyle.Short)
            .setMinLength(10)
            .setMaxLength(500);

          const firstActionRow: ActionRowBuilder<TextInputBuilder> =
            new ActionRowBuilder<TextInputBuilder>().addComponents(ticketreason);

          modal.addComponents([firstActionRow]);

          await interaction.showModal(modal); // Hiển thị modal cho người dùng
        }

        // Xử lý tương tác nút để đóng ticket
        if (interaction.customId.startsWith(`close-ticket`)) {
          await interaction.deferUpdate(); // Xác nhận tương tác trước khi xử lý

          const id = interaction.customId.split("-")[2]; // Lấy ID ticket
          const ticketData = await this.client.db.TicketData.get(id); // Lấy dữ liệu ticket

          if (!ticketData) {
            interaction.followUp({
              content: `${this.client.i18n.get(language, "events.ticket", "ticket_already_closed", {
                id: id,
              })}`,
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          const user = await interaction.guild.members.fetch(ticketData.userId).catch(() => null);
          const channel = interaction.guild.channels.cache.get(
            interaction.channelId
          ) as TextChannel;

          // Kiểm tra xem người dùng có quyền quản lý kênh hay không
          if (!channel?.permissionsFor(interaction.user.id)?.has("ManageChannels")) {
            interaction.followUp({
              content: `${this.client.i18n.get(language, "events.ticket", "ticket_close_user")}`,
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          // Tạo bản ghi (transcript) của cuộc trò chuyện trong ticket
          const attachment = await discordTranscripts.createTranscript(channel as any, {
            limit: -1,
            returnType: discordTranscripts.ExportReturnType.Attachment,
            filename: `${ticketData.Username}.html`,
            saveImages: true,
            footerText: "Đã xuất {number} tin nhắn",
            poweredBy: true,
            hydrate: true,
          });

          const message = await channel.send({
            files: [attachment],
          });

          const firstAttachment = message.attachments.first();
          if (!firstAttachment) {
            this.client.logger.error(
              TicketHandler.name,
              `Không thể lấy URL của file transcript cho ticket ${ticketData.Username}`
            );
            return;
          }
          
          const attachmentUrl = firstAttachment.url; // URL của file transcript

          // Kiểm tra category đóng và di chuyển kênh tới đó nếu tồn tại
          const TicketSetupData = await this.client.db.TicketSetup.get(guildId);
          const closeCategoryId = TicketSetupData?.closeCategory;

          if (!closeCategoryId) {
            this.client.logger.warn(
              TicketHandler.name,
              `Chưa đặt category đóng cho server ${guildId}`
            );
            return;
          }

          try {
            // Di chuyển kênh vào category 'Closed'
            const closeCategory = interaction.guild.channels.cache.get(closeCategoryId);
            if (closeCategory && closeCategory.type === ChannelType.GuildCategory) {
              await channel.setParent(closeCategory);
            }
          } catch (error) {
            this.client.logger.error(
              TicketHandler.name,
              `Di chuyển kênh ticket thất bại: ${error}`
            );
          }

          // Gửi tin nhắn riêng (DM) cho người dùng kèm link transcript
          const buttonDmUser = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel(this.client.i18n.get(language, "events.ticket", "label_name_closed"))
              .setURL(attachmentUrl)
              .setStyle(ButtonStyle.Link)
          );

          const embedDmUser = new EmbedBuilder()
            .setColor(this.client.color_main)
            .setTitle(
              `${this.client.i18n.get(language, "events.ticket", "ticket_closed_dm_title")}`
            )
            .setDescription(
              `${this.client.i18n.get(language, "events.ticket", "ticket_closed_dm_desc", {
                bot: this.client.user!.username,
              })}`
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
                `Đã gửi DM thành công tới người dùng ${user.user.tag} khi đóng ticket.`
              );
            } catch (error) {
              this.client.logger.info(
                TicketHandler.name,
                `Gửi tin nhắn tới người dùng ${user.user.tag} thất bại: ${error}`
              );
            }
          } else {
            this.client.logger.info(
              TicketHandler.name,
              `Không tìm thấy người dùng với ID ${ticketData.userId} trên server. Tiếp tục đóng ticket.`
            );
          }

          // Cập nhật quyền và đổi tên kênh ticket, và gửi tin nhắn với nút XÓA
          try {
            const permissionOverwrites: any[] = [
              {
                id: interaction.guild.roles.everyone.id,
                deny: ["ViewChannel"],
              },
              {
                id: interaction.client.user.id,
                allow: ["ManageChannels"],
              },
            ];

            // Chỉ thêm quyền cho role nếu roleId tồn tại
            if (roleId) {
              permissionOverwrites.push({
                id: roleId,
                allow: ["ViewChannel", "SendMessages"],
              });
            }

            await channel.permissionOverwrites.set(permissionOverwrites);

            const newName = `closed-${ticketData.Username}`;
            await channel.setName(newName);

            // Gửi tin nhắn mới có nút XÓA cho nhân viên
            const deleteButton = new ButtonBuilder()
              .setCustomId(`delete-ticket-${ticketData.userId}`)
              .setLabel(`${this.client.i18n.get(language, "events.ticket", "ticket_delete_label")}`)
              .setStyle(ButtonStyle.Danger);

            const linkButton = new ButtonBuilder()
              .setLabel(this.client.i18n.get(language, "events.ticket", "label_name_closed"))
              .setURL(attachmentUrl)
              .setStyle(ButtonStyle.Link);

            // Gom hai nút vào một hàng
            const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
              deleteButton,
              linkButton
            );

            const closedEmbed = new EmbedBuilder()
              .setTitle(`${this.client.i18n.get(language, "events.ticket", "ticket_closed_title")}`)
              .setDescription(
                `${this.client.i18n.get(language, "events.ticket", "ticket_closed_desc")}`
              )
              .setColor(this.client.color_main);

            await channel.send({
              embeds: [closedEmbed],
              components: [buttonRow],
            });

            await this.client.db.TicketData.delete(id);
          } catch (error) {
            this.client.logger.info(TicketHandler.name, `Cập nhật kênh thất bại: ${error}`);
          }
        }

        // Handle button interaction to delete a ticket channel
        if (interaction.customId.startsWith("delete-ticket")) {
          // Đảm bảo chỉ nhân viên (có quyền ManageChannels) mới xóa ticket.
          if (!interaction.channel) return;
          const channel = interaction.channel as TextChannel;
          if (!channel.permissionsFor(interaction.user.id)?.has("ManageChannels")) {
            interaction.reply({
              content: `${this.client.i18n.get(language, "events.ticket", "ticket_delete_user")}`,
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          await interaction.reply({
            content: `${this.client.i18n.get(language, "events.ticket", "ticket_deleting_action")}`,
            flags: MessageFlags.Ephemeral,
          });
          try {
            await channel.delete(); // Xóa kênh ticket
          } catch (error) {
            this.client.logger.warn(TicketHandler.name, `Xóa kênh ticket thất bại: ${error}`);
          }
        }
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith(`modal-${interaction.guild.id}`)) {
          // Kiểm tra xem người dùng đã có ticket đang hoạt động chưa
          const existingTicket = await this.client.db.TicketData.get(interaction.user.id);
          if (existingTicket) {
            await interaction.reply({
              content: `${this.client.i18n.get(language, "events.ticket", "ticket_already_open", {
                channel: `<#${existingTicket.ChannelId}>`,
              })}`,
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
          const id = interaction.customId.split("-")[2];
          const reason = interaction.fields.getTextInputValue("ticket-reason");
          const category = interaction.guild.channels.cache.get(id);

          // Lấy số lượng ticket đã lưu cho server
          let ticketCount = await this.client.db.TicketCount.get(interaction.guild.id);
          if (!ticketCount) ticketCount = 0;
          ticketCount++; // Tăng số lượng ticket cho ticket mới

          // Lưu số ticket mới cho server
          await this.client.db.TicketCount.set(interaction.guild.id, ticketCount);

          // Tạo tên kênh dùng số ticket và tên người dùng
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
              // Lưu dữ liệu ticket vào cơ sở dữ liệu
              await this.client.db.TicketData.set(interaction.user.id, {
                userId: interaction.user.id,
                Username: interaction.user.username,
                ChannelId: c.id,
                ticketCount,
              });

              interaction.reply({
                content: `${this.client.i18n.get(language, "events.ticket", "ticket_create", {
                  channel: `<#${c.id}>`,
                })}`,
                flags: MessageFlags.Ephemeral,
              });

              // Tạo nút đóng cho ticket
              const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId(`close-ticket-${interaction.user.id}`)
                  .setLabel(
                    `${this.client.i18n.get(language, "events.ticket", "ticket_closed_label")}`
                  )
                  .setStyle(ButtonStyle.Danger)
              );

              const embed = new EmbedBuilder()
                .setTitle(
                  `${this.client.i18n.get(language, "events.ticket", "ticket_create_title")}`
                )
                .setAuthor({
                  name: `${interaction.user.username} — Phiếu hỗ trợ`,
                  iconURL: interaction.user.displayAvatarURL(),
                })
                .setDescription(
                  `${this.client.i18n.get(language, "events.ticket", "ticket_create_desc")}`
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
    });
  }
}
