import { 
  EmbedBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder, 
  ActionRowBuilder 
} from "discord.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ZklinkTrack } from "../../Zklink/main.js";
import { logInfo, logDebug, logWarn, logError } from "../../utilities/Logger.js";

export class PlaylistSaveQueueHandler {
  public async execute(client: Manager, handler: CommandHandler) {
    const player = client.Zklink.players.get(handler.guild!.id);

    if (!player)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.playlist", "pl_savequeue_no_player")}`
            )
            .setColor(client.color_main),
        ],
      });

    const queue = player.queue.map((track) => track) || [];
    const current = player.queue.current;

    if (queue.length == 0 && !current)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.playlist", "pl_savequeue_no_tracks")}`
            )
            .setColor(client.color_main),
        ],
      });

    // Lấy danh sách playlist của user
    const fullList = await client.db.playlist.all();
    const userPlaylists = fullList.filter((data) => {
      return data.value.owner == handler.user?.id;
    });

    if (userPlaylists.length === 0) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.playlist", "pl_savequeue_no_playlists")}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    // Tạo dropdown menu để chọn playlist
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("savequeue_playlist_select")
      .setPlaceholder("Chọn playlist để lưu hàng đợi...")
      .setMinValues(1)
      .setMaxValues(1);

    // Thêm options vào dropdown (tối đa 25)
    const displayPlaylists = userPlaylists.slice(0, 25);
    for (const playlist of displayPlaylists) {
      const option = new StringSelectMenuOptionBuilder()
        .setLabel(playlist.value.name)
        .setValue(playlist.value.id)
        .setDescription(`${playlist.value.tracks.length} bài | ${playlist.value.private ? 'Riêng tư' : 'Công khai'}`);
      
      selectMenu.addOptions(option);
    }

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setDescription(
        `${client.i18n.get(handler.language, "commands.playlist", "pl_savequeue_select_playlist", {
          current: current?.title || "Không có",
          queue: String(queue.length || 0)
        })}`
      )
      .setColor(client.color_main);

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
      if (interaction.customId === "savequeue_playlist_select" && interaction.isStringSelectMenu()) {
        await interaction.deferUpdate();
        
        const selectedPlaylistId = interaction.values[0];
        const selectedPlaylist = userPlaylists.find(p => p.value.id === selectedPlaylistId);

        if (!selectedPlaylist) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(`${client.i18n.get(handler.language, "commands.playlist", "pl_savequeue_notfound")}`)
                .setColor(client.color_main),
            ],
            components: [],
          });
        }

        // Disable dropdown sau khi chọn
        selectMenu.setDisabled(true);
        const disabledRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

        await this.mergeTracksToPlaylist(client, handler, interaction, selectedPlaylist, current, queue);
        
        await interaction.editReply({ components: [disabledRow] });
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
                .setDescription(`${client.i18n.get(handler.language, "commands.playlist", "pl_timeout")}`)
                .setColor(client.color_main),
            ],
            components: [disabledRow],
          });
        } catch (error) {
          logError("PlaylistSaveQueueHandler", "Error updating timeout message", { error });
        }
      }
    });
  }

  private async mergeTracksToPlaylist(
    client: Manager, 
    handler: CommandHandler, 
    interaction: any, 
    selectedPlaylist: any, 
    current: ZklinkTrack | null, 
    queue: ZklinkTrack[]
  ) {
    const playlist = selectedPlaylist.value;
    const TrackAdd: ZklinkTrack[] = [];
    const TrackExist: string[] = [];

    // Thêm bài đang phát và hàng đợi
    if (current) TrackAdd.push(current);
    if (queue && queue.length > 0) TrackAdd.push(...queue);

    // Lấy danh sách URI đã tồn tại trong playlist
    if (playlist.tracks) {
      for (let i = 0; i < playlist.tracks.length; i++) {
        const element = playlist.tracks[i].uri;
        TrackExist.push(element);
      }
    }

    // Lọc tracks mới (không trùng lặp)
    const Result = TrackAdd.filter((track) => !TrackExist.includes(String(track.uri)));

    if (Result.length == 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.playlist", "pl_savequeue_no_new_saved", {
                name: playlist.name,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    // Lưu tracks mới vào playlist
    try {
      for (const track of Result) {
        await client.db.playlist.push(`${playlist.id}.tracks`, {
          title: track.title,
          uri: track.uri,
          length: track.duration,
          thumbnail: track.artworkUrl,
          author: track.author,
          requester: track.requester,
        });
      }

      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "commands.playlist", "pl_savequeue_saved", {
            name: playlist.name,
            tracks: String(Result.length),
          })}`
        )
        .setColor(client.color_main);

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logError("PlaylistSaveQueueHandler", "Error saving tracks to playlist", { error });
      
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.playlist", "pl_savequeue_error")}`
            )
            .setColor(client.color_main),
        ],
      });
    }
  }
}