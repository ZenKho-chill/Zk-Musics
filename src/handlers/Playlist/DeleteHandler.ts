import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
  StringSelectMenuInteraction
} from "discord.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";

const data: Config = new ConfigData().data;

export class PlaylistDeleteHandler {
  public async execute(client: Manager, handler: CommandHandler) {
    // Lấy tất cả playlists của user
    const fullList = await client.db.playlist.all();
    const userPlaylists = fullList.filter((data) => {
      return data.value.owner == handler.user?.id;
    });

    if (!userPlaylists || userPlaylists.length === 0) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Bạn chưa có playlist nào để xóa!")
            .setColor(client.color_main),
        ],
      });
    }

    // Tạo dropdown với các playlist options (giới hạn 25 options của Discord)
    const playlistOptions = userPlaylists.slice(0, 25).map((playlist, index) => {
      const createdDate = new Date(playlist.value.created);
      // Chuyển sang timezone Việt Nam (UTC+7) và format thủ công
      const vietnamTime = new Date(createdDate.getTime() + (7 * 60 * 60 * 1000));
      const day = vietnamTime.getUTCDate().toString().padStart(2, '0');
      const month = (vietnamTime.getUTCMonth() + 1).toString().padStart(2, '0');
      const year = vietnamTime.getUTCFullYear();
      const hours = vietnamTime.getUTCHours().toString().padStart(2, '0');
      const minutes = vietnamTime.getUTCMinutes().toString().padStart(2, '0');
      const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;
      
      return new StringSelectMenuOptionBuilder()
        .setLabel(`${playlist.value.name || playlist.value.id}`)
        .setDescription(`${playlist.value.tracks?.length || 0} bài • ${formattedDate}`)
        .setValue(playlist.value.id);
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("playlist_select_delete")
      .setPlaceholder("Chọn playlist để xóa...")
      .addOptions(playlistOptions);

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setTitle("🗑️ Xóa playlist")
      .setDescription(
        `**Tổng số playlist:** ${userPlaylists.length}\n\n` +
        `⚠️ **Cảnh báo:** Hành động này không thể hoàn tác!\n` +
        `Chọn playlist từ dropdown bên dưới để xóa:`
      )
      .setColor("#ff4444")
      .setFooter({
        text: userPlaylists.length > 25 ? `Hiển thị 25/${userPlaylists.length} playlist đầu tiên` : `${userPlaylists.length} playlist`,
      });

    const response = await handler.editReply({
      embeds: [embed],
      components: [actionRow],
    });

    // Collector để lắng nghe user chọn playlist
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 300000, // 5 phút timeout
    });

    collector.on("collect", async (interaction: StringSelectMenuInteraction) => {
      if (interaction.user.id !== handler.user?.id) {
        return interaction.reply({
          content: "❌ Bạn không thể sử dụng dropdown này!",
          ephemeral: true,
        });
      }

      const selectedPlaylistId = interaction.values[0];
      const playlist = await client.db.playlist.get(selectedPlaylistId);

      if (!playlist) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(handler.language, "commands.playlist", "pl_delete_notfound")}`
              )
              .setColor(client.color_main),
          ],
          ephemeral: true,
        });
      }

      // Disable dropdown sau khi chọn
      selectMenu.setDisabled(true);
      const disabledRow = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(selectMenu);

      await interaction.update({
        components: [disabledRow],
      });

      // Hiển thị confirmation buttons
      await this.showDeleteConfirmation(client, handler, interaction, selectedPlaylistId, playlist);
    });

    collector.on("end", async (_, reason) => {
      if (reason === "time") {
        selectMenu.setDisabled(true);
        const disabledRow = new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(selectMenu);

        const timeoutEmbed = new EmbedBuilder()
          .setDescription("⏰ Thời gian chọn playlist đã hết!")
          .setColor(client.color_main);

        await handler.editReply({
          embeds: [timeoutEmbed],
          components: [disabledRow],
        }).catch(() => null);
      }
    });
  }

  private async showDeleteConfirmation(
    client: Manager, 
    handler: CommandHandler, 
    interaction: StringSelectMenuInteraction,
    playlistId: string,
    playlist: any
  ) {
    const action = new ActionRowBuilder<ButtonBuilder>().addComponents([
      new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId("yes").setLabel("Có"),
      new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId("no").setLabel("Không"),
    ]);

    const confirmEmbed = new EmbedBuilder()
      .setTitle("⚠️ Xác nhận xóa playlist")
      .setDescription(
        `Bạn có chắc chắn muốn xóa playlist?\n\n` +
        `📝 **Tên:** ${playlist.name || playlist.id}\n` +
        `🆔 **ID:** ${playlist.id}\n` +
        `🎵 **Số bài hát:** ${playlist.tracks?.length || 0}\n` +
        `🔒 **Trạng thái:** ${playlist.private ? "Riêng tư" : "Công khai"}\n\n` +
        `❌ **Cảnh báo:** Hành động này không thể hoàn tác!`
      )
      .setColor("#ff4444");

    const msg = await interaction.followUp({
      embeds: [confirmEmbed],
      components: [action],
      ephemeral: true,
    });

    const collector = msg.createMessageComponentCollector({
      filter: (m) => m.user.id == handler.user?.id,
      time: 30000, // 30 giây timeout
    });

    collector.on("collect", async (buttonInteraction) => {
      const id = buttonInteraction.customId;
      
      // Disable tất cả buttons
      const disabledButtons = new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId("yes").setLabel("Có").setDisabled(true),
        new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId("no").setLabel("Không").setDisabled(true),
      ]);

      if (id == "yes") {
        await client.db.playlist.delete(playlistId);
        
        // Update embed với kết quả xóa thành công
        const successEmbed = new EmbedBuilder()
          .setTitle("✅ Đã xóa playlist thành công!")
          .setDescription(
            `${client.i18n.get(handler.language, "commands.playlist", "pl_delete_deleted", {
              name: playlist.name || playlistId,
            })}`
          )
          .setColor("#00ff00");

        await buttonInteraction.update({ 
          embeds: [successEmbed], 
          components: [disabledButtons] 
        });
        collector.stop();
      } else if (id == "no") {
        // Update embed với kết quả hủy bỏ
        const cancelEmbed = new EmbedBuilder()
          .setTitle("❌ Đã hủy xóa playlist")
          .setDescription(
            `${client.i18n.get(handler.language, "commands.playlist", "pl_delete_no")}`
          )
          .setColor(client.color_main);

        await buttonInteraction.update({ 
          embeds: [cancelEmbed], 
          components: [disabledButtons] 
        });
        collector.stop();
      }
    });

    collector.on("end", async (_, reason) => {
      if (reason === "time") {
        // Disable tất cả buttons khi timeout
        const disabledButtons = new ActionRowBuilder<ButtonBuilder>().addComponents([
          new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId("yes").setLabel("Có").setDisabled(true),
          new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId("no").setLabel("Không").setDisabled(true),
        ]);

        const timeoutEmbed = new EmbedBuilder()
          .setTitle("⏰ Hết thời gian xác nhận")
          .setDescription(
            `Thời gian xác nhận đã hết!\n\n` +
            `📝 **Playlist:** ${playlist.name || playlist.id}\n` +
            `🔒 **Trạng thái:** Không bị xóa`
          )
          .setColor("#ffaa00");

        await msg.edit({ 
          embeds: [timeoutEmbed], 
          components: [disabledButtons] 
        }).catch(() => null);
      }
    });
  }
}