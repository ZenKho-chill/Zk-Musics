import { 
  EmbedBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  ModalSubmitInteraction,
} from "discord.js";
import id from "voucher-code-generator";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { logInfo, logDebug, logWarn, logError } from "../../utilities/Logger.js";

const data: Config = new ConfigData().data;

export class PlaylistCreateHandler {
  public async execute(client: Manager, handler: CommandHandler) {
    // Tạo modal để người dùng nhập thông tin playlist
    const modal = new ModalBuilder()
      .setCustomId("playlist_create_modal")
      .setTitle("🎵 Tạo Playlist Mới");

    // Input cho tên playlist
    const nameInput = new TextInputBuilder()
      .setCustomId("playlist_name")
      .setLabel("Tên Playlist")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Nhập tên playlist của bạn...")
      .setRequired(true)
      .setMaxLength(16);

    // Input cho mô tả playlist (tùy chọn)
    const descriptionInput = new TextInputBuilder()
      .setCustomId("playlist_description")
      .setLabel("Mô Tả Playlist (Tùy chọn)")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Nhập mô tả cho playlist...")
      .setRequired(false)
      .setMaxLength(1000);

    // Tạo action rows cho từng input
    const nameRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
    const descriptionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);

    // Thêm components vào modal
    modal.addComponents(nameRow, descriptionRow);

    // Hiển thị modal
    await handler.interaction.showModal(modal);

    // Lắng nghe modal submit
    try {
      const modalInteraction = await handler.interaction.awaitModalSubmit({
        time: 300000, // 5 phút timeout
        filter: (i) => i.customId === "playlist_create_modal" && i.user.id === handler.user?.id,
      });

      // Defer reply cho modal interaction
      await modalInteraction.deferReply({ ephemeral: true });

      // Lấy dữ liệu từ modal
      const playlistName = modalInteraction.fields.getTextInputValue("playlist_name").trim();
      const playlistDescription = modalInteraction.fields.getTextInputValue("playlist_description").trim() || null;

      // Xử lý tạo playlist
      await this.createPlaylist(client, modalInteraction, playlistName, playlistDescription, handler.language);
      
    } catch (error) {
      // Timeout hoặc lỗi khác
      logError("CreateHandler", "Modal submit error", { error });
      // Không cần handle vì user đã đóng modal hoặc timeout
    }
  }

  private async createPlaylist(
    client: Manager,
    interaction: ModalSubmitInteraction,
    playlistName: string,
    playlistDescription: string | null,
    language: string
  ) {
    // Kiểm tra tên playlist không rỗng
    if (!playlistName || playlistName.length === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Tên playlist không được để trống!")
            .setColor(client.color_main),
        ],
      });
    }

    // Kiểm tra độ dài tên playlist
    if (playlistName.length > 16) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Tên playlist không được vượt quá 16 ký tự!")
            .setColor(client.color_main),
        ],
      });
    }

    // Kiểm tra độ dài mô tả
    if (playlistDescription && playlistDescription.length > 1000) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Mô tả playlist không được vượt quá 1000 ký tự!")
            .setColor(client.color_main),
        ],
      });
    }

    // Kiểm tra giới hạn số playlist của user
    const fullList = await client.db.playlist.all();
    const userPlaylists = fullList.filter((data) => {
      return data.value.owner == interaction.user.id;
    });

    if (userPlaylists.length >= client.config.features.LIMIT_PLAYLIST) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `❌ Bạn đã đạt giới hạn ${client.config.features.LIMIT_PLAYLIST} playlist!`
            )
            .setColor(client.color_main),
        ],
      });
    }

    // Tạo ID ngẫu nhiên cho playlist
    const playlistId = id.generate({
      length: 8,
      charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    })[0];

    // Kiểm tra ID có trùng không
    const existing = await client.db.playlist.get(playlistId);
    if (existing) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Đã xảy ra lỗi khi tạo playlist! Vui lòng thử lại.")
            .setColor(client.color_main),
        ],
      });
    }

    // Tạo playlist mới
    await client.db.playlist.set(playlistId, {
      id: playlistId,
      name: playlistName,
      owner: interaction.user.id,
      tracks: [],
      private: true, // Mặc định playlist là private
      created: Date.now(),
      description: playlistDescription,
    });

    // Thông báo thành công
    const successEmbed = new EmbedBuilder()
      .setTitle("✅ Tạo Playlist Thành Công!")
      .setDescription(
        `**Tên playlist:** \`${playlistName}\`\n` +
        `**ID:** ||\`${playlistId}\`||\n` +
        `**Mô tả:** ${playlistDescription || "*Không có mô tả*"}\n` +
        `**Trạng thái:** Riêng tư\n` +
        `**Số bài hát:** 0`
      )
      .setColor(client.color_main)
      .setTimestamp()
      .setFooter({
        text: `Tạo bởi ${interaction.user.displayName || interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.editReply({
      embeds: [successEmbed],
    });
  }
}
