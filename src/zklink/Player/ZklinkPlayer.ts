import { PlayOptions, VoiceChannelOptions } from "../Interface/Player.js";
import { Zklink } from "../Zklink.js";
import { ZklinkNode } from "../Node/ZklinkNode.js";
import { ZklinkQueue } from "./ZklinkQueue.js";
import {
  ZklinkEvents,
  ZklinkFilterData,
  ZklinkLoopMode,
  ZklinkPlayerState,
  VoiceConnectState,
  VoiceState,
} from "../Interface/Constants.js";
import { ZklinkTrack } from "./ZklinkTrack.js";
import { UpdatePlayerInfo, UpdatePlayerOptions } from "../Interface/Rest.js";
import { ZklinkSearchOptions, ZklinkSearchResult } from "../Interface/Manager.js";
import { ZklinkPlugin } from "../Plugin/VoiceReceiver/Plugin.js";
import { ServerUpdate, StateUpdatePartial } from "../Interface/Connection.js";
import { EventEmitter } from "node:events";
import { ZklinkDatabase } from "../Utilities/ZklinkDatabase.js";
import { ZklinkFilter } from "./ZklinkFilter.js";
import { log } from "../../utilities/LoggerHelper.js";

export class ZklinkPlayer extends EventEmitter {
  /**
   * Lớp quản lý chính
   */
  public manager: Zklink;
  /**
   * Server lavalink đang được player sử dụng
   */
  public node: ZklinkNode;
  /**
   * ID guild của player
   */
  public guildId: string;
  /**
   * ID voice của player
   */
  public voiceId: string | null;
  /**
   * ID text của player
   */
  public textId: string;
  /**
   * Hàng đợi (queue) của player
   */
  public readonly queue: ZklinkQueue;
  /**
   * Cơ sở dữ liệu tạm của player, bạn có thể lưu gì đó ở đây giống Map
   */
  public readonly data: ZklinkDatabase<unknown>;
  /**
   * Player đang bị tạm dừng hay không
   */
  public paused: boolean;
  /**
   * Vị trí (position) hiện tại của track
   */
  public position: number;
  /**
   * Âm lượng hiện tại của player
   */
  public volume: number;
  /**
   * Player đang phát hay không
   */
  public playing: boolean;
  /**
   * Chế độ loop hiện tại của player
   */
  public loop: ZklinkLoopMode;
  /**
   * Trạng thái hiện tại của player
   */
  public state: ZklinkPlayerState;
  /**
   * Player có bị deaf hay không
   */
  public deaf: boolean;
  /**
   * Player có bị mute hay không
   */
  public mute: boolean;
  /**
   * ID của track hiện tại
   */
  public track: string | null;
  /**
   * Các hàm mở rộng dành cho driver
   */
  public functions: ZklinkDatabase<(...args: any) => unknown>;
  /**
   * ID shard chứa guild có voice channel đang kết nối
   */
  public shardId: number;
  /**
   * ID voice trước đó đã kết nối
   */
  public lastvoiceId: string | null;
  /**
   * ID session hiện tại
   */
  public sessionId: string | null;
  /**
   * Vùng (region) của voice channel đang kết nối
   */
  public region: string | null;
  /**
   * Vùng trước đó của voice channel
   */
  public lastRegion: string | null;
  /**
   * serverUpdate cache từ Lavalink
   */
  public serverUpdate: ServerUpdate | null;
  /**
   * Trạng thái kết nối voice
   */
  public voiceState: VoiceConnectState;
  /** @ignore */
  public sudoDestroy: boolean;
  public filter: ZklinkFilter;

  /**
   * Lớp xử lý player của Zklink
   * @param manager Quản lý Zklink
   * @param voiceOptions Tùy chọn voice (theo interface VoiceChannelOptions)
   * @param node Node hiện đang sử dụng
   */
  constructor(manager: Zklink, voiceOptions: VoiceChannelOptions, node: ZklinkNode) {
    super();
    this.manager = manager;
    this.guildId = voiceOptions.guildId;
    this.voiceId = voiceOptions.voiceId;
    this.shardId = voiceOptions.shardId;
    this.mute = voiceOptions.mute ?? false;
    this.deaf = voiceOptions.deaf ?? false;
    this.lastvoiceId = null;
    this.sessionId = null;
    this.region = null;
    this.lastRegion = null;
    this.serverUpdate = null;
    this.voiceState = VoiceConnectState.DISCONNECTED;
    this.node = node;
    this.guildId = voiceOptions.guildId;
    this.voiceId = voiceOptions.voiceId;
    this.textId = voiceOptions.textId;
    const customQueue =
      this.manager.ZklinkOptions.options!.structures &&
      this.manager.ZklinkOptions.options!.structures.queue;
    this.queue = customQueue
      ? new customQueue(this.manager, this)
      : new ZklinkQueue(this.manager, this);
    this.filter = new ZklinkFilter(this);
    this.data = new ZklinkDatabase<unknown>();
    this.paused = true;
    this.position = 0;
    this.volume = this.manager.ZklinkOptions.options!.defaultVolume!;
    this.playing = false;
    this.loop = ZklinkLoopMode.NONE;
    this.state = ZklinkPlayerState.DESTROYED;
    this.deaf = voiceOptions.deaf ?? false;
    this.mute = voiceOptions.mute ?? false;
    this.sudoDestroy = false;
    this.track = null;
    this.functions = new ZklinkDatabase<(...args: any) => unknown>();
    if (this.node.driver.playerFunctions.size !== 0) {
      this.node.driver.playerFunctions.forEach((data, index) => {
        this.functions.set(index, data.bind(null, this));
      });
    }
    if (voiceOptions.volume && voiceOptions.volume !== this.volume)
      this.volume = voiceOptions.volume;
  }

  /**
   * Gửi server update tới lavalink
   * @internal
   */
  public async sendServerUpdate(): Promise<void> {
    const playerUpdate = {
      guildId: this.guildId,
      playerOptions: {
        voice: {
          token: this.serverUpdate!.token,
          endpoint: this.serverUpdate!.endpoint,
          sessionId: this.sessionId!,
        },
      },
    };
    this.node.rest.updatePlayer(playerUpdate);
  }

  /**
   * Huỷ (destroy) player
   * @internal
   */
  public async destroy(): Promise<void> {
    this.checkDestroyed();
    this.sudoDestroy = true;
    
    // Lưu voice channel ID trước khi destroy để có thể xóa voice status
    const lastVoiceChannelId = this.voiceId;
    this.data.set("last-voice-channel-id", lastVoiceChannelId);
    
    this.clear(false);
    this.disconnect();
    const voiceReceiver = this.manager.plugins.get("Zklink-voiceReceiver") as ZklinkPlugin;
    if (voiceReceiver && this.node.driver.id.includes("nodelink"))
      voiceReceiver.close(this.guildId);
    this.node.rest.updatePlayer({
      guildId: this.guildId,
      playerOptions: {
        track: {
          encoded: null,
          length: 0,
        },
      },
    });
    this.node.rest.destroyPlayer(this.guildId);
    this.manager.players.delete(this.guildId);
    this.state = ZklinkPlayerState.DESTROYED;
    // Debug đã bị xóa - Player đã bị huỷ
    this.voiceId = "";
    // @ts-ignore
    this.manager.emit(ZklinkEvents.PlayerDestroy, this);
    this.sudoDestroy = false;
  }

  /**
   * Phát một track
   * @param track Track cần phát
   * @param options Tùy chọn phát
   * @returns ZklinkPlayer
   */
  public async play(track?: ZklinkTrack, options?: PlayOptions): Promise<ZklinkPlayer> {
    this.checkDestroyed();

    if (track && !(track instanceof ZklinkTrack)) throw new Error("track phải là một ZklinkTrack");

    if (!track && !this.queue.totalSize) throw new Error("Không có track nào để phát");

    if (!options || typeof options.replaceCurrent !== "boolean")
      options = { ...options, replaceCurrent: false };

    if (track) {
      if (!options.replaceCurrent && this.queue.current) this.queue.unshift(this.queue.current);
      this.queue.current = track;
    } else if (!this.queue.current) this.queue.current = this.queue.shift();

    if (!this.queue.current) throw new Error("Không có track nào để phát");

    const current = this.queue.current;

    let errorMessage: string | undefined;

    const resolveResult = await current
      .resolver(this.manager, { nodeName: this.node.options.name })
      .catch((e: any) => {
        errorMessage = e.message;
        return null;
      });

    if (!resolveResult || (resolveResult && !resolveResult.isPlayable)) {
      // @ts-ignore
      this.manager.emit(ZklinkEvents.TrackResolveError, this, current, errorMessage);
      // Debug đã bị xóa - Player lỗi khi resolve
      this.queue.current = null;
      // @ts-ignore
      this.queue.size ? await this.play() : this.manager.emit(ZklinkEvents.QueueEmpty, this);
      return this;
    }

    this.playing = true;
    this.track = current.encoded;

    const playerOptions: UpdatePlayerOptions = {
      track: {
        encoded: current.encoded,
        length: current.duration,
      },
      ...options,
      volume: this.volume,
    };

    if (playerOptions.paused) {
      this.paused = playerOptions.paused;
      this.playing = !this.paused;
    }
    if (playerOptions.position) this.position = playerOptions.position;

    this.node.rest.updatePlayer({
      guildId: this.guildId,
      noReplace: options?.noReplace ?? false,
      playerOptions,
    });

    return this;
  }

  /**
   * Đặt chế độ lặp (loop)
   * @param mode Chế độ loop
   * @returns ZklinkPlayer
   */
  public setLoop(mode: ZklinkLoopMode): ZklinkPlayer {
    this.checkDestroyed();
    this.loop = mode;
    return this;
  }

  /**
   * Tìm track trực tiếp từ player
   * @param query Link hoặc truy vấn tìm kiếm
   * @param options Tùy chọn tìm kiếm
   * @returns ZklinkSearchResult
   */
  public async search(query: string, options?: ZklinkSearchOptions): Promise<ZklinkSearchResult> {
    this.checkDestroyed();
    return await this.manager.search(query, options);
  }

  /**
   * Tạm dừng track
   * @returns ZklinkPlayer
   */
  public async pause(): Promise<ZklinkPlayer> {
    this.checkDestroyed();
    if (this.paused == true) return this;
    await this.node.rest.updatePlayer({
      guildId: this.guildId,
      playerOptions: {
        paused: true,
      },
    });
    this.paused = true;
    this.playing = false;
    // @ts-ignore
    this.manager.emit(ZklinkEvents.PlayerPause, this, this.queue.current);
    return this;
  }

  /**
   * Tiếp tục phát track
   * @returns ZklinkPlayer
   */
  public async resume(): Promise<ZklinkPlayer> {
    this.checkDestroyed();
    if (this.paused == false) return this;
    this.node.rest.updatePlayer({
      guildId: this.guildId,
      playerOptions: {
        paused: false,
      },
    });
    this.paused = false;
    this.playing = true;
    // @ts-ignore
    this.manager.emit(ZklinkEvents.PlayerResume, this, this.queue.current);
    return this;
  }

  /**
   * Tạm dừng hoặc tiếp tục track theo mode
   * @param mode Bật/tắt tạm dừng
   * @returns ZklinkPlayer
   */
  public async setPause(mode: boolean): Promise<ZklinkPlayer> {
    this.checkDestroyed();
    if (this.paused == mode) return this;
    await this.node.rest.updatePlayer({
      guildId: this.guildId,
      playerOptions: {
        paused: mode,
      },
    });
    this.paused = mode;
    this.playing = !mode;
    // @ts-ignore
    this.manager.emit(
      mode ? ZklinkEvents.PlayerPause : ZklinkEvents.PlayerResume,
      this,
      this.queue.current
    );
    return this;
  }

  /**
   * Phát lại track trước đó
   * @returns ZklinkPlayer
   */
  public async previous(): Promise<ZklinkPlayer> {
    this.checkDestroyed();
    const prevoiusData = this.queue.previous;
    const current = this.queue.current;
    const index = prevoiusData.length - 1;
    if (index === -1 || !current) return this;
    await this.play(prevoiusData[index]);
    this.queue.previous.splice(index, 1);
    return this;
  }

  /**
   * Lấy tất cả track trước đó
   * @returns ZklinkTrack[]
   */
  public getPrevious(): ZklinkTrack[] {
    this.checkDestroyed();
    return this.queue.previous;
  }

  /**
   * Bỏ qua track hiện tại
   * @returns ZklinkPlayer
   */
  public async skip(): Promise<ZklinkPlayer> {
    this.checkDestroyed();
    log.info("Track skipped", `Guild: ${this.guildId} | Track: ${this.queue.current?.title || 'Unknown'}`);
    this.node.rest.updatePlayer({
      guildId: this.guildId,
      playerOptions: {
        track: {
          encoded: null,
        },
      },
    });
    return this;
  }

  /**
   * Tua tới vị trí khác trong track
   * @param position Vị trí cần tua
   * @returns ZklinkPlayer
   */
  public async seek(position: number): Promise<ZklinkPlayer> {
    this.checkDestroyed();
    if (!this.queue.current) throw new Error("Player không có track hiện tại trong hàng đợi");
    if (!this.queue.current.isSeekable)
      throw new Error("Track hiện tại không thể tua (not seekable)");

    position = Number(position);

    if (isNaN(position)) throw new Error("position phải là một số");
    if (position < 0 || position > (this.queue.current.duration ?? 0))
      position = Math.max(Math.min(position, this.queue.current.duration ?? 0), 0);

    await this.node.rest.updatePlayer({
      guildId: this.guildId,
      playerOptions: {
        position: position,
      },
    });
    this.queue.current.position = position;
    return this;
  }

  /**
   * Đặt lại âm lượng cho player
   * @param volume Âm lượng mới
   * @returns ZklinkPlayer
   */
  public async setVolume(volume: number): Promise<ZklinkPlayer> {
    this.checkDestroyed();
    if (isNaN(volume)) throw new Error("volume phải là một số");
    await this.node.rest.updatePlayer({
      guildId: this.guildId,
      playerOptions: {
        volume: volume,
      },
    });
    this.volume = volume;
    return this;
  }

  /**
   * Bật/tắt mute cho player
   * @param enable Bật hoặc tắt
   * @returns ZklinkPlayer
   */
  public setMute(enable: boolean): ZklinkPlayer {
    this.checkDestroyed();
    if (enable == this.mute) return this;
    this.mute = enable;
    this.sendVoiceUpdate();
    return this;
  }

  /**
   * Dừng tất cả hoạt động và đặt lại về mặc định
   * @param destroy Có huỷ player hay không
   * @returns ZklinkPlayer
   */
  public async stop(destroy: boolean): Promise<ZklinkPlayer> {
    this.checkDestroyed();
    
    log.info("Player stopped", `Guild: ${this.guildId} | Destroy: ${destroy}`);

    if (destroy) {
      await this.destroy();
      return this;
    }

    this.clear(false);

    this.node.rest.updatePlayer({
      guildId: this.guildId,
      playerOptions: {
        track: {
          encoded: null,
        },
      },
    });
    // @ts-ignore
    this.manager.emit(ZklinkEvents.TrackEnd, this, this.queue.current);
    // @ts-ignore
    this.manager.emit(ZklinkEvents.PlayerStop, this);
    return this;
  }

  /**
   * Đặt lại tất cả dữ liệu về mặc định
   * @param emitEmpty Có phát event QueueEmpty hay không
   */
  public clear(emitEmpty: boolean): void {
    this.loop = ZklinkLoopMode.NONE;
    this.queue.clear();
    this.queue.current = undefined;
    this.queue.previous.length = 0;
    this.volume = this.manager.ZklinkOptions!.options!.defaultVolume ?? 100;
    this.paused = true;
    this.playing = false;
    this.track = null;
    if (!this.data.get("sudo-destroy")) this.data.clear();
    this.position = 0;
    // @ts-ignore
    if (emitEmpty) this.manager.emit(ZklinkEvents.QueueEmpty, this);
    return;
  }

  /**
   * Bật/tắt deaf cho player
   * @param enable Bật hoặc tắt
   * @returns ZklinkPlayer
   */
  public setDeaf(enable: boolean): ZklinkPlayer {
    this.checkDestroyed();
    if (enable == this.deaf) return this;
    this.deaf = enable;
    this.sendVoiceUpdate();
    return this;
  }

  /**
   * Ngắt kết nối khỏi voice channel
   * @returns ZklinkPlayer
   */
  public disconnect(): ZklinkPlayer {
    this.checkDestroyed();
    if (this.voiceState === VoiceConnectState.DISCONNECTED) return this;
    this.voiceId = null;
    this.deaf = false;
    this.mute = false;
    // @ts-ignore
    this.removeAllListeners();
    this.sendVoiceUpdate();
    this.voiceState = VoiceConnectState.DISCONNECTED;
    this.pause();
    this.state = ZklinkPlayerState.DISCONNECTED;
    // Debug đã bị xóa - Player đã ngắt kết nối
    return this;
  }

  /**
   * Kết nối tới voice channel
   * @returns ZklinkPlayer
   */
  public async connect(): Promise<ZklinkPlayer> {
    if (this.state === ZklinkPlayerState.CONNECTED || !this.voiceId) return this;
    if (
      this.voiceState === VoiceConnectState.CONNECTING ||
      this.voiceState === VoiceConnectState.CONNECTED
    )
      return this;
    this.voiceState = VoiceConnectState.CONNECTING;
    this.sendVoiceUpdate();
    // Debug đã bị xóa - Yêu cầu kết nối
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.manager.ZklinkOptions.options!.voiceConnectionTimeout
    );
    try {
      // @ts-ignore
      const [status] = await ZklinkPlayer.once(this, "connectionUpdate", {
        signal: controller.signal,
      });
      if (status !== VoiceState.SESSION_READY) {
        switch (status) {
          case VoiceState.SESSION_ID_MISSING:
            throw new Error("Kết nối voice không thành công do thiếu session id");
          case VoiceState.SESSION_ENDPOINT_MISSING:
            throw new Error("Kết nối voice không thành công do thiếu endpoint kết nối");
        }
      }
      this.voiceState = VoiceConnectState.CONNECTED;
    } catch (error: any) {
      // Debug đã bị xóa - Yêu cầu kết nối thất bại
      if (error.name === "AbortError")
        throw new Error(
          `Kết nối voice không thành công sau ${
            this.manager.ZklinkOptions.options!.voiceConnectionTimeout
          }ms`
        );
      throw error;
    } finally {
      clearTimeout(timeout);
      this.state = ZklinkPlayerState.CONNECTED;
      // Debug đã bị xóa - Player đã kết nối
    }
    return this;
  }

  /**
   * Đặt text channel
   * @param textId ID text channel
   * @returns ZklinkPlayer
   */
  public setTextChannel(textId: string): ZklinkPlayer {
    this.checkDestroyed();
    this.textId = textId;
    return this;
  }

  /**
   * Đặt voice channel và di chuyển player tới đó
   * @param voiceId ID voice channel
   * @returns ZklinkPlayer
   */
  public setVoiceChannel(voiceId: string): ZklinkPlayer {
    this.checkDestroyed();
    this.disconnect();
    this.voiceId = voiceId;
    this.connect();
    // Debug đã bị xóa - Player đã chuyển tới voice channel
    return this;
  }

  /**
   * Đặt filter có sẵn trong Zklink
   * @param filter Tên filter
   * @returns ZklinkPlayer
   */
  public async setFilter(filter: keyof typeof ZklinkFilterData): Promise<ZklinkPlayer> {
    this.checkDestroyed();

    const filterData = ZklinkFilterData[filter as keyof typeof ZklinkFilterData];

    if (!filterData) throw new Error("Không tìm thấy filter");

    await this.send({
      guildId: this.guildId,
      playerOptions: {
        filters: filterData,
      },
    });

    return this;
  }

  /**
   * Gửi dữ liệu update tuỳ chỉnh tới server lavalink
   * @param data Dữ liệu cần thay đổi
   * @returns ZklinkPlayer
   */
  public send(data: UpdatePlayerInfo): ZklinkPlayer {
    this.checkDestroyed();
    this.node.rest.updatePlayer(data);
    return this;
  }

  protected debug(logs: string): void {
    // Debug đã bị xóa
  }

  protected debugDiscord(logs: string): void {
    // Debug đã bị xóa
  }

  protected checkDestroyed(): void {
    if (this.state === ZklinkPlayerState.DESTROYED) throw new Error("Player đã bị huỷ");
  }

  /**
   * Gửi dữ liệu voice tới Discord
   * @internal
   */
  public sendVoiceUpdate() {
    this.sendDiscord({
      guild_id: this.guildId,
      channel_id: this.voiceId,
      self_deaf: this.deaf,
      self_mute: this.mute,
    });
  }

  /**
   * Gửi dữ liệu tới Discord
   * @param data Dữ liệu cần gửi
   * @internal
   */
  public sendDiscord(data: any): void {
    this.manager.library.sendPacket(this.shardId, { op: 4, d: data }, false);
  }

  /**
   * Thiết lập server update cho kết nối này
   * @internal
   */
  public setServerUpdate(data: ServerUpdate): void {
    if (!data.endpoint) {
      // @ts-ignore
      this.emit("connectionUpdate", VoiceState.SESSION_ENDPOINT_MISSING);
      return;
    }
    if (!this.sessionId) {
      // @ts-ignore
      this.emit("connectionUpdate", VoiceState.SESSION_ID_MISSING);
      return;
    }

    this.lastRegion = this.region?.repeat(1) || null;
    this.region = data.endpoint.split(".").shift()?.replace(/[0-9]/g, "") || null;

    if (this.region && this.lastRegion !== this.region) {
      // Debug đã bị xóa - Khu vực Voice đã thay đổi
    }

    this.serverUpdate = data;
    // @ts-ignore
    this.emit("connectionUpdate", VoiceState.SESSION_READY);
    // Debug đã bị xóa - Đã nhận Server Update
  }

  /**
   * Cập nhật session ID, channel ID, trạng thái deaf và mute của instance
   * @internal
   */
  public setStateUpdate({
    session_id,
    channel_id,
    self_deaf,
    self_mute,
  }: StateUpdatePartial): void {
    this.lastvoiceId = this.voiceId?.repeat(1) || null;
    this.voiceId = channel_id || null;

    if (this.voiceId && this.lastvoiceId !== this.voiceId) {
      // Debug đã bị xóa - Channel đã thay đổi
    }

    if (!this.voiceId) {
      this.voiceState = VoiceConnectState.DISCONNECTED;
      // Debug đã bị xóa - Kênh đã ngắt kết nối
    }

    this.deaf = self_deaf;
    this.mute = self_mute;
    this.sessionId = session_id || null;
    // Debug đã bị xóa - Đã nhận State Update
  }
}
