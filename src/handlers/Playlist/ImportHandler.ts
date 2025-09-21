import { 
  EmbedBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder, 
  ActionRowBuilder, 
  ComponentType,
  StringSelectMenuInteraction
} from "discord.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { ZklinkSearchResultType, ZklinkTrack } from "../../Zklink/main.js";
import { logInfo, logDebug, logWarn, logError } from "../../utilities/Logger.js";

const data: Config = new ConfigData().data;

export class PlaylistImportHandler {
  public async execute(client: Manager, handler: CommandHandler) {
    // Lấy tất cả playlists của user
    const userPlaylists = await client.db.playlist.all();
    const userPlaylistsFiltered = userPlaylists.filter(
      (playlist) => playlist.value.owner === handler.user?.id
    );

    if (!userPlaylistsFiltered || userPlaylistsFiltered.length === 0) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Bạn chưa có playlist nào!")
            .setColor(client.color_main),
        ],
      });
    }

    // Tạo dropdown với các playlist options
    const playlistOptions = userPlaylistsFiltered.slice(0, 25).map((playlist) => // Discord giới hạn 25 options
      new StringSelectMenuOptionBuilder()
        .setLabel(`${playlist.value.name} (${playlist.value.tracks?.length || 0} bài)`)
        .setDescription(`Phát nhạc từ playlist này`)
        .setValue(playlist.id)
    );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("playlist_select_import")
      .setPlaceholder("Chọn playlist để phát nhạc...")
      .addOptions(playlistOptions);

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setTitle("🎵 Phát nhạc từ playlist")
      .setDescription("Vui lòng chọn playlist mà bạn muốn phát nhạc:")
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
          content: "❌ Bạn không thể sử dụng menu này!",
          ephemeral: true,
        });
      }

      const selectedPlaylistId = interaction.values[0];

      // Disable dropdown ngay lập tức để tránh multiple selections
      const disabledSelectMenu = selectMenu.setDisabled(true);
      const disabledActionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(disabledSelectMenu);

      // Update message với dropdown disabled
      await handler.editReply({
        embeds: [embed],
        components: [disabledActionRow],
      });

      // Defer reply cho interaction mới
      await interaction.deferReply({ ephemeral: true });

      // Gọi method để xử lý import playlist
      await this.handleImportPlaylist(client, interaction, selectedPlaylistId, handler.language);
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

  private async handleImportPlaylist(
    client: Manager, 
    interaction: StringSelectMenuInteraction, 
    playlistId: string, 
    language: string
  ) {
    const playlist = await client.db.playlist.get(playlistId);

    if (!playlist) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Không tìm thấy playlist!")
            .setColor(client.color_main),
        ],
      });
    }

    if (playlist.owner !== interaction.user.id) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Bạn không phải chủ sở hữu playlist này!")
            .setColor(client.color_main),
        ],
      });
    }

    // Kiểm tra user có trong voice channel không  
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member?.voice.channel) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Bạn cần vào voice channel để phát nhạc!")
            .setColor(client.color_main),
        ],
      });
    }

    // Kiểm tra playlist có tracks không
    if (!playlist.tracks || playlist.tracks.length === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Playlist này không có bài hát nào!")
            .setColor(client.color_main),
        ],
      });
    }

    // Tạo hoặc lấy player
    let player = client.Zklink.players.get(interaction.guild!.id);
    
    if (!player) {
      player = await client.Zklink.create({
        guildId: interaction.guild!.id,
        voiceId: member.voice.channel.id,
        textId: interaction.channel!.id,
        shardId: interaction.guild?.shardId ?? 0,
        nodeName: (await client.Zklink.nodes.getLeastUsed()).options.name,
        deaf: true,
        mute: false,
        region: member.voice.channel.rtcRegion ?? undefined,
        volume: client.config.bot.DEFAULT_VOLUME ?? 100,
      });
    }

    // Add tất cả tracks vào queue
    const tracks = playlist.tracks;
    let addedCount = 0;

    logDebug("PlaylistImportHandler", `Starting to add ${tracks.length} tracks to queue`);

    for (const trackData of tracks) {
      try {
        logDebug("PlaylistImportHandler", `Searching track "${trackData.title}" with URI: ${trackData.uri}`);
        
        // Tìm kiếm track để lấy đầy đủ thông tin
        const searchResult = await client.Zklink.search(trackData.uri, {
          requester: interaction.user,
        });

        logDebug("PlaylistImportHandler", `Search result - Found ${searchResult.tracks?.length || 0} tracks, Type: ${searchResult.type}`);

        if (searchResult.tracks && searchResult.tracks.length > 0) {
          const track = searchResult.tracks[0];
          logDebug("PlaylistImportHandler", `Adding track "${track.title}" to queue`);
          
          // Thử cả 2 cách add track
          try {
            if (addedCount === 0) {
              // Track đầu tiên - set làm current
              logDebug("PlaylistImportHandler", "Setting first track as current");
              player.queue.current = track;
              logDebug("PlaylistImportHandler", "Current track set successfully");
            } else {
              // Các track khác - add vào queue
              logDebug("PlaylistImportHandler", "Adding to queue");
              player.queue.add(track);
            }
          } catch (addError) {
            logError("PlaylistImportHandler", "Error adding track", { addError });
          }
          
          logDebug("PlaylistImportHandler", `Queue size after add: ${player.queue.size}`);
          logDebug("PlaylistImportHandler", `Queue length: ${player.queue.length}`);
          logDebug("PlaylistImportHandler", `Has current track: ${!!player.queue.current}`);
          
          addedCount++;
        } else {
          logDebug("PlaylistImportHandler", `No tracks found for "${trackData.title}"`);
        }
      } catch (error) {
        logError("PlaylistImportHandler", `Không thể thêm track "${trackData.title}"`, { error });
      }
    }

    logDebug("PlaylistImportHandler", `Finished adding tracks. Added: ${addedCount}, Queue size: ${player.queue.size}`);

    // Kiểm tra có tracks không (current track hoặc queue)
    const hasMusic = player.queue.current || player.queue.size > 0;
    logDebug("PlaylistImportHandler", `Has music to play: ${hasMusic}`);
    
    if (!hasMusic) {
      logError("PlaylistImportHandler", "No music available to play!");
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Không thể thêm bài hát vào queue!")
            .setColor(client.color_main),
        ],
      });
    }

    // Phát nhạc - luôn luôn gọi play() để ensure player starts
    logDebug("PlaylistImportHandler", `Player state - Playing: ${player.playing}, Paused: ${player.paused}, Has current: ${!!player.queue.current}`);
    
    try {
      logDebug("PlaylistImportHandler", "Calling player.play()...");
      await player.play();
      logDebug("PlaylistImportHandler", "Player.play() completed");
    } catch (playError) {
      logError("PlaylistImportHandler", "Error calling player.play()", { playError });
    }

    const embed = new EmbedBuilder()
      .setDescription(
        `✅ Đã thêm **${addedCount}** bài hát từ playlist **${playlist.name}** vào hàng đợi!`
      )
      .setColor(client.color_main);

    await interaction.editReply({ embeds: [embed] });
  }
}
