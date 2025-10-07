import {
  ZklinkAdditionalOptions,
  ZklinkOptions,
  ZklinkSearchOptions,
  ZklinkSearchResult,
  ZklinkSearchResultType,
} from "./Interface/Manager.js";
import { EventEmitter } from "node:events";
import { ZklinkNode } from "./Node/ZklinkNode.js";
import { AbstractLibrary } from "./Libary/AbstractLibrary.js";
import { VoiceChannelOptions } from "./Interface/Player.js";
import { ZklinkPlayerManager } from "./Manager/ZklinkPlayerManager.js";
import { ZklinkNodeManager } from "./Manager/ZklinkNodeManager.js";
import {
  LavalinkLoadType,
  ZklinkEvents,
  ZklinkPluginType,
  SourceIDs,
} from "./Interface/Constants.js";
import { ZklinkTrack } from "./Player/ZklinkTrack.js";
import { log } from "../utilities/LoggerHelper.js";
import { RawTrack } from "./Interface/Rest.js";
import { ZklinkPlayer } from "./Player/ZklinkPlayer.js";
import { SourceZklinkPlugin } from "./Plugin/SourceZklinkPlugin.js";
import { ZklinkQueue } from "./Player/ZklinkQueue.js";
import { metadata } from "./metadata.js";
import { ZklinkPlugin } from "./Plugin/ZklinkPlugin.js";
import { AbstractDriver } from "./Drivers/AbstractDriver.js";
import { Lavalink3 } from "./Drivers/Lavalink3.js";
import { Nodelink2 } from "./Drivers/Nodelink2.js";
import { Lavalink4 } from "./Drivers/Lavalink4.js";
import { ZklinkDatabase } from "./Utilities/ZklinkDatabase.js";

export declare interface Zklink {
  /* tslint:disable:unified-signatures */
  // ------------------------- SỰ KIỆN (ON) ------------------------- //


  ////// ------------------------- SỰ KIỆN NODE ------------------------- /////
  /**
   * Phát ra khi một server lavalink được kết nối.
   * @event Zklink#nodeConnect
   */
  on(event: "nodeConnect", listener: (node: ZklinkNode) => void): this;
  /**
   * Phát ra khi một server lavalink bị ngắt kết nối.
   * @event Zklink#nodeDisconnect
   */
  on(
    event: "nodeDisconnect",
    listener: (node: ZklinkNode, code: number, reason: Buffer) => void
  ): this;
  /**
   * Phát ra khi một server lavalink bị đóng.
   * @event Zklink#nodeClosed
   */
  on(event: "nodeClosed", listener: (node: ZklinkNode) => void): this;
  /**
   * Phát ra khi một server lavalink gặp lỗi.
   * @event Zklink#nodeError
   */
  on(event: "nodeError", listener: (node: ZklinkNode, error: Error) => void): this;
  ////// ------------------------- Node Event ------------------------- /////

  ////// ------------------------- SỰ KIỆN PLAYER ------------------------- /////
  /**
   * Phát ra khi một player được tạo.
   * @event Zklink#playerCreate
   */
  on(event: "playerCreate", listener: (player: ZklinkPlayer) => void): this;
  /**
   * Phát ra khi một player sắp bị huỷ.
   * @event Zklink#playerDestroy
   */
  on(event: "playerDestroy", listener: (player: ZklinkPlayer) => void): this;
  /**
   * Phát ra khi player gặp ngoại lệ.
   * @event Zklink#playerException
   */
  on(
    event: "playerException",
    listener: (player: ZklinkPlayer, data: Record<string, any>) => void
  ): this;
  /**
   * Phát ra khi thông tin player được cập nhật.
   * @event Zklink#playerUpdate
   */
  on(
    event: "playerUpdate",
    listener: (player: ZklinkPlayer, data: Record<string, any>) => void
  ): this;
  /**
   * Phát ra khi player được di chuyển sang channel khác. [Cần plugin]
   * @event Zklink#playerMoved
   */
  on(
    event: "playerMoved",
    listener: (player: ZklinkPlayer, oldChannelId: string, newChannelId: string) => void
  ): this;
  /**
   * Phát ra khi track bị tạm dừng.
   * @event Zklink#playerPause
   */
  on(event: "playerPause", listener: (player: ZklinkPlayer, track: ZklinkTrack) => void): this;
  /**
   * Phát ra khi track được tiếp tục phát.
   * @event Zklink#playerResume
   */
  on(event: "playerResume", listener: (player: ZklinkPlayer, data: ZklinkTrack) => void): this;
  /**
   * Phát ra khi websocket của player đóng.
   * @event Zklink#playerWebsocketClosed
   */
  on(
    event: "playerWebsocketClosed",
    listener: (player: ZklinkPlayer, data: Record<string, any>) => void
  ): this;
  /**
   * Phát ra khi player bị dừng (không bị huỷ).
   * @event Zklink#playerResume
   */
  on(event: "playerStop", listener: (player: ZklinkPlayer) => void): this;
  ////// ------------------------- Player Event ------------------------- /////

  ////// ------------------------- SỰ KIỆN TRACK ------------------------- /////
  /**
   * Phát ra khi track chuẩn bị được phát.
   * @event Zklink#trackStart
   */
  on(event: "trackStart", listener: (player: ZklinkPlayer, track: ZklinkTrack) => void): this;
  /**
   * Phát ra khi track sắp kết thúc.
   * @event Zklink#trackEnd
   */
  on(event: "trackEnd", listener: (player: ZklinkPlayer) => void): this;
  /**
   * Phát ra khi track bị kẹt (stuck).
   * @event Zklink#trackStuck
   */
  on(
    event: "trackStuck",
    listener: (player: ZklinkPlayer, data: Record<string, any>) => void
  ): this;
  /**
   * Phát ra khi track không thể giải quyết bằng bộ tìm kiếm dự phòng.
   * @event Zklink#trackResolveError
   */
  on(
    event: "trackResolveError",
    listener: (player: ZklinkPlayer, track: ZklinkTrack, message: string) => void
  ): this;
  ////// ------------------------- Track Event ------------------------- /////

  ////// ------------------------- SỰ KIỆN QUEUE ------------------------- /////
  /**
   * Phát ra khi track được thêm vào hàng đợi.
   * @event Zklink#queueAdd
   */
  on(
    event: "queueAdd",
    listener: (player: ZklinkPlayer, queue: ZklinkQueue, track: ZklinkTrack) => void
  ): this;
  /**
   * Phát ra khi track bị xoá khỏi hàng đợi.
   * @event Zklink#queueRemove
   */
  on(
    event: "queueRemove",
    listener: (player: ZklinkPlayer, queue: ZklinkQueue, track: ZklinkTrack) => void
  ): this;
  /**
   * Phát ra khi hàng đợi được xáo trộn (shuffle).
   * @event Zklink#queueShuffle
   */
  on(event: "queueShuffle", listener: (player: ZklinkPlayer, queue: ZklinkQueue) => void): this;
  /**
   * Phát ra khi hàng đợi được xoá hết.
   * @event Zklink#queueClear
   */
  on(event: "queueClear", listener: (player: ZklinkPlayer, queue: ZklinkQueue) => void): this;
  /**
   * Phát ra khi hàng đợi rỗng.
   * @event Zklink#queueEmpty
   */
  on(event: "queueEmpty", listener: (player: ZklinkPlayer, queue: ZklinkQueue) => void): this;
  ////// ------------------------- Queue Event ------------------------- /////

  ////// ------------------------- SỰ KIỆN VOICE ------------------------- /////
  /**
   * Phát ra khi kết nối tới server nhận voice [CHỈ Nodelink DRIVER].
   * @event Zklink#voiceConnect
   */
  on(event: "voiceConnect", listener: (node: ZklinkNode) => void): this;
  /**
   * Phát ra khi ngắt kết nối tới server nhận voice [CHỈ Nodelink DRIVER].
   * @event Zklink#voiceDisconnect
   */
  on(
    event: "voiceDisconnect",
    listener: (node: ZklinkNode, code: number, reason: Buffer) => void
  ): this;
  /**
   * Phát ra khi server nhận voice gặp lỗi [CHỈ Nodelink DRIVER].
   * @event Zklink#VoiceError
   */
  on(event: "VoiceError", listener: (node: ZklinkNode, error: Error) => void): this;
  /**
   * Phát ra khi người dùng bắt đầu nói [CHỈ Nodelink DRIVER].
   * @event Zklink#voiceStartSpeaking
   */
  on(
    event: "voiceStartSpeaking",
    listener: (node: ZklinkNode, userId: string, guildId: string) => void
  ): this;
  /**
   * Phát ra khi người dùng kết thúc nói [CHỈ Nodelink DRIVER].
   * @event Zklink#voiceEndSpeaking
   */
  on(
    event: "voiceEndSpeaking",
    listener: (node: ZklinkNode, userTrack: string, userId: string, guildId: string) => void
  ): this;
  ////// ------------------------- Voice Event ------------------------- /////
  // ------------------------- SỰ KIỆN (ON) ------------------------- //

  // ------------------------- SỰ KIỆN (ONCE) ------------------------- //
  ////// ------------------------- Node Event ------------------------- /////
  /** @ignore */
  once(event: "nodeConnect", listener: (node: ZklinkNode) => void): this;
  /** @ignore */
  once(
    event: "nodeDisconnect",
    listener: (node: ZklinkNode, code: number, reason: Buffer) => void
  ): this;
  /** @ignore */
  once(event: "nodeClosed", listener: (node: ZklinkNode) => void): this;
  /** @ignore */
  once(event: "nodeError", listener: (node: ZklinkNode, error: Error) => void): this;
  ////// ------------------------- Node Event ------------------------- /////

  ////// ------------------------- Player Event ------------------------- /////
  /** @ignore */
  once(event: "playerCreate", listener: (player: ZklinkPlayer) => void): this;
  /** @ignore */
  once(event: "playerDestroy", listener: (player: ZklinkPlayer) => void): this;
  /** @ignore */
  once(
    event: "playerException",
    listener: (player: ZklinkPlayer, data: Record<string, any>) => void
  ): this;
  /** @ignore */
  once(
    event: "playerUpdate",
    listener: (player: ZklinkPlayer, data: Record<string, any>) => void
  ): this;
  /** @ignore */
  once(
    event: "playerMoved",
    listener: (player: ZklinkPlayer, oldChannelId: string, newChannelId: string) => void
  ): this;
  /** @ignore */
  once(event: "playerPause", listener: (player: ZklinkPlayer, track: ZklinkTrack) => void): this;
  /** @ignore */
  once(event: "playerResume", listener: (player: ZklinkPlayer, data: ZklinkTrack) => void): this;
  /** @ignore */
  once(
    event: "playerWebsocketClosed",
    listener: (player: ZklinkPlayer, data: Record<string, any>) => void
  ): this;
  /** @ignore */
  once(event: "playerStop", listener: (player: ZklinkPlayer) => void): this;
  ////// ------------------------- Player Event ------------------------- /////

  ////// ------------------------- Track Event ------------------------- /////
  /** @ignore */
  once(event: "trackStart", listener: (player: ZklinkPlayer, track: ZklinkTrack) => void): this;
  /** @ignore */
  once(event: "trackEnd", listener: (player: ZklinkPlayer) => void): this;
  /** @ignore */
  once(
    event: "trackStuck",
    listener: (player: ZklinkPlayer, data: Record<string, any>) => void
  ): this;
  /** @ignore */
  once(
    event: "trackResolveError",
    listener: (player: ZklinkPlayer, track: ZklinkTrack, message: string) => void
  ): this;
  ////// ------------------------- Track Event ------------------------- /////

  ////// ------------------------- Queue Event ------------------------- /////
  /** @ignore */
  once(
    event: "queueAdd",
    listener: (player: ZklinkPlayer, queue: ZklinkQueue, track: ZklinkTrack) => void
  ): this;
  /** @ignore */
  once(
    event: "queueRemove",
    listener: (player: ZklinkPlayer, queue: ZklinkQueue, track: ZklinkTrack) => void
  ): this;
  /** @ignore */
  once(event: "queueShuffle", listener: (player: ZklinkPlayer, queue: ZklinkQueue) => void): this;
  /** @ignore */
  once(event: "queueClear", listener: (player: ZklinkPlayer, queue: ZklinkQueue) => void): this;
  /** @ignore */
  once(event: "queueEmpty", listener: (player: ZklinkPlayer, queue: ZklinkQueue) => void): this;
  ////// ------------------------- Queue Event ------------------------- /////

  ////// ------------------------- Voice Event ------------------------- /////
  /** @ignore */
  once(event: "voiceConnect", listener: (node: ZklinkNode) => void): this;
  /** @ignore */
  once(
    event: "voiceDisconnect",
    listener: (node: ZklinkNode, code: number, reason: Buffer) => void
  ): this;
  /** @ignore */
  once(event: "VoiceError", listener: (node: ZklinkNode, error: Error) => void): this;
  /** @ignore */
  once(
    event: "voiceStartSpeaking",
    listener: (node: ZklinkNode, userId: string, guildId: string) => void
  ): this;
  /** @ignore */
  once(
    event: "voiceEndSpeaking",
    listener: (node: ZklinkNode, userTrack: string, userId: string, guildId: string) => void
  ): this;
  ////// ------------------------- Voice Event ------------------------- /////
  // ------------------------- ONCE EVENT ------------------------- //

  // ------------------------- SỰ KIỆN (OFF) ------------------------- //
  ////// ------------------------- Node Event ------------------------- /////
  /** @ignore */
  off(event: "nodeConnect", listener: (node: ZklinkNode) => void): this;
  /** @ignore */
  off(
    event: "nodeDisconnect",
    listener: (node: ZklinkNode, code: number, reason: Buffer) => void
  ): this;
  /** @ignore */
  off(event: "nodeClosed", listener: (node: ZklinkNode) => void): this;
  /** @ignore */
  off(event: "nodeError", listener: (node: ZklinkNode, error: Error) => void): this;
  ////// ------------------------- Node Event ------------------------- /////

  ////// ------------------------- Player Event ------------------------- /////
  /** @ignore */
  off(event: "playerCreate", listener: (player: ZklinkPlayer) => void): this;
  /** @ignore */
  off(event: "playerDestroy", listener: (player: ZklinkPlayer) => void): this;
  /** @ignore */
  off(
    event: "playerException",
    listener: (player: ZklinkPlayer, data: Record<string, any>) => void
  ): this;
  /** @ignore */
  off(
    event: "playerUpdate",
    listener: (player: ZklinkPlayer, data: Record<string, any>) => void
  ): this;
  /** @ignore */
  off(
    event: "playerMoved",
    listener: (player: ZklinkPlayer, oldChannelId: string, newChannelId: string) => void
  ): this;
  /** @ignore */
  off(event: "playerPause", listener: (player: ZklinkPlayer, track: ZklinkTrack) => void): this;
  /** @ignore */
  off(event: "playerResume", listener: (player: ZklinkPlayer, data: ZklinkTrack) => void): this;
  /** @ignore */
  off(
    event: "playerWebsocketClosed",
    listener: (player: ZklinkPlayer, data: Record<string, any>) => void
  ): this;
  /** @ignore */
  off(event: "playerStop", listener: (player: ZklinkPlayer) => void): this;
  ////// ------------------------- Player Event ------------------------- /////

  ////// ------------------------- Track Event ------------------------- /////
  /** @ignore */
  off(event: "trackStart", listener: (player: ZklinkPlayer, track: ZklinkTrack) => void): this;
  /** @ignore */
  off(event: "trackEnd", listener: (player: ZklinkPlayer) => void): this;
  /** @ignore */
  off(
    event: "trackStuck",
    listener: (player: ZklinkPlayer, data: Record<string, any>) => void
  ): this;
  /** @ignore */
  off(
    event: "trackResolveError",
    listener: (player: ZklinkPlayer, track: ZklinkTrack, message: string) => void
  ): this;
  ////// ------------------------- Track Event ------------------------- /////

  ////// ------------------------- Queue Event ------------------------- /////
  /** @ignore */
  off(
    event: "queueAdd",
    listener: (player: ZklinkPlayer, queue: ZklinkQueue, track: ZklinkTrack) => void
  ): this;
  /** @ignore */
  off(
    event: "queueRemove",
    listener: (player: ZklinkPlayer, queue: ZklinkQueue, track: ZklinkTrack) => void
  ): this;
  /** @ignore */
  off(event: "queueShuffle", listener: (player: ZklinkPlayer, queue: ZklinkQueue) => void): this;
  /** @ignore */
  off(event: "queueClear", listener: (player: ZklinkPlayer, queue: ZklinkQueue) => void): this;
  /** @ignore */
  off(event: "queueEmpty", listener: (player: ZklinkPlayer, queue: ZklinkQueue) => void): this;
  ////// ------------------------- Queue Event ------------------------- /////

  ////// ------------------------- Voice Event ------------------------- /////
  /** @ignore */
  off(event: "voiceConnect", listener: (node: ZklinkNode) => void): this;
  /** @ignore */
  off(
    event: "voiceDisconnect",
    listener: (node: ZklinkNode, code: number, reason: Buffer) => void
  ): this;
  /** @ignore */
  off(event: "VoiceError", listener: (node: ZklinkNode, error: Error) => void): this;
  /** @ignore */
  off(
    event: "voiceStartSpeaking",
    listener: (node: ZklinkNode, userId: string, guildId: string) => void
  ): this;
  /** @ignore */
  off(
    event: "voiceEndSpeaking",
    listener: (node: ZklinkNode, userTrack: string, userId: string, guildId: string) => void
  ): this;
  ////// ------------------------- Voice Event ------------------------- /////
  // ------------------------- OFF EVENT ------------------------- //
}

export class Zklink extends EventEmitter {
  /**
   * Kết nối thư viện Discord
   */
  public readonly library: AbstractLibrary;
  /**
   * Danh sách các server Lavalink đã cấu hình
   */
  public nodes: ZklinkNodeManager;
  /**
   * Tuỳ chọn Zklink
   */
  public ZklinkOptions: ZklinkOptions;
  /**
   * ID bot
   */
  public id: string | undefined;
  /**
   * Bản đồ players
   */
  public players: ZklinkPlayerManager;
  /**
   * Tất cả engine tìm kiếm
   */
  public searchEngines: ZklinkDatabase<string>;
  /**
   * Tất cả plugin tìm kiếm (resolver plugins)
   */
  public searchPlugins: ZklinkDatabase<SourceZklinkPlugin>;
  /**
   * Tất cả plugin (bao gồm resolver plugins)
   */
  public plugins: ZklinkDatabase<ZklinkPlugin>;
  /**
   * Các driver Zklink
   */
  public drivers: AbstractDriver[];
  /**
   * Số shard hiện tại của bot
   */
  public shardCount: number = 1;

  /**
   * Lớp chính xử lý toàn bộ hoạt động với lavalink server.
   * Khởi tạo bằng cách gọi new Zklink(your_params).
   * @param options Các tuỳ chọn chính của Zklink
   */
  constructor(options: ZklinkOptions) {
    super();
    if (!options.library)
      throw new Error(
        "Vui lòng chỉ định thư viện để kết nối, ví dụ: \nlibrary: new Library.DiscordJS(client) "
      );
    this.library = options.library.set(this);
    this.drivers = [new Lavalink3(), new Nodelink2(), new Lavalink4()];
    this.ZklinkOptions = options;
    this.ZklinkOptions.options = this.mergeDefault<ZklinkAdditionalOptions>(
      this.defaultOptions,
      this.ZklinkOptions.options ?? {}
    );
    if (
      this.ZklinkOptions.options.additionalDriver &&
      this.ZklinkOptions.options.additionalDriver?.length !== 0
    )
      this.drivers.push(...this.ZklinkOptions.options.additionalDriver);
    this.nodes = new ZklinkNodeManager(this);
    this.players = new ZklinkPlayerManager(this);
    this.searchEngines = new ZklinkDatabase<string>();
    this.searchPlugins = new ZklinkDatabase<SourceZklinkPlugin>();
    this.plugins = new ZklinkDatabase<ZklinkPlugin>();
    this.initialSearchEngines();
    if (
      !this.ZklinkOptions.options.defaultSearchEngine ||
      this.ZklinkOptions.options.defaultSearchEngine.length == 0
    )
      this.ZklinkOptions.options.defaultSearchEngine == "youtube";

    if (this.ZklinkOptions.plugins) {
      for (const [, plugin] of this.ZklinkOptions.plugins.entries()) {
        if (plugin.constructor.name !== "ZklinkPlugin")
          throw new Error("Plugin phải là instance của ZklinkPlugin hoặc SourceZklinkPlugin");
        plugin.load(this);

        this.plugins.set(plugin.name(), plugin);

        if (plugin.type() == ZklinkPluginType.SourceResolver) {
          const newPlugin = plugin as SourceZklinkPlugin;
          const sourceName = newPlugin.sourceName();
          const sourceIdentify = newPlugin.sourceIdentify();
          this.searchEngines.set(sourceName, sourceIdentify);
          this.searchPlugins.set(sourceName, newPlugin);
        }
      }
    }
    this.library.listen(this.ZklinkOptions.nodes);
  }

  protected initialSearchEngines() {
    for (const data of SourceIDs) {
      this.searchEngines.set(data.name, data.id);
    }
  }

  /**
   * Tạo một player mới.
   * @returns ZklinkPlayer
   */
  async create(options: VoiceChannelOptions): Promise<ZklinkPlayer> {
    return await this.players.create(options);
  }

  /**
   * Huỷ một player cụ thể.
   * @returns void
   */
  async destroy(guildId: string): Promise<void> {
    this.players.destroy(guildId);
  }

  /**
   * Tìm kiếm một track cụ thể.
   * @returns ZklinkSearchResult
   */
  async search(query: string, options?: ZklinkSearchOptions): Promise<ZklinkSearchResult> {
    const node =
      options && options?.nodeName
        ? (this.nodes.get(options.nodeName) ?? (await this.nodes.getLeastUsed()))
        : await this.nodes.getLeastUsed();

    if (!node) throw new Error("Không có node khả dụng");

    let pluginData: ZklinkSearchResult;

    const directSearchRegex = /directSearch=(.*)/;
    const isDirectSearch = directSearchRegex.exec(query);
    const isUrl = /^https?:\/\/.*/.test(query);

    const pluginSearch = this.searchPlugins.get(String(options?.engine));

    if (
      options &&
      options!.engine &&
      options!.engine !== null &&
      pluginSearch &&
      isDirectSearch == null
    ) {
      pluginData = await pluginSearch.searchDirect(query, options);
      if (pluginData.tracks.length !== 0) return pluginData;
    }

    const source =
      options && options?.engine
        ? this.searchEngines.get(options.engine)
        : this.searchEngines.get(
            this.ZklinkOptions.options!.defaultSearchEngine
              ? this.ZklinkOptions.options!.defaultSearchEngine
              : "youtube"
          );

    const finalQuery =
      isDirectSearch !== null ? isDirectSearch[1] : !isUrl ? `${source}search:${query}` : query;

    const result = await node.rest.resolver(finalQuery).catch(() => null);
    if (!result || result.loadType === LavalinkLoadType.EMPTY) {
      return this.buildSearch(undefined, [], ZklinkSearchResultType.SEARCH);
    }

    let loadType: ZklinkSearchResultType;
    let normalizedData: {
      playlistName?: string;
      tracks: RawTrack[];
    } = { tracks: [] };
    switch (result.loadType) {
      case LavalinkLoadType.TRACK: {
        loadType = ZklinkSearchResultType.TRACK;
        normalizedData.tracks = [result.data];
        break;
      }

      case LavalinkLoadType.PLAYLIST: {
        loadType = ZklinkSearchResultType.PLAYLIST;
        normalizedData = {
          playlistName: result.data.info.name,
          tracks: result.data.tracks,
        };
        break;
      }

      case LavalinkLoadType.SEARCH: {
        loadType = ZklinkSearchResultType.SEARCH;
        normalizedData.tracks = result.data;
        break;
      }

      default: {
        loadType = ZklinkSearchResultType.SEARCH;
        normalizedData.tracks = [];
        break;
      }
    }

    // @ts-ignore
    this.emit(
      ZklinkEvents.Debug,
      `[Zklink] / [Tìm kiếm] | Đã tìm: ${query}; Số kết quả: ${normalizedData.tracks.length}`
    );

    return this.buildSearch(
      normalizedData.playlistName ?? undefined,
      normalizedData.tracks.map(
        (track) =>
          new ZklinkTrack(track, options && options.requester ? options.requester : undefined)
      ),
      loadType
    );
  }

  protected buildSearch(
    playlistName?: string,
    tracks: ZklinkTrack[] = [],
    type?: ZklinkSearchResultType
  ): ZklinkSearchResult {
    return {
      playlistName,
      tracks,
      type: type ?? ZklinkSearchResultType.SEARCH,
    };
  }

  protected get defaultOptions(): ZklinkAdditionalOptions {
    return {
      additionalDriver: [],
      retryTimeout: 3000,
      retryCount: 15,
      voiceConnectionTimeout: 15000,
      defaultSearchEngine: "soundcloud",
      defaultVolume: 100,
      searchFallback: {
        enable: true,
        engine: "soundcloud",
      },
      resume: false,
      userAgent: `Discord/Bot/${metadata.name}/${metadata.version} (${metadata.github})`,
      nodeResolver: undefined,
      structures: undefined,
      resumeTimeout: 300,
    };
  }

  protected mergeDefault<T extends { [key: string]: any }>(def: T, given: T): Required<T> {
    if (!given) return def as Required<T>;
    const defaultKeys: (keyof T)[] = Object.keys(def);
    for (const key in given) {
      if (defaultKeys.includes(key)) continue;
      if (this.isNumber(key)) continue;
      delete given[key];
    }
    for (const key of defaultKeys) {
      if (Array.isArray(given[key]) && given[key] !== null && given[key] !== undefined) {
        if (given[key].length == 0) given[key] = def[key];
      }
      if (def[key] === null || (typeof def[key] === "string" && def[key].length === 0)) {
        if (!given[key]) given[key] = def[key];
      }
      if (given[key] === null || given[key] === undefined) given[key] = def[key];
      if (typeof given[key] === "object" && given[key] !== null) {
        this.mergeDefault(def[key], given[key]);
      }
    }
    return given as Required<T>;
  }

  protected isNumber(data: string): boolean {
    return /^[+-]?\d+(\.\d+)?$/.test(data);
  }
}
