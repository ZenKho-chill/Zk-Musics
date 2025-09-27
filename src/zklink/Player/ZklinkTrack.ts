import { ZklinkEvents } from "../Interface/Constants.js";
import { ZklinkSearchResult, ZklinkSearchResultType } from "../Interface/Manager.js";
import { RawTrack } from "../Interface/Rest.js";
import { ResolveOptions } from "../Interface/Track.js";
import { Zklink } from "../Zklink.js";
import { ZklinkNode } from "../main.js";

export class ZklinkTrack {
  /** Chuỗi encoded từ lavalink */
  encoded: string;
  /** Chuỗi identifier từ lavalink */
  identifier: string;
  /** Track có thể seek hay không */
  isSeekable: boolean;
  /** Tác giả của track */
  author: string;
  /** Thời lượng của track */
  duration: number;
  /** Track có phải là stream hay không */
  isStream: boolean;
  /** Vị trí hiện tại của track */
  position: number;
  /** Tiêu đề của track */
  title: string;
  /** URL của track */
  uri?: string;
  /** URL hình ảnh minh họa của track */
  artworkUrl?: string;
  /** isrc của track */
  isrc?: string;
  /** Tên nguồn (source) của track */
  source: string;
  /** Dữ liệu plugin từ lavalink */
  pluginInfo: unknown;
  /** Người yêu cầu (requester) của track */
  requester: unknown;
  /** realUri của track (dự phòng cho YouTube) */
  realUri?: string;

  /**
   * Lớp track của Zklink để phát track từ lavalink
   * @param options RawTrack trả về từ REST
   * @param requester Thông tin requester của track này
   */
  constructor(
    protected options: RawTrack,
    requester: unknown
  ) {
    this.encoded = options.encoded;
    this.identifier = options.info.identifier;
    this.isSeekable = options.info.isSeekable;
    this.author = options.info.author;
    this.duration = options.info.length;
    this.isStream = options.info.isStream;
    this.position = options.info.position;
    this.title = options.info.title;
    this.uri = options.info.uri;
    this.artworkUrl = options.info.artworkUrl;
    this.isrc = options.info.isrc;
    this.source = options.info.sourceName;
    this.pluginInfo = options.pluginInfo;
    this.requester = requester;
    this.realUri = undefined;
  }

  /**
   * Kiểm tra track có thể phát được hay không
   * @returns boolean
   */
  get isPlayable(): boolean {
    return (
      !!this.encoded &&
      !!this.source &&
      !!this.identifier &&
      !!this.author &&
      !!this.duration &&
      !!this.title &&
      !!this.uri
    );
  }

  /**
   * Lấy toàn bộ thông tin raw của track
   * @returns RawTrack
   */
  get raw(): RawTrack {
    return {
      encoded: this.encoded,
      info: {
        identifier: this.identifier,
        isSeekable: this.isSeekable,
        author: this.author,
        length: this.duration,
        isStream: this.isStream,
        position: this.position,
        title: this.title,
        uri: this.uri,
        artworkUrl: this.artworkUrl,
        isrc: this.isrc,
        sourceName: this.source,
      },
      pluginInfo: this.pluginInfo,
    };
  }

  /**
   * Resolve track (lấy thông tin đầy đủ từ nguồn)
   * @param options Tùy chọn resolve
   * @returns Promise<ZklinkTrack>
   */
  public async resolver(manager: Zklink, options?: ResolveOptions): Promise<ZklinkTrack> {
    const { overwrite } = options ? options : { overwrite: false };

    if (this.isPlayable) {
      this.realUri = this.raw.info.uri;
      return this;
    }
    // @ts-ignore
    manager.emit(
      ZklinkEvents.Debug,
      `[Zklink] / [Track] | Đang resolve track từ ${this.source} ${this.title}; Source: ${this.source}`
    );

    const result = await this.getTrack(manager, options ? options.nodeName : undefined);
    if (!result) throw new Error("Không tìm thấy kết quả");

    this.encoded = result.encoded;
    this.realUri = result.info.uri;
    this.duration = result.info.length;

    if (overwrite) {
      this.title = result.info.title;
      this.identifier = result.info.identifier;
      this.isSeekable = result.info.isSeekable;
      this.author = result.info.author;
      this.duration = result.info.length;
      this.isStream = result.info.isStream;
      this.uri = result.info.uri;
    }
    return this;
  }

  protected async getTrack(manager: Zklink, nodeName?: string): Promise<RawTrack> {
    const node = nodeName ? manager.nodes.get(nodeName) : await manager.nodes.getLeastUsed();

    if (!node) throw new Error("Không tìm thấy kết quả");

    const result = await this.resolverEngine(manager, node);

    if (!result || !result.tracks.length) throw new Error("Không tìm thấy kết quả");

    const rawTracks = result.tracks.map((x) => x.raw);

    if (this.author) {
      const author = [this.author, `${this.author} - Topic`];
      const officialTrack = rawTracks.find(
        (track) =>
          author.some((name) =>
            new RegExp(`^${this.escapeRegExp(name)}$`, "i").test(track.info.author)
          ) || new RegExp(`^${this.escapeRegExp(this.title)}$`, "i").test(track.info.title)
      );
      if (officialTrack) return officialTrack;
    }
    if (this.duration) {
      const sameDuration = rawTracks.find(
        (track) =>
          track.info.length >= (this.duration ? this.duration : 0) - 2000 &&
          track.info.length <= (this.duration ? this.duration : 0) + 2000
      );
      if (sameDuration) return sameDuration;
    }

    return rawTracks[0];
  }

  protected escapeRegExp(string: string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
  }

  protected async resolverEngine(manager: Zklink, node: ZklinkNode): Promise<ZklinkSearchResult> {
    const defaultSearchEngine = manager.ZklinkOptions.options!.defaultSearchEngine;
    const engine = manager.searchEngines.get(this.source || defaultSearchEngine || "Không tìm thấy kết quả");
    const searchQuery = [this.author, this.title].filter((x) => !!x).join(" - ");
    const searchFallbackEngineName = manager.ZklinkOptions.options!.searchFallback!.engine;
    const searchFallbackEngine = manager.searchEngines.get(searchFallbackEngineName);

    const prase1 = await manager.search(`directSearch=${this.uri}`, {
      requester: this.requester,
      nodeName: node.options.name,
    });
    if (prase1.tracks.length !== 0) return prase1;

    const prase2 = await manager.search(`directSearch=${engine}search:${searchQuery}`, {
      requester: this.requester,
      nodeName: node.options.name,
    });
    if (prase2.tracks.length !== 0) return prase2;

    if (manager.ZklinkOptions.options!.searchFallback?.enable && searchFallbackEngine) {
      const prase3 = await manager.search(
        `directSearch=${searchFallbackEngine}search:${searchQuery}`,
        {
          requester: this.requester,
          nodeName: node.options.name,
        }
      );
      if (prase3.tracks.length !== 0) return prase3;
    }

    return {
      type: ZklinkSearchResultType.SEARCH,
      playlistName: undefined,
      tracks: [],
    };
  }
}
