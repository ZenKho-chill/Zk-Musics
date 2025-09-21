import { 
  EmbedBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder, 
  ActionRowBuilder, 
  ComponentType,
  StringSelectMenuInteraction
} from "discord.js";
import { PageQueue } from "../../structures/PageQueue.js";
import humanizeDuration from "humanize-duration";
import { Manager } from "../../manager.js";
import { Playlist } from "../../database/schema/Playlist.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { logInfo, logWarn, logError } from "../../utilities/Logger.js";

const data: Config = new ConfigData().data;

export class PlaylistAllHandler {
  // Helper function để truncate text về 1 dòng
  private truncateText(text: string, maxLength: number): string {
    if (!text) return "Unknown";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  // Helper function để format thời lượng từ milliseconds thành MM:SS hoặc HH:MM:SS
  private formatDuration(milliseconds: number): string {
    if (!milliseconds || milliseconds <= 0) return "00:00";
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  // Helper function để format thời gian tạo thành ngày/tháng/năm giờ:phút
  private formatCreatedTime(timestamp: number): string {
    const date = new Date(timestamp);
    // Chuyển sang timezone Việt Nam (UTC+7)
    const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
    const day = vietnamTime.getUTCDate().toString().padStart(2, '0');
    const month = (vietnamTime.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = vietnamTime.getUTCFullYear();
    const hours = vietnamTime.getUTCHours().toString().padStart(2, '0');
    const minutes = vietnamTime.getUTCMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

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
            .setDescription("❌ Bạn chưa có playlist nào!")
            .setColor(client.color_main),
        ],
      });
    }

    // Tạo dropdown với các playlist options (giới hạn 25 options của Discord)
    const playlistOptions = userPlaylists.slice(0, 25).map((playlist, index) => {
      const created = this.formatCreatedTime(playlist.value.created);
      return new StringSelectMenuOptionBuilder()
        .setLabel(`${playlist.value.name || playlist.value.id}`)
        .setDescription(`${playlist.value.tracks?.length || 0} bài • Tạo ${created}`)
        .setValue(playlist.value.id);
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("playlist_select_view")
      .setPlaceholder("Chọn playlist để xem chi tiết...")
      .addOptions(playlistOptions);

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setTitle("📋 Danh sách playlist của bạn")
      .setDescription(
        `**Tổng số playlist:** ${userPlaylists.length}\n\n` +
        `Chọn playlist từ dropdown bên dưới để xem chi tiết:`
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
          content: "❌ Bạn không thể sử dụng menu này!",
          ephemeral: true,
        });
      }

      const selectedPlaylistId = interaction.values[0];

      // Kiểm tra xem interaction đã được acknowledge chưa
      if (interaction.replied || interaction.deferred) {
        logInfo("AllHandler", "Playlist selection interaction already acknowledged, skipping...");
        return;
      }

      try {
        // Defer update để edit tin nhắn gốc
        await interaction.deferUpdate();
      } catch (error) {
        logError("AllHandler", "Error deferring playlist selection update", { error });
        return;
      }

      // Stop collector để tránh multiple interactions
      collector.stop("playlist_selected");

      // Hiển thị chi tiết playlist bằng cách edit tin nhắn hiện tại
      await this.showPlaylistDetails(client, handler, selectedPlaylistId, handler.language);
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        // Disable components khi timeout
        const disabledRow = new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(selectMenu.setDisabled(true));
        
