import { 
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ComponentType,
  StringSelectMenuInteraction,
  ButtonBuilder,
  ButtonStyle,
  InteractionReplyOptions
} from "discord.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import humanizeDuration from "humanize-duration";
import { FormatDuration } from "../../utilities/FormatDuration.js";

const data: Config = ConfigData.getInstance().data;

export class PlaylistRemoveHandler {
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
            .setDescription("❌ Bạn chưa có playlist nào để xóa bài hát!")
            .setColor(client.color_main),
        ],
      });
    }

    // Tạo dropdown với các playlist options (giới hạn 25 options của Discord)
    const playlistOptions = userPlaylists.slice(0, 25).map((playlist, index) => {
      const created = humanizeDuration(Date.now() - playlist.value.created, {
        largest: 1,
      });
      const privacy = playlist.value.private ? "🔒 Riêng tư" : "🌐 Công khai";
      
      return new StringSelectMenuOptionBuilder()
        .setLabel(`${playlist.value.name || playlist.value.id}`)
        .setDescription(`${playlist.value.tracks?.length || 0} bài • ${privacy} • Tạo ${created} trước`)
        .setValue(playlist.value.id);
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("playlist_select_remove")
      .setPlaceholder("Chọn playlist để xóa bài hát...")
      .addOptions(playlistOptions);

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setTitle("🗑️ Xóa bài hát khỏi playlist")
      .setDescription(
        `**Tổng số playlist:** ${userPlaylists.length}\n\n` +
        `Chọn playlist từ dropdown bên dưới để xóa bài hát:`
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

    let playlistCollectorHandled = false; // Flag để tránh double processing

    collector.on("collect", async (interaction: StringSelectMenuInteraction) => {
      
      if (playlistCollectorHandled) {
        return;
      }
      
      if (interaction.user.id !== handler.user?.id) {
        return interaction.reply({
          content: "❌ Bạn không thể sử dụng dropdown này!",
          flags: 64, // MessageFlags.Ephemeral
        });
      }

      const selectedPlaylistId = interaction.values[0];
      
      // Đánh dấu đã xử lý và stop collector ngay
      playlistCollectorHandled = true;
      collector.stop();
      
      // Hiển thị danh sách bài hát để chọn xóa (gộp với disable dropdown)
      await this.showTrackSelection(client, handler, interaction, selectedPlaylistId, selectMenu);
    });

    collector.on("end", async (_, reason) => {
      if (reason === "time" && !playlistCollectorHandled) {
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

  private async showTrackSelection(
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
              `${client.i18n.get(handler.language, "commands.playlist", "pl_remove_notfound")}`
            )
            .setColor(client.color_main),
        ],
        components: [],
      });
    }

    if (!playlist.tracks || playlist.tracks.length === 0) {
      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Playlist này không có bài hát nào để xóa!")
            .setColor(client.color_main),
        ],
        components: [],
      });
    }

    // Tạo dropdown với các bài hát (giới hạn 25 options)
    const trackOptions = playlist.tracks.slice(0, 25).map((track, index) => {
      const duration = new FormatDuration().parse(track.length || 0);
      const title = track.title || "Unknown Title";
      const author = track.author || "Unknown Artist";
      
      return new StringSelectMenuOptionBuilder()
        .setLabel(`${index + 1}. ${title.length > 40 ? title.substring(0, 37) + "..." : title}`)
        .setDescription(`${author} • ${duration}`)
        .setValue(String(index + 1)); // Lưu position (1-based)
    });

    const trackSelectMenu = new StringSelectMenuBuilder()
      .setCustomId("track_select_remove")
      .setPlaceholder("Chọn bài hát để xóa...")
      .addOptions(trackOptions);

    const trackActionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(trackSelectMenu);

    const trackEmbed = new EmbedBuilder()
      .setTitle("🎵 Chọn bài hát để xóa")
      .setDescription(
        `**Playlist:** ${playlist.name || playlist.id}\n` +
        `**Tổng số bài:** ${playlist.tracks.length}\n\n` +
        `Chọn bài hát từ dropdown bên dưới để xóa khỏi playlist:`
      )
      .setColor("#ff4444")
      .setFooter({
        text: playlist.tracks.length > 25 ? `Hiển thị 25/${playlist.tracks.length} bài đầu tiên` : `${playlist.tracks.length} bài`,
      });

    try {
      await interaction.update({
        embeds: [trackEmbed],
        components: [trackActionRow],
      });
    } catch (error) {
      return;
    }

    // Collector để lắng nghe user chọn bài hát
    const trackCollector = interaction.message.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 300000, // 5 phút timeout
    });

    let collectorHandled = false; // Flag để tránh double edit

    trackCollector.on("collect", async (trackInteraction: StringSelectMenuInteraction) => {
      
      if (trackInteraction.user.id !== handler.user?.id) {
        return trackInteraction.reply({
          content: "❌ Bạn không thể sử dụng dropdown này!",
          flags: 64, // MessageFlags.Ephemeral
        });
      }

      const selectedPosition = parseInt(trackInteraction.values[0]);
      
      // Đánh dấu đã xử lý
      collectorHandled = true;
      
      // Stop collector để tránh timeout conflict
      trackCollector.stop();
      
      // Hiển thị confirmation để xóa bài hát (dùng trackInteraction.update trực tiếp)
      await this.showRemoveConfirmation(client, handler, trackInteraction, playlistId, selectedPosition, playlist, trackSelectMenu);
    });

    trackCollector.on("end", async (_, reason) => {
      // Chỉ xử lý timeout nếu chưa được xử lý
      if (reason === "time" && !collectorHandled) {
        const timeoutEmbed = new EmbedBuilder()
          .setDescription("⏰ Thời gian chọn bài hát đã hết!")
          .setColor(client.color_main);

        try {
          await handler.editReply({
            embeds: [timeoutEmbed],
            components: [],
          });
        } catch (error) {
          // Không cần xử lý
        }
      }
    });
  }

  private async showRemoveConfirmation(
    client: Manager,
    handler: CommandHandler,
    interaction: StringSelectMenuInteraction,
    playlistId: string,
    position: number,
    playlist: any,
    trackSelectMenu: StringSelectMenuBuilder
  ) {
    const trackToRemove = playlist.tracks[position - 1];
    const duration = new FormatDuration().parse(trackToRemove.length || 0);

    const confirmButtons = new ActionRowBuilder<ButtonBuilder>().addComponents([
      new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setCustomId("confirm_remove")
        .setLabel("Xóa bài hát")
        .setEmoji("🗑️"),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("cancel_remove")
        .setLabel("Hủy bỏ")
        .setEmoji("❌"),
    ]);

    const confirmEmbed = new EmbedBuilder()
      .setTitle("⚠️ Xác nhận xóa bài hát")
      .setDescription(
        `Bạn có chắc chắn muốn xóa bài hát này?\n\n` +
        `🎵 **Bài hát:** ${trackToRemove.title || "Unknown Title"}\n` +
        `👤 **Nghệ sĩ:** ${trackToRemove.author || "Unknown Artist"}\n` +
        `⏱️ **Thời lượng:** ${duration}\n` +
        `📍 **Vị trí:** ${position}/${playlist.tracks.length}\n` +
        `📝 **Playlist:** ${playlist.name || playlist.id}\n\n` +
        `❌ **Cảnh báo:** Hành động này không thể hoàn tác!`
      )
      .setColor("#ff4444");

    try {
      await interaction.update({
        embeds: [confirmEmbed],
        components: [confirmButtons],
      });
    } catch (error) {
      return;
    }

    const confirmCollector = interaction.message.createMessageComponentCollector({
      filter: (m) => m.user.id == handler.user?.id,
      time: 60000, // 1 phút timeout
    });

    confirmCollector.on("collect", async (buttonInteraction) => {
      const buttonId = buttonInteraction.customId;
      
      // Stop collector ngay để tránh multiple collect
      confirmCollector.stop();

      if (buttonId === "confirm_remove") {
        try {
          // Lấy playlist mới nhất và xóa bài hát
          const currentPlaylist = await client.db.playlist.get(playlistId);
          if (currentPlaylist && currentPlaylist.tracks) {
            currentPlaylist.tracks.splice(position - 1, 1);
            await client.db.playlist.set(playlistId, currentPlaylist);
          }

          const successEmbed = new EmbedBuilder()
            .setTitle("✅ Đã xóa bài hát")
            .setDescription(
              `${client.i18n.get(handler.language, "commands.playlist", "pl_remove_removed", {
                name: trackToRemove.title || "Unknown Title",
                position: String(position),
                playlist: playlist.name || playlistId,
              })}`
            )
            .setColor("#00ff00");

          try {
            await buttonInteraction.update({
              embeds: [successEmbed],
              components: [], // Xóa tất cả components
            });
          } catch (error) {
            // Không cần xử lý
          }
        } catch (error) {
          const errorEmbed = new EmbedBuilder()
            .setTitle("❌ Lỗi xóa bài hát")
            .setDescription("Đã xảy ra lỗi khi xóa bài hát. Vui lòng thử lại!")
            .setColor("#ff0000");

          try {
            await buttonInteraction.update({
              embeds: [errorEmbed],
              components: [], // Xóa tất cả components
            });
          } catch (error) {
            // Không cần xử lý
          }
        }
      } else if (buttonId === "cancel_remove") {
        const cancelEmbed = new EmbedBuilder()
          .setTitle("❌ Đã hủy xóa bài hát")
          .setDescription("Bài hát không bị xóa khỏi playlist.")
          .setColor(client.color_main);

        try {
          await buttonInteraction.update({
            embeds: [cancelEmbed],
            components: [], // Xóa tất cả components
          });
        } catch (error) {
          // Không cần xử lý
        }
      }
    });

    confirmCollector.on("end", async (_, reason) => {
      if (reason === "time") {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle("⏰ Hết thời gian xác nhận")
          .setDescription(
            `Thời gian xác nhận đã hết!\n\n` +
            `🎵 **Bài hát:** ${trackToRemove.title || "Unknown Title"}\n` +
            `🔒 **Trạng thái:** Không bị xóa`
          )
          .setColor("#ffaa00");

        try {
          await handler.editReply({
            embeds: [timeoutEmbed],
            components: [],
          });
        } catch (error) {
          // Không cần xử lý
        }
      }
    });
  }
}
