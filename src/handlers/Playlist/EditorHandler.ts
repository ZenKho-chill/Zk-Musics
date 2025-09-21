import { 
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ComponentType,
  StringSelectMenuInteraction,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { logInfo, logDebug, logWarn, logError } from "../../utilities/Logger.js";

const data: Config = new ConfigData().data;

export class PlaylistEditorHandler {
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
            .setDescription("❌ Bạn chưa có playlist nào để chỉnh sửa!")
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
      
      const privacy = playlist.value.private ? "🔒 Riêng tư" : "🌐 Công khai";
      
      return new StringSelectMenuOptionBuilder()
        .setLabel(`${playlist.value.name || playlist.value.id}`)
        .setDescription(`${playlist.value.tracks?.length || 0} bài • ${privacy} • ${formattedDate}`)
        .setValue(playlist.value.id);
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("playlist_select_editor")
      .setPlaceholder("Chọn playlist để chỉnh sửa...")
      .addOptions(playlistOptions);

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setTitle("⚙️ Chỉnh sửa playlist")
      .setDescription(
        `**Tổng số playlist:** ${userPlaylists.length}\n\n` +
        `Chọn playlist từ dropdown bên dưới để chỉnh sửa độ hiển thị:`
      )
      .setColor(client.color_main)
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
      
      // Hiển thị options để chỉnh sửa (bao gồm disable dropdown)
      await this.showEditOptions(client, handler, interaction, selectedPlaylistId, selectMenu);
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

  private async showEditOptions(
    client: Manager,
    handler: CommandHandler,
    interaction: StringSelectMenuInteraction,
    playlistId: string,
    selectMenu: StringSelectMenuBuilder
  ) {
    const playlist = await client.db.playlist.get(playlistId);

    if (!playlist) {
      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.playlist", "pl_editor_invalid")}`
            )
            .setColor(client.color_main),
        ],
        components: [],
      });
    }

    const currentPrivacy = playlist.private ? "🔒 Riêng tư" : "🌐 Công khai";
    
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents([
      new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setCustomId("set_public")
        .setLabel("Đặt Công khai")
        .setEmoji("🌐")
        .setDisabled(!playlist.private), // Disable nếu đã public
      new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("set_private")
        .setLabel("Đặt Riêng tư")
        .setEmoji("🔒")
        .setDisabled(playlist.private), // Disable nếu đã private
    ]);

    const editEmbed = new EmbedBuilder()
      .setTitle("⚙️ Chỉnh sửa độ hiển thị playlist")
      .setDescription(
        `📝 **Playlist:** ${playlist.name || playlist.id}\n` +
        `🆔 **ID:** ||${playlist.id}||\n` +
        `🎵 **Số bài hát:** ${playlist.tracks?.length || 0}\n` +
        `🔒 **Trạng thái hiện tại:** ${currentPrivacy}\n\n` +
        `Chọn trạng thái mới cho playlist:`
      )
      .setColor(client.color_main);

    await interaction.update({
      embeds: [editEmbed],
      components: [buttons], // Chỉ hiển thị buttons, xóa dropdown
    });

    const buttonCollector = interaction.message.createMessageComponentCollector({
      filter: (m) => m.user.id == handler.user?.id,
      time: 60000, // 1 phút timeout
    });

    buttonCollector.on("collect", async (buttonInteraction) => {
      const buttonId = buttonInteraction.customId;

      if (buttonId === "set_public") {
        try {
          // Cách 1: Sử dụng sub-key để cập nhật trực tiếp
          await client.db.playlist.set(`${playlistId}.private`, false);
          
          // Xác nhận lại việc cập nhật
          const updatedPlaylist = await client.db.playlist.get(playlistId);
          logDebug("PlaylistEditorHandler", `Sau khi cập nhật với sub-key - Playlist ${playlistId} private: ${updatedPlaylist?.private}`);
          
          // Nếu vẫn không work, thử cách 2
          if (updatedPlaylist?.private !== false) {
            logDebug("PlaylistEditorHandler", "Sub-key không work, thử cách 2 - full object update");
            updatedPlaylist.private = false;
            await client.db.playlist.set(playlistId, updatedPlaylist);
            
            // Xác nhận lần cuối
            const finalCheck = await client.db.playlist.get(playlistId);
            logDebug("PlaylistEditorHandler", `Sau khi cập nhật full object - Playlist ${playlistId} private: ${finalCheck?.private}`);
          }
        } catch (error) {
          logError("PlaylistEditorHandler", "Cập nhật playlist thất bại", { error });
        }
        
        const successEmbed = new EmbedBuilder()
          .setTitle("✅ Đã cập nhật playlist")
          .setDescription(
            `${client.i18n.get(handler.language, "commands.playlist", "pl_editor_public", {
              playlist: playlist.name || playlistId,
            })}\n\n` +
            `🔍 **Debug:** Đã thử cập nhật playlist thành công khai`
          )
          .setColor("#00ff00");

        await buttonInteraction.update({
          embeds: [successEmbed],
          components: [], // Xóa tất cả components
        });
        buttonCollector.stop();
      } else if (buttonId === "set_private") {
        try {
          // Cách 1: Sử dụng sub-key để cập nhật trực tiếp  
          await client.db.playlist.set(`${playlistId}.private`, true);
          
          // Xác nhận lại việc cập nhật
          const updatedPlaylist = await client.db.playlist.get(playlistId);
          logDebug("PlaylistEditorHandler", `Sau khi cập nhật với sub-key - Playlist ${playlistId} private: ${updatedPlaylist?.private}`);
          
          // Nếu vẫn không work, thử cách 2
          if (updatedPlaylist?.private !== true) {
            logDebug("PlaylistEditorHandler", "Sub-key không work, thử cách 2 - full object update");
            updatedPlaylist.private = true;
            await client.db.playlist.set(playlistId, updatedPlaylist);
            
            // Xác nhận lần cuối
            const finalCheck = await client.db.playlist.get(playlistId);
            logDebug("PlaylistEditorHandler", `Sau khi cập nhật full object - Playlist ${playlistId} private: ${finalCheck?.private}`);
          }
        } catch (error) {
          logError("PlaylistEditorHandler", "Cập nhật playlist thất bại", { error });
        }
        
        const successEmbed = new EmbedBuilder()
          .setTitle("✅ Đã cập nhật playlist")
          .setDescription(
            `${client.i18n.get(handler.language, "commands.playlist", "pl_editor_private", {
              playlist: playlist.name || playlistId,
            })}`
          )
          .setColor("#00ff00");

        await buttonInteraction.update({
          embeds: [successEmbed],
          components: [], // Xóa tất cả components
        });
        buttonCollector.stop();
      }
    });

    buttonCollector.on("end", async (_, reason) => {
      if (reason === "time") {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle("⏰ Hết thời gian chỉnh sửa")
          .setDescription(
            `Thời gian chỉnh sửa đã hết!\n\n` +
            `📝 **Playlist:** ${playlist.name || playlist.id}\n` +
            `🔒 **Trạng thái:** Không thay đổi`
          )
          .setColor("#ffaa00");

        await handler.editReply({
          embeds: [timeoutEmbed],
          components: [], // Xóa tất cả components khi timeout
        }).catch(() => null);
      }
    });
  }
}