        await handler.editReply({
          components: [disabledRow],
        });
      }
    });
  }

  private async showPlaylistDetails(
    client: Manager, 
    handler: CommandHandler, 
    playlistId: string, 
    language: string,
    currentPage: number = 1
  ) {
    const playlist = await client.db.playlist.get(playlistId);

    if (!playlist) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Không tìm thấy playlist!")
            .setColor(client.color_main),
        ],
      });
    }

    const created = this.formatCreatedTime(playlist.created);

    // Tính tổng thời lượng playlist
    let totalDuration = 0;
    if (playlist.tracks && playlist.tracks.length > 0) {
      totalDuration = playlist.tracks.reduce((total, track) => {
        return total + (track.length || 0);
      }, 0);
    }

    const formattedDuration = this.formatDuration(totalDuration);

    // Pagination logic - 5 bài mỗi trang để tránh vượt 1024 characters limit
    const tracksPerPage = 5;
    const totalTracks = playlist.tracks?.length || 0;
    const totalPages = Math.ceil(totalTracks / tracksPerPage);
    const startIndex = (currentPage - 1) * tracksPerPage;
    const endIndex = startIndex + tracksPerPage;

    // Hiển thị tracks cho trang hiện tại với truncate
    const currentTracks = playlist.tracks?.slice(startIndex, endIndex) || [];
    const trackList = currentTracks.map((track, index) => {
      const duration = track.length ? this.formatDuration(track.length) : "N/A";
      const truncatedTitle = this.truncateText(track.title, 30); // Giảm từ 40 xuống 30
      const truncatedAuthor = this.truncateText(track.author || "Unknown", 20); // Giảm từ 25 xuống 20
      
      // Format tên bài hát với link markdown
      const titleWithLink = track.uri ? `[${truncatedTitle}](<${track.uri}>)` : truncatedTitle;
      
      return `**${startIndex + index + 1}.** ${titleWithLink}\n└ 👤 ${truncatedAuthor} • ⏱️ ${duration}`;
    }).join("\n\n") || "Không có bài hát nào";

    // Kiểm tra độ dài content để đảm bảo không vượt 1024 characters
    let finalTrackList = trackList;
    if (trackList.length > 1020) { // Để lại một chút buffer
      logWarn("AllHandler", "Track list too long, truncating...");
      finalTrackList = trackList.substring(0, 1020) + "...";
    }

    // Tạo page dropdown nếu có nhiều hơn 8 bài
    let components: ActionRowBuilder<StringSelectMenuBuilder>[] = [];
    if (totalPages > 1) {
      const pageOptions = [];
      for (let i = 1; i <= Math.min(totalPages, 25); i++) {
        const start = (i - 1) * tracksPerPage + 1;
        const end = Math.min(i * tracksPerPage, totalTracks);
        pageOptions.push(
          new StringSelectMenuOptionBuilder()
            .setLabel(`Trang ${i}${i === currentPage ? " (hiện tại)" : ""}`)
            .setDescription(`Bài ${start} đến ${end}`)
            .setValue(`page_${i}`)
        );
      }

      const pageSelectMenu = new StringSelectMenuBuilder()
        .setCustomId("playlist_page_select")
        .setPlaceholder("Chọn trang để xem...")
        .addOptions(pageOptions);

      const pageActionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(pageSelectMenu);
      
      components.push(pageActionRow);
    }

    const embed = new EmbedBuilder()
      .setTitle(`🎵 ${playlist.name || playlistId}`)
      .setDescription(playlist.description || "*Không có mô tả*")
      .addFields(
        {
          name: "📊 Thông tin",
          value: 
            `**ID:** ||\`${playlist.id}\`||\n` +
            `**Số bài hát:** ${playlist.tracks?.length || 0}\n` +
            `**Thời lượng phát:** ${totalDuration > 0 ? formattedDuration : "00:00"}\n` +
            `**Trạng thái:** ${playlist.private ? "🔒 Riêng tư" : "🌐 Công khai"}\n` +
            `**Tạo lúc:** ${created}`,
          inline: false,
        },
        {
          name: `🎶 Danh sách bài hát${totalPages > 1 ? ` (Trang ${currentPage}/${totalPages})` : ""}`,
          value: finalTrackList,
          inline: false,
        }
      )
      .setColor(client.color_main)
      .setTimestamp();

    const response = await handler.editReply({ 
      embeds: [embed],
      components: components
    });

    // Nếu có pagination, tạo collector cho page selection
    if (totalPages > 1) {
      const pageCollector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        filter: (interaction) => interaction.customId === "playlist_page_select" && interaction.user.id === handler.user?.id,
        time: 300000, // 5 phút timeout
      });

      pageCollector.on("collect", async (pageInteraction: StringSelectMenuInteraction) => {
        if (pageInteraction.replied || pageInteraction.deferred) {
          return;
        }

        try {
          await pageInteraction.deferUpdate();
        } catch (error) {
          logError("AllHandler", "Error deferring page selection update", { error });
          return;
        }

        pageCollector.stop("page_selected");

        const selectedPage = parseInt(pageInteraction.values[0].replace("page_", ""));
        await this.showPlaylistDetails(client, handler, playlistId, language, selectedPage);
      });

      pageCollector.on("end", async (collected, reason) => {
        if (reason === "time" && collected.size === 0) {
          // Disable dropdown khi timeout
          const disabledComponents = components.map(row => {
            const menu = row.components[0] as StringSelectMenuBuilder;
            menu.setDisabled(true);
            return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
          });
          
          try {
            await handler.editReply({
              components: disabledComponents,
            });
          } catch (error) {
            logError("AllHandler", "Error updating timeout message", { error });
          }
        }
      });
    }
  }
}