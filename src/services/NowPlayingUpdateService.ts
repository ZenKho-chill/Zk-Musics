import { Manager } from "../manager.js";
import { EmbedBuilder, Message, User } from "discord.js";
import { FormatDuration } from "../utilities/FormatDuration.js";
import { ProgressBar } from "../utilities/ProgressBar.js";
import { ZklinkPlayer, ZklinkTrack } from "../Zklink/main.js";
import { log } from "../utilities/LoggerHelper.js";


interface NowPlayingUpdate {
  guildId: string;
  channelId: string;
  messageId: string;
  trackId: string;
  lastProgressPercent: number;
  interval: NodeJS.Timeout;
  language: string;
  lastUpdate: number; // Timestamp của lần cập nhật cuối
  isUpdating: boolean; // Flag để tránh cập nhật đồng thời
  cachedTrackInfo?: { // Cache thông tin track để tránh tính toán lại
    title: string;
    author: string;
    duration: string;
    thumbnail: string;
    requesterName: string;
    requesterAvatar: string;
    source: string;
  };
}

export class NowPlayingUpdateService {
  private static instance: NowPlayingUpdateService;
  private updates: Map<string, NowPlayingUpdate> = new Map();

  static getInstance(): NowPlayingUpdateService {
    if (!this.instance) {
      this.instance = new NowPlayingUpdateService();
    }
    return this.instance;
  }

  /**
   * Bắt đầu theo dõi và cập nhật nowplaying cho một guild
   */
  public startTracking(
    client: Manager,
    guildId: string,
    channelId: string,
    messageId: string,
    trackId: string,
    language: string
  ): void {
    // Dừng tracking cũ nếu có
    this.stopTracking(guildId);

    const interval = setInterval(() => {
      this.updateNowPlaying(client, guildId);
    }, 5000); // Kiểm tra mỗi 5 giây để giảm lag

    this.updates.set(guildId, {
      guildId,
      channelId,
      messageId,
      trackId,
      lastProgressPercent: 0,
      interval,
      language,
      lastUpdate: 0,
      isUpdating: false,
    });

    log.debug("Debug bắt đầu tracking nowplaying", `Guild: ${guildId} | Channel: ${channelId} | Message: ${messageId}`);
  }

  /**
   * Dừng theo dõi nowplaying cho một guild
   */
  public stopTracking(guildId: string): void {
    const update = this.updates.get(guildId);
    if (update) {
      clearInterval(update.interval);
      this.updates.delete(guildId);
      log.debug("Debug dừng tracking nowplaying", `Guild: ${guildId}`);
    }
  }

  /**
   * Xóa message nowplaying khi bài hát kết thúc
   */
  public async deleteNowPlaying(client: Manager, guildId: string): Promise<void> {
    const update = this.updates.get(guildId);
    if (!update) {
      log.debug("Debug không có nowplaying tracking, bỏ qua việc xóa", `Guild: ${guildId}`);
      return;
    }

    try {
      const channel = await client.channels.fetch(update.channelId);
      if (channel?.isTextBased()) {
        const message = await channel.messages.fetch(update.messageId);
        await message.delete();
        log.debug("Debug đã xóa nowplaying message", `Guild: ${guildId} | Channel: ${update.channelId}`);
      }
    } catch (error: any) {
      // Không log warning nếu message đã bị xóa (lỗi 10008: Unknown Message)
      if (error.code !== 10008) {
        log.warn("Cảnh báo lỗi khi xóa nowplaying message", `Guild: ${guildId}`, error);
      } else {
        log.debug("Debug nowplaying message đã được xóa trước đó", `Guild: ${guildId}`);
      }
    }

    // Dừng tracking và xóa khỏi map để tránh duplicate calls
    this.stopTracking(guildId);
  }

  /**
   * Cập nhật nowplaying message
   */
  private async updateNowPlaying(client: Manager, guildId: string): Promise<void> {
    const update = this.updates.get(guildId);
    if (!update || update.isUpdating) return; // Tránh cập nhật đồng thời

    const player = client.Zklink.players.get(guildId) as ZklinkPlayer;
    if (!player || !player.queue.current) {
      // Không có player hoặc bài hát, xóa message
      await this.deleteNowPlaying(client, guildId);
      return;
    }

    const currentTrack = player.queue.current;
    
    // Kiểm tra nếu bài hát đã thay đổi
    if (currentTrack.identifier !== update.trackId) {
      // Bài hát mới, xóa message cũ
      await this.deleteNowPlaying(client, guildId);
      return;
    }

    // Kiểm tra nếu bài hát đã kết thúc
    if (player.position >= currentTrack.duration) {
      await this.deleteNowPlaying(client, guildId);
      return;
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - update.lastUpdate;
    
    // Tính phần trăm tiến độ
    const progressPercent = Math.floor((player.position / currentTrack.duration) * 100);
    
    // Chỉ cập nhật khi:
    // 1. Đạt mốc 5% tiến độ
    // 2. Đã qua ít nhất 3 giây từ lần cập nhật cuối (tránh spam)
    if (progressPercent - update.lastProgressPercent >= 5 && timeSinceLastUpdate >= 3000) {
      update.isUpdating = true; // Set flag để tránh cập nhật đồng thời
      
      try {
        const channel = await client.channels.fetch(update.channelId);
        if (channel?.isTextBased()) {
          const message = await channel.messages.fetch(update.messageId);
          const embed = this.createNowPlayingEmbed(client, player, currentTrack, update.language);
          
          // Sử dụng setTimeout để tránh block main thread
          setTimeout(async () => {
            try {
              await message.edit({ embeds: [embed] });
              update.lastProgressPercent = progressPercent;
              update.lastUpdate = now;
              log.debug("Debug cập nhật nowplaying progress", `Guild: ${guildId} | Progress: ${progressPercent}%`);
            } catch (error) {
              log.warn("Cảnh báo lỗi khi edit message", `Guild: ${guildId}`, error as Error);
            } finally {
              update.isUpdating = false;
            }
          }, 0);
        }
      } catch (error) {
        log.warn("Cảnh báo lỗi khi cập nhật nowplaying", `Guild: ${guildId}`, error as Error);
        update.isUpdating = false;
        // Nếu lỗi, dừng tracking
        this.stopTracking(guildId);
      }
    } else {
      // Reset flag nếu không cập nhật
      update.isUpdating = false;
    }
  }

  /**
   * Tạo embed nowplaying với caching để tối ưu performance
   */
  private createNowPlayingEmbed(
    client: Manager,
    player: ZklinkPlayer,
    song: ZklinkTrack,
    language: string
  ): EmbedBuilder {
    const update = this.updates.get(player.guildId);
    
    // Tạo cached track info nếu chưa có
    if (!update?.cachedTrackInfo) {
      const requester = song.requester as User;
      const requesterName = requester?.displayName || requester?.username || client.user?.username || "N/A";
      const requesterAvatarURL = requester?.displayAvatarURL() || client.user?.displayAvatarURL();
      
      const source = song.source || "unknown";
      let src = client.config.PLAYER_SOURCENAME.UNKNOWN;
      
      // Optimize source mapping
      const sourceMap: { [key: string]: string } = {
        youtube: client.config.PLAYER_SOURCENAME.YOUTUBE,
        spotify: client.config.PLAYER_SOURCENAME.SPOTIFY,
        tidal: client.config.PLAYER_SOURCENAME.TIDAL,
        soundcloud: client.config.PLAYER_SOURCENAME.SOUNDCLOUD,
        deezer: client.config.PLAYER_SOURCENAME.DEEZER,
        twitch: client.config.PLAYER_SOURCENAME.TWITCH,
        apple: client.config.PLAYER_SOURCENAME.APPLE_MUSIC,
        applemusic: client.config.PLAYER_SOURCENAME.APPLE_MUSIC,
        youtube_music: client.config.PLAYER_SOURCENAME.YOUTUBE_MUSIC,
        http: client.config.PLAYER_SOURCENAME.HTTP,
      };
      
      src = sourceMap[source] || client.config.PLAYER_SOURCENAME.UNKNOWN;
      
      if (update) {
        update.cachedTrackInfo = {
          title: this.getTitle(client, song),
          author: song.author,
          duration: new FormatDuration().parse(song.duration),
          thumbnail: source === "soundcloud" 
            ? (client.user?.displayAvatarURL() as string)
            : (song.artworkUrl ?? `https://img.youtube.com/vi/${song.identifier}/hqdefault.jpg`),
          requesterName: requesterName.toUpperCase(),
          requesterAvatar: requesterAvatarURL || "",
          source: src,
        };
      }
    }

    // Chỉ tính toán các giá trị thay đổi theo thời gian
    const position = player.position;
    const CurrentDuration = new FormatDuration().parse(position);
    const bar = ProgressBar(position, song.duration, 20);
    
    const cached = update?.cachedTrackInfo;
    if (!cached) {
      // Fallback nếu không có cache
      return this.createBasicEmbed(client, player, song, language);
    }

    const fieldDataGlobal = [
      {
        name: `${client.config.TRACKS_EMOJI.Author} ${cached.author} ♪`,
        value: `${client.config.TRACKS_EMOJI.Timers} **${cached.duration}**`,
        inline: true,
      },
      {
        name: `**${
          player.data.get("autoplay")
            ? `${client.config.TRACKS_EMOJI.Autoplay} Tự phát`
            : `${client.config.TRACKS_EMOJI.Volume} ${player.volume}%`
        }**`,
        value: `**${cached.source}**`,
        inline: true,
      },
      {
        name: `**Thời lượng hiện tại**`,
        value: `\`${CurrentDuration} / ${cached.duration}\n${bar}\``,
        inline: false,
      },
    ];

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${client.i18n.get(language, "commands.music", "nowplaying_title")}`,
      })
      .setColor(client.color_second)
      .setThumbnail(cached.thumbnail)
      .addFields(fieldDataGlobal)
      .setFooter({
        text: `Yêu cầu từ ${cached.requesterName}`,
        iconURL: cached.requesterAvatar,
      });

    if (cached.duration !== "Live Stream") {
      embed.setDescription(`**${cached.title}**`);
    }

    return embed;
  }

  /**
   * Tạo embed cơ bản không có cache (fallback)
   */
  private createBasicEmbed(
    client: Manager,
    player: ZklinkPlayer,
    song: ZklinkTrack,
    language: string
  ): EmbedBuilder {
    const position = player.position;
    const CurrentDuration = new FormatDuration().parse(position);
    const TotalDuration = new FormatDuration().parse(song.duration);
    const bar = ProgressBar(position, song.duration, 20);
    const requester = song.requester as User;
    const requesterName = requester?.displayName || requester?.username || client.user?.username || "N/A";
    const requesterAvatarURL = requester?.displayAvatarURL() || client.user?.displayAvatarURL();

    return new EmbedBuilder()
      .setAuthor({
        name: `${client.i18n.get(language, "commands.music", "nowplaying_title")}`,
      })
      .setColor(client.color_second)
      .setDescription(`**${this.getTitle(client, song)}**`)
      .addFields([
        {
          name: `**Thời lượng hiện tại**`,
          value: `\`${CurrentDuration} / ${TotalDuration}\n${bar}\``,
          inline: false,
        },
      ])
      .setFooter({
        text: `Yêu cầu từ ${requesterName.toUpperCase()}`,
        iconURL: requesterAvatarURL,
      });
  }

  /**
   * Tạo title cho bài hát
   */
  private getTitle(client: Manager, tracks: ZklinkTrack): string {
    const truncate = (str: string, maxLength: number): string =>
      str.length > maxLength ? str.substring(0, maxLength - 3) + "..." : str;
    const title = truncate(tracks.title, 25);
    const author = truncate(tracks.author, 15);
    const supportUrl = client.config.bot.SERVER_SUPPORT_URL;

    if (new FormatDuration().parse(tracks.duration) === "Live Stream") {
      return `${author}`;
    }

    if (client.config.features.HIDE_LINK) {
      return `\`${title}\` bởi \`${author}\``;
    } else if (client.config.features.REPLACE_LINK) {
      return `[\`${title}\`](${supportUrl}) bởi \`${author}\``;
    } else {
      return `[\`${title}\`](${tracks.uri || supportUrl}) bởi \`${author}\``;
    }
  }

  /**
   * Clear cache cho một guild khi bài hát mới bắt đầu
   */
  public clearCache(guildId: string): void {
    const update = this.updates.get(guildId);
    if (update && update.cachedTrackInfo) {
      delete update.cachedTrackInfo;
      log.debug("Debug đã clear cache nowplaying", `Guild: ${guildId}`);
    }
  }

  /**
   * Dừng tất cả tracking khi bot shutdown
   */
  public stopAllTracking(): void {
    for (const [guildId] of this.updates) {
      this.stopTracking(guildId);
    }
    log.debug("Debug đã dừng tất cả nowplaying tracking", `Stopped ${this.updates.size} trackings`);
  }
}