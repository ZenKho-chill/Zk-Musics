import {
  EmbedBuilder,
  AutocompleteInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
  StringSelectMenuInteraction,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
} from "discord.js";
import { ConvertTime } from "../../utilities/ConvertTime.js";
import { ConfigData } from "../../services/ConfigData.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { GlobalInteraction } from "../../@types/Interaction.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";

const data = new ConfigData().data;

export class PlaylistAddHandler {
  public async execute(client: Manager, handler: CommandHandler) {
    // Lấy tất cả playlists của user
    const userPlaylists: any[] = [];
    const fullList = await client.db.playlist.all();
    
    fullList
      .filter((data) => {
        return data.value.owner == handler.user?.id;
      })
      .forEach((data) => {
        userPlaylists.push(data.value);
      });

    // Kiểm tra xem user có playlist nào không
    if (userPlaylists.length === 0) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(client.i18n.get(handler.language, "commands", "playlist.handler_errors.no_playlists_create_first"))
            .setColor(client.color_main),
        ],
      });
    }

    // Tạo dropdown với các playlist options
    const playlistOptions = userPlaylists.slice(0, 25).map((playlist) => // Discord giới hạn 25 options
      new StringSelectMenuOptionBuilder()
        .setLabel(`${playlist.name} (${playlist.tracks?.length || 0} bài)`)
        .setDescription(`ID: ${playlist.id}`)
        .setValue(playlist.id)
    );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("playlist_select_add")
      .setPlaceholder("Chọn playlist để thêm bài hát...")
      .addOptions(playlistOptions);

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setTitle("🎵 Thêm bài hát vào playlist")
      .setDescription("Vui lòng chọn playlist mà bạn muốn thêm bài hát:")
      .setColor(client.color_main);

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
          content: client.i18n.get(handler.language, "handlers", "unauthorized_user"),
          ephemeral: true,
        });
      }

      // Kiểm tra xem interaction đã được acknowledge chưa
      if (interaction.replied || interaction.deferred) {
        logInfo("AddHandler", "Playlist selection interaction already acknowledged, skipping...");
        return;
      }

      const selectedPlaylistId = interaction.values[0];

      try {
        // Defer update để edit tin nhắn gốc thay vì tạo mới
        await interaction.deferUpdate();
      } catch (error) {
        logError("AddHandler", "Error deferring playlist selection update", { error });
        return;
      }

      // Stop collector để tránh multiple interactions
      collector.stop("playlist_selected");

      // Gọi method để xử lý thêm bài hát (sử dụng handler.editReply)
      await this.handleAddSongSimple(client, handler, selectedPlaylistId, handler.language);
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

  private async handleAddSong(
    client: Manager, 
    handler: CommandHandler, 
    playlistId: string, 
    language: string
  ) {
    // Lấy thông tin playlist để hiển thị tên
    const playlist = await client.db.playlist.get(playlistId);
    if (!playlist) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(client.i18n.get(handler.language, "commands", "playlist.errors.playlist_not_found"))
            .setColor(client.color_main),
        ],
      });
    }

    // Tạo button để nhập qua modal
    const inputButton = new ButtonBuilder()
      .setCustomId(`song_input_modal_${playlistId}`)
      .setLabel("📝 Nhập tên/link bài hát")
      .setStyle(ButtonStyle.Primary);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(inputButton);

    // Embed hướng dẫn với 2 cách nhập
    const songInputEmbed = new EmbedBuilder()
      .setTitle("🎵 Thêm bài hát vào playlist")
      .setDescription(
        "**Bạn có thể nhập tên bài hát hoặc link bằng 2 cách:**\n\n" +
        `🏷️ **Cách 1:** Tag bot ${client.user} và gửi tên/link\n` +
        "📝 **Cách 2:** Nhấn nút bên dưới để mở popup nhập"
      )
      .setColor(client.color_main)
      .addFields({
        name: client.i18n.get(handler.language, "commands", "playlist.ui_elements.playlist_selected_header"),
        value: `**Tên:** ${playlist.name}\n**ID:** ||\`${playlistId}\`||`,
        inline: true,
      });

    const replyMessage = await handler.editReply({
      embeds: [songInputEmbed],
      components: [buttonRow],
    });

    logDebug("AddHandler", "Button created", { buttonId: `song_input_modal_${playlistId}` });
    logDebug("AddHandler", "Reply message created", { messageExists: !!replyMessage });

    // Collector cho button - sử dụng replyMessage thay vì interaction.message
    const buttonCollector = replyMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000, // 5 phút
    });

    logDebug("AddHandler", "Button collector created", { collectorExists: !!buttonCollector });

    // Collector cho mention message
    const messageFilter = (m: any) => {
      return m.author.id === handler.user?.id && 
             (m.mentions.has(client.user?.id) || m.content.startsWith(`<@${client.user?.id}>`));
    };
    
    const messageCollector = handler.interaction.channel?.createMessageCollector({
      filter: messageFilter,
      time: 300000, // 5 phút
    });

    // Handle button click
    buttonCollector.on("collect", async (buttonInt: ButtonInteraction) => {
      logDebug("AddHandler", "Button clicked", { 
        customId: buttonInt.customId,
        userId: buttonInt.user.id, 
        expectedUserId: handler.user?.id 
      });
      
      if (buttonInt.user.id !== handler.user?.id) {
        return buttonInt.reply({
          content: client.i18n.get(handler.language, "handlers", "unauthorized_user"),
          ephemeral: true,
        });
      }

      if (buttonInt.customId.startsWith("song_input_modal_")) {
        logDebug("AddHandler", "Starting modal show process");
        // Không defer reply ở đây vì sẽ show modal
        await this.showSongInputModal(buttonInt, client, playlistId, language, handler);
        // Stop collectors sau khi show modal
        buttonCollector.stop();
        messageCollector?.stop();
      }
    });

    // Handle mention message
    messageCollector?.on("collect", async (message) => {
      logDebug("AddHandler", "Message collected from user", { userId: message.author.id });
      const input = message.content
        .replace(new RegExp(`<@!?${client.user?.id}>`, 'g'), '') // Xóa mention
        .trim();
      
      try {
        await message.delete();
      } catch (error) {
        // Ignore delete errors
      }

      if (input) {
        logDebug("AddHandler", "Processing search with input", { input });
        // Stop collectors trước khi xử lý để tránh duplicate
        buttonCollector.stop();
        messageCollector?.stop();
        await this.searchAndAddToPlaylist(client, handler, playlistId, input, language);
      }
    });

    // Handle timeout - chỉ timeout khi KHÔNG có interactions nào thành công
    const handleTimeout = async () => {
      const timeoutEmbed = new EmbedBuilder()
        .setDescription("⏰ Hết thời gian chờ! Vui lòng thử lại.")
        .setColor(client.color_main);

      try {
        await handler.editReply({
          embeds: [timeoutEmbed],
          components: [],
        });
      } catch (error) {
        logError("AddHandler", "Error handling timeout", { error });
      }
    };

    // Biến tracking state
    let hasProcessedInteraction = false;
    let collectorsEnded = 0;

    buttonCollector.on("end", async (collected) => {
      collectorsEnded++;
      logDebug("AddHandler", "Button collector ended", { 
        collectedSize: collected.size, 
        totalEnded: collectorsEnded 
      });
      
      if (collected.size > 0) {
        hasProcessedInteraction = true;
      }
      
      // Chỉ timeout khi cả 2 collectors đã end và không có interaction nào thành công
      if (collectorsEnded === 2 && !hasProcessedInteraction) {
        logDebug("AddHandler", "Both collectors ended with no interactions, triggering timeout");
        await handleTimeout();
      }
    });

    messageCollector?.on("end", async (collected) => {
      collectorsEnded++;
      logDebug("AddHandler", "Message collector ended", { 
        collectedSize: collected.size, 
        totalEnded: collectorsEnded 
      });
      
      if (collected.size > 0) {
        hasProcessedInteraction = true;
      }
      
      // Chỉ timeout khi cả 2 collectors đã end và không có interaction nào thành công
      if (collectorsEnded === 2 && !hasProcessedInteraction) {
        logDebug("AddHandler", "Both collectors ended with no interactions, triggering timeout");
        await handleTimeout();
      }
    });
  }

  private async showSongInputModal(
    interaction: ButtonInteraction, 
    client: Manager, 
    playlistId: string, 
    language: string,
    originalHandler: CommandHandler
  ) {
    const modal = new ModalBuilder()
      .setCustomId("song_input_modal")
      .setTitle("🎵 Nhập tên bài hát hoặc link");

    const songInput = new TextInputBuilder()
      .setCustomId("song_input")
      .setLabel("Tên bài hát hoặc link YouTube/Spotify")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Nhập tên bài hát hoặc paste link...")
      .setRequired(true)
      .setMaxLength(500);

    const actionRow = new ActionRowBuilder<TextInputBuilder>()
      .addComponents(songInput);

    modal.addComponents(actionRow);

    logDebug("AddHandler", "Showing modal for user", { userId: interaction.user.id });
    
    try {
      await interaction.showModal(modal);
      logDebug("AddHandler", "Modal shown successfully");
    } catch (showError) {
      logError("AddHandler", "Failed to show modal", { error: showError });
      return;
    }

    try {
      const modalSubmit = await interaction.awaitModalSubmit({
        time: 120000, // Giảm xuống 2 phút
        filter: (i) => i.customId === "song_input_modal" && i.user.id === interaction.user.id,
      });

      const input = modalSubmit.fields.getTextInputValue("song_input").trim();
      
      // Defer update để dismiss modal và update tin nhắn gốc
      await modalSubmit.deferUpdate();
      
      if (input) {
        await this.searchAndAddToPlaylist(client, originalHandler, playlistId, input, language);
      } else {
        await originalHandler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(client.i18n.get(language, "commands", "playlist.handler_errors.invalid_song_input"))
              .setColor(client.color_main),
          ],
        });
      }
      
    } catch (error) {
      // Modal timeout hoặc error
      logError("AddHandler", "Modal submit error", { error });
      
      // Thông báo timeout cho user qua original interaction
      try {
        await originalHandler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription("⏰ Hết thời gian chờ nhập liệu! Vui lòng thử lại.")
              .setColor(client.color_main),
          ],
          components: [],
        });
      } catch (editError) {
        logError("AddHandler", "Error editing reply after modal timeout", { error: editError });
      }
    }
  }

  private async showUrlConfirmation(
    client: Manager,
    interaction: StringSelectMenuInteraction | ModalSubmitInteraction,
    playlistId: string,
    result: any,
    language: string
  ) {
    const track = result.tracks[0];
    
    const confirmButton = new ButtonBuilder()
      .setCustomId(`confirm_add_${playlistId}`)
      .setLabel(client.i18n.get(language, "commands", "playlist.ui_elements.confirm_add_button"))
      .setStyle(ButtonStyle.Success);

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel_add")
      .setLabel(client.i18n.get(language, "commands", "playlist.ui_elements.cancel_button"))
      .setStyle(ButtonStyle.Secondary);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(confirmButton, cancelButton);

    const confirmEmbed = new EmbedBuilder()
      .setTitle("🎵 Xác nhận thêm bài hát")
      .setDescription(
        `**Bài hát tìm thấy:**\n` +
        `🎵 **Tên:** ${track.title}\n` +
        `👤 **Tác giả:** ${track.author}\n` +
        `⏱️ **Thời lượng:** ${this.formatDuration(track.duration)}\n\n` +
        `Bạn có muốn thêm bài hát này vào playlist không?`
      )
      .setColor(client.color_main)
      .setThumbnail(track.artworkUrl || null);

    const replyMessage = await interaction.editReply({
      embeds: [confirmEmbed],
      components: [buttonRow],
    });

    // Handle button confirmation - sử dụng replyMessage thay vì interaction.message
    const buttonCollector = replyMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000, // 5 phút
    });

    buttonCollector.on("collect", async (buttonInt: ButtonInteraction) => {
      if (buttonInt.user.id !== interaction.user.id) {
        return buttonInt.reply({
          content: client.i18n.get(language, "handlers", "unauthorized_user"),
          ephemeral: true,
        });
      }

      // Kiểm tra xem interaction đã được acknowledge chưa
      if (buttonInt.replied || buttonInt.deferred) {
        logInfo("AddHandler", "Button interaction already acknowledged, skipping...");
        return;
      }

      try {
        if (buttonInt.customId.startsWith("confirm_add_")) {
          await buttonInt.deferUpdate();
          // Stop collector để tránh multiple interactions
          buttonCollector.stop("confirmed");
          await this.addTrackToPlaylist(client, interaction, playlistId, track, language);
        } else if (buttonInt.customId === "cancel_add") {
          await buttonInt.deferUpdate();
          // Stop collector để tránh multiple interactions
          buttonCollector.stop("cancelled");
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(client.i18n.get("vi", "commands", "playlist.status.cancelled_add"))
                .setColor(client.color_main),
            ],
            components: [],
          });
        }
      } catch (error) {
        logError("AddHandler", "Error in button interaction", { error });
        return;
      }
    });

    buttonCollector.on("end", async (collected) => {
      if (collected.size === 0) {
        await interaction.editReply({
          components: [],
        });
      }
    });
  }

  private async showSearchResults(
    client: Manager,
    interaction: StringSelectMenuInteraction | ModalSubmitInteraction,
    playlistId: string,
    result: any,
    query: string,
    language: string
  ) {
    const tracks = result.tracks.slice(0, 25); // Discord limit 25 options
    
    const options = tracks.map((track: any, index: number) => {
      const duration = this.formatDuration(track.duration);
      const separator = " • ";
      const maxDescLength = 100;
      const maxAuthorLength = maxDescLength - duration.length - separator.length;
      
      let author = track.author;
      if (author.length > maxAuthorLength) {
        author = author.substring(0, maxAuthorLength - 3) + "...";
      }
      
      return new StringSelectMenuOptionBuilder()
        .setLabel(`${track.title}`.substring(0, 100))
        .setDescription(`${author}${separator}${duration}`)
        .setValue(`track_${index}`);
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_search_result")
      .setPlaceholder("Chọn bài hát muốn thêm...")
      .addOptions(options);

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const resultsEmbed = new EmbedBuilder()
      .setTitle("🔍 Kết quả tìm kiếm")
      .setDescription(
        `**Tìm kiếm:** \`${query}\`\n` +
        `**Tìm thấy:** ${tracks.length} bài hát\n\n` +
        `Vui lòng chọn bài hát muốn thêm vào playlist:`
      )
      .setColor(client.color_main);

    const replyMessage = await interaction.editReply({
      embeds: [resultsEmbed],
      components: [actionRow],
    });

    // Handle selection - sử dụng replyMessage thay vì interaction.message
    const selectCollector = replyMessage.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 300000,
    });

    selectCollector.on("collect", async (selectInt: StringSelectMenuInteraction) => {
      if (selectInt.user.id !== interaction.user.id) {
        return selectInt.reply({
          content: client.i18n.get(language, "handlers", "unauthorized_user"),
          ephemeral: true,
        });
      }

      // Kiểm tra xem interaction đã được acknowledge chưa
      if (selectInt.replied || selectInt.deferred) {
        logInfo("AddHandler", "Track selection interaction already acknowledged, skipping...");
        return;
      }

      try {
        await selectInt.deferUpdate();
      } catch (error) {
        logError("AddHandler", "Error deferring track selection update", { error });
        return;
      }
      
      // Stop collector để tránh multiple interactions
      selectCollector.stop("track_selected");
      
      const selectedIndex = parseInt(selectInt.values[0].replace("track_", ""));
      const selectedTrack = tracks[selectedIndex];
      
      if (selectedTrack) {
        await this.addTrackToPlaylist(client, interaction, playlistId, selectedTrack, language);
      }
    });

    selectCollector.on("end", async (collected) => {
      if (collected.size === 0) {
        await interaction.editReply({
          components: [],
        });
      }
    });
  }

  private async addTrackToPlaylist(
    client: Manager,
    interaction: StringSelectMenuInteraction | ModalSubmitInteraction,
    playlistId: string,
    track: any,
    language: string
  ) {
    // Lấy thông tin playlist
    const playlist = await client.db.playlist.get(playlistId);
    if (!playlist) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(client.i18n.get("vi", "commands", "playlist.errors.playlist_not_found"))
            .setColor(client.color_main),
        ],
      });
    }

    // Kiểm tra ownership
    if (playlist.owner !== interaction.user.id) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(client.i18n.get("vi", "commands", "playlist.errors.not_owner"))
            .setColor(client.color_main),
        ],
      });
    }

    // Kiểm tra giới hạn track
    const limitTrack = playlist.tracks.length + 1;
    if (limitTrack > client.config.features.LIMIT_TRACK) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`❌ Vượt quá giới hạn ${client.config.features.LIMIT_TRACK} bài hát trong playlist!`)
            .setColor(client.color_main),
        ],
      });
    }

    // Thêm track vào playlist
    await client.db.playlist.push(`${playlistId}.tracks`, {
      title: track.title,
      uri: track.uri,
      length: track.duration,
      thumbnail: track.artworkUrl,
      author: track.author,
      requester: track.requester || interaction.user,
    });

    // Thông báo thành công
    const successEmbed = new EmbedBuilder()
      .setTitle(client.i18n.get("vi", "commands", "playlist.success.song_added"))
      .setDescription(
        `**Bài hát:** ${track.title}\n` +
        `**Tác giả:** ${track.author}\n` +
        `**Thời lượng:** ${this.formatDuration(track.duration)}\n` +
        `**Đã thêm vào:** ${playlist.name} (||\`${playlistId}\`||)`
      )
      .setColor(client.color_main)
      .setThumbnail(track.artworkUrl || null);

    await interaction.editReply({
      embeds: [successEmbed],
      components: [],
    });
  }

  private formatDuration(duration: number): string {
    if (!duration) return "N/A";
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  public async autocomplete(client: Manager, interaction: AutocompleteInteraction, language: string) {
    let choice: any[] = [];
    const url = String(interaction.options.getString("search"));
    const Random = client.config.features.AUTOCOMPLETE_SEARCH[Math.floor(Math.random() * client.config.features.AUTOCOMPLETE_SEARCH.length)];

    const match = client.REGEX.some((match) => {
      return match.test(url) == true;
    });

    if (match == true) {
      choice.push({ name: url, value: url });
      await (interaction as AutocompleteInteraction).respond(choice).catch(() => {});
      return;
    }

    if (client.lavalinkUsing.length == 0) {
      choice.push({
        name: `${client.i18n.get(language, "commands.playlist", "pl_error_no_node")}`,
        value: `${client.i18n.get(language, "commands.playlist", "pl_error_no_node")}`,
      });
      return;
    }

    const engines = client.config.features.PLAY_COMMAND_ENGINE;
    const randomEngine = engines[Math.floor(Math.random() * engines.length)];

    const searchRes = await client.Zklink.search(url || Random, {
      engine: randomEngine,
    });

    if (searchRes.tracks.length == 0 || !searchRes.tracks) {
      return choice.push({
        name: "Lỗi: không tìm thấy bài hát phù hợp",
        value: url,
      });
    }

    for (let i = 0; i < 10; i++) {
      const x = searchRes.tracks[i];
      choice.push({
        name: x && x.title ? x.title : "Tên bài hát không xác định",
        value: x && x.uri ? x.uri : url,
      });
    }

    await (interaction as AutocompleteInteraction).respond(choice).catch(() => {});
  }

  private async handleAddSongSimple(
    client: Manager, 
    handler: CommandHandler, 
    playlistId: string, 
    language: string
  ) {
    // Lấy thông tin playlist để hiển thị tên
    const playlist = await client.db.playlist.get(playlistId);
    if (!playlist) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("Không tìm thấy playlist")
            .setColor(client.color_main),
        ],
      });
    }

    // Hiển thị form nhập đơn giản
    const embed = new EmbedBuilder()
      .setAuthor({
        name: `Thêm bài hát vào: ${playlist.name}`,
        iconURL: client.user?.displayAvatarURL(),
      })
      .setDescription(
        "🎵 **Nhập tên bài hát hoặc link:**\n\n" +
        "Gõ tên bài hát hoặc paste link YouTube/Spotify trong chat\n" +
        "⏰ Bạn có **60 giây** để nhập"
      )
      .setColor(client.color_main)
      .setFooter({ text: `Playlist ID: ${playlistId}` });

    await handler.editReply({
      embeds: [embed],
      components: [],
    });

    // Collector cho message
    const messageCollector = handler.interaction.channel?.createMessageCollector({
      filter: (m) => m.author.id === handler.user?.id && !m.interaction,
      max: 1,
      time: 60000,
    });

    messageCollector?.on("collect", async (msg) => {
      // Xóa tin nhắn của user
      try {
        await msg.delete();
      } catch (error) {
        logInfo("AddHandler", "Could not delete user message", { error });
      }

      const input = msg.content.trim();
      if (input) {
        await this.searchAndAddToPlaylist(client, handler, playlistId, input, language);
      }
    });

    messageCollector?.on("end", async (collected) => {
      if (collected.size === 0) {
        await handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription("⏰ Hết thời gian! Vui lòng thử lại.")
              .setColor(client.color_main),
          ],
          components: [],
        });
      }
    });
  }

  private async searchAndAddToPlaylist(
    client: Manager, 
    handler: CommandHandler, 
    playlistId: string, 
    input: string, 
    language: string
  ) {
    // Hiển thị loading
    await handler.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription("🔍 Đang tìm kiếm bài hát...")
          .setColor(client.color_main),
      ],
    });

    try {
      const result = await client.Zklink.search(input, {
        requester: handler.user,
      });

      if (!result || !result.tracks || result.tracks.length === 0) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`❌ Không tìm thấy bài hát nào với từ khóa: \`${input}\``)
              .setColor(client.color_main),
          ],
        });
      }

      // Kiểm tra xem có phải là URL không
      const isUrl = input.includes("youtube.com") || 
                    input.includes("youtu.be") || 
                    input.includes("spotify.com") ||
                    input.includes("soundcloud.com") ||
                    input.startsWith("http");

      if (isUrl || result.tracks.length === 1) {
        // Nếu là URL hoặc chỉ có 1 kết quả → thêm trực tiếp
        await this.addSingleTrackToPlaylist(client, handler, playlistId, result.tracks[0]);
      } else {
        // Nếu là từ khóa tìm kiếm → hiển thị dropdown để chọn
        await this.showSearchResultsDropdown(client, handler, playlistId, result.tracks, input);
      }

    } catch (error) {
      logError("AddHandler", "Error searching/adding song", { error });
      await handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Có lỗi xảy ra khi tìm kiếm bài hát!")
            .setColor(client.color_main),
        ],
      });
    }
  }

  private async addSingleTrackToPlaylist(
    client: Manager, 
    handler: CommandHandler, 
    playlistId: string, 
    track: any
  ) {
    // Thêm vào playlist
    await client.db.playlist.push(`${playlistId}.tracks`, {
      title: track.title,
      uri: track.uri,
      length: track.duration,
      thumbnail: track.artworkUrl,
      author: track.author,
      requester: handler.user,
    });

    // Thông báo thành công
    const successEmbed = new EmbedBuilder()
      .setAuthor({
        name: "Đã thêm bài hát vào playlist!",
        iconURL: client.user?.displayAvatarURL(),
      })
      .setDescription(
        `**Bài hát:** [${track.title}](${track.uri})\n` +
        `**Tác giả:** ${track.author}\n` +
        `**Thời lượng:** ${new ConvertTime().parse(track.duration || 0)}`
      )
      .setThumbnail(track.artworkUrl || null)
      .setColor(client.color_main)
      .setTimestamp();

    await handler.editReply({
      embeds: [successEmbed],
    });
  }

  private async showSearchResultsDropdown(
    client: Manager, 
    handler: CommandHandler, 
    playlistId: string, 
    tracks: any[], 
    searchQuery: string
  ) {
    // Tạo dropdown với tối đa 25 kết quả
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("search_result_select")
      .setPlaceholder("Chọn bài hát để thêm vào playlist...")
      .setMinValues(1)
      .setMaxValues(1);

    const displayTracks = tracks.slice(0, 25);
    for (let i = 0; i < displayTracks.length; i++) {
      const track = displayTracks[i];
      const duration = new ConvertTime().parse(track.duration || 0);
      const separator = " • ";
      const maxDescLength = 100;
      const maxAuthorLength = maxDescLength - duration.length - separator.length;
      
      let author = track.author;
      if (author.length > maxAuthorLength) {
        author = author.substring(0, maxAuthorLength - 3) + "...";
      }
      
      const option = new StringSelectMenuOptionBuilder()
        .setLabel(track.title.length > 100 ? track.title.substring(0, 97) + "..." : track.title)
        .setValue(String(i))
        .setDescription(`${author}${separator}${duration}`);
      
      selectMenu.addOptions(option);
    }

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `🔍 Kết quả tìm kiếm: ${searchQuery}`,
        iconURL: client.user?.displayAvatarURL(),
      })
      .setDescription(
        `Tìm thấy **${tracks.length}** kết quả. Chọn bài hát bạn muốn thêm:\n\n` +
        `⏰ Bạn có **60 giây** để chọn`
      )
      .setColor(client.color_main)
      .setFooter({ text: `Hiển thị ${displayTracks.length}/${tracks.length} kết quả` });

    const message = await handler.editReply({
      embeds: [embed],
      components: [row],
    });

    // Tạo collector để lắng nghe selection
    const collector = message.createMessageComponentCollector({
      filter: (interaction) => interaction.user.id === handler.user?.id,
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "search_result_select" && interaction.isStringSelectMenu()) {
        // Kiểm tra xem interaction đã được acknowledge chưa
        if (interaction.replied || interaction.deferred) {
          logInfo("AddHandler", "Search result interaction already acknowledged, skipping...");
          return;
        }

        try {
          await interaction.deferUpdate();
        } catch (error) {
          logError("AddHandler", "Error deferring search result update", { error });
          return;
        }

        // Stop collector để tránh multiple interactions
        collector.stop("track_selected");
        
        const selectedIndex = parseInt(interaction.values[0]);
        const selectedTrack = displayTracks[selectedIndex];

        if (!selectedTrack) {
          return handler.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription("❌ Không tìm thấy bài hát đã chọn!")
                .setColor(client.color_main),
            ],
            components: [],
          });
        }

        // Disable dropdown sau khi chọn
        selectMenu.setDisabled(true);
        const disabledRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

        await this.addSingleTrackToPlaylist(client, handler, playlistId, selectedTrack);
        
        // Update components để disable dropdown
        await interaction.editReply({ 
          components: [disabledRow] 
        });
      }
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time" && collected.size === 0) {
        selectMenu.setDisabled(true);
        const disabledRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
        
        try {
          await handler.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription("⏰ Hết thời gian! Vui lòng thử lại.")
                .setColor(client.color_main),
            ],
            components: [disabledRow],
          });
        } catch (error) {
          logError("AddHandler", "Error updating timeout message", { error });
        }
      }
    });
  }
}
