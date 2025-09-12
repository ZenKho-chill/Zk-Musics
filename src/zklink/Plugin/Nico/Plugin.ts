import { ZklinkEvents, ZklinkPluginType } from "../../main.js";
import { ZklinkSearchOptions, ZklinkSearchResult, ZklinkSearchResultType } from "../../main.js";
import { ZklinkTrack } from "../../main.js";
import { Zklink } from "../../main.js";
import { SourceZklinkPlugin } from "../../main.js";
import NicoResolver from "./NicoResolver.js";
import search from "./NicoSearch.js";

const REGEX = RegExp(
  // https://github.com/ytdl-org/youtube-dl/blob/a8035827177d6b59aca03bd717acb6a9bdd75ada/youtube_dl/extractor/niconico.py#L162
  "https?://(?:www\\.|secure\\.|sp\\.)?nicovideo\\.jp/watch/(?<id>(?:[a-z]{2})?[0-9]+)"
);

/** Tùy chọn plugin Nicovideo cho Zklink */
export interface NicoOptions {
  /** Số lượng track muốn resolve */
  searchLimit: number;
}

export class ZklinkPlugin extends SourceZklinkPlugin {
  /**
   * The options of the plugin.
   */
  public options: NicoOptions;
  private _search:
    | ((query: string, options?: ZklinkSearchOptions) => Promise<ZklinkSearchResult>)
    | undefined;
  private Zklink: Zklink | null;

  private readonly methods: Record<string, (id: string, requester: unknown) => Promise<Result>>;

  /**
   * Khởi tạo plugin
   * @param nicoOptions Tùy chọn khi chạy plugin
   */
  constructor(nicoOptions: NicoOptions) {
    super();
    this.options = nicoOptions;
    this.methods = {
      track: this.getTrack.bind(this),
    };
    this.Zklink = null;
  }

  /**
   * Mã nhận diện nguồn của plugin
   * @returns string
   */
  public sourceIdentify(): string {
    return "nv";
  }

  /**
   * Tên nguồn của plugin
   * @returns string
   */
  public sourceName(): string {
    return "nicovideo";
  }

  /**
   * Loại plugin
   * @returns ZklinkPluginType
   */
  public type(): ZklinkPluginType {
    return ZklinkPluginType.SourceResolver;
  }

  /**
   * Tải plugin vào Zklink
   * @param Zklink Lớp quản lý Zklink
   */
  public load(Zklink: Zklink) {
    this.Zklink = Zklink;
    this._search = Zklink.search.bind(Zklink);
    Zklink.search = this.search.bind(this);
  }

  /**
   * Gỡ plugin khỏi Zklink
   * @param Zklink Lớp quản lý Zklink
   */
  public unload(Zklink: Zklink) {
    this.Zklink = Zklink;
    Zklink.search = Zklink.search.bind(Zklink);
  }

  /** Tên hàm để lấy tên plugin */
  public name(): string {
    return "Zklink-nico";
  }

  private async search(query: string, options?: ZklinkSearchOptions): Promise<ZklinkSearchResult> {
    const res = await this._search!(query, options);
    if (!this.directSearchChecker(query)) return res;
    if (res.tracks.length == 0) return this.searchDirect(query, options);
    else return res;
  }

  /**
   * Tìm kiếm trực tiếp từ plugin
   * @param query URI hoặc tên track
   * @param options Tùy chọn tìm kiếm (ZklinkSearchOptions)
   * @returns ZklinkSearchResult
   */
  public async searchDirect(
    query: string,
    options?: ZklinkSearchOptions | undefined
  ): Promise<ZklinkSearchResult> {
    if (!this.Zklink || !this._search) throw new Error("Zklink-nico chưa được tải.");

    if (!query) throw new Error("Cần truyền query");
    const [, id] = REGEX.exec(query) || [];

    const isUrl = /^https?:\/\//.test(query);

    if (id) {
      this.debug(`Bắt đầu tìm kiếm từ plugin ${this.sourceName()}`);
      const _function = this.methods.track;
      const result: Result = await _function(id, options?.requester);

      const loadType = result ? ZklinkSearchResultType.TRACK : ZklinkSearchResultType.SEARCH;
      const playlistName = result.name ?? undefined;

      const tracks = result.tracks.filter(this.filterNullOrUndefined);
      return this.buildSearch(playlistName, tracks && tracks.length !== 0 ? tracks : [], loadType);
    } else if (options?.engine === this.sourceName() && !isUrl) {
      const result = await this.searchTrack(query, options?.requester);

      return this.buildSearch(undefined, result.tracks, ZklinkSearchResultType.SEARCH);
    } else return this.buildSearch(undefined, [], ZklinkSearchResultType.SEARCH);
  }

  private buildSearch(
    playlistName?: string,
    tracks: ZklinkTrack[] = [],
    type?: ZklinkSearchResultType
  ): ZklinkSearchResult {
    return {
      playlistName,
      tracks,
      type: type ?? ZklinkSearchResultType.TRACK,
    };
  }

  private async searchTrack(query: string, requester: unknown) {
    try {
      const { data } = await search({
        q: query,
        targets: ["tagsExact"],
        fields: ["contentId"],
        sort: "-viewCounter",
        limit: 10,
      });

      const res: VideoInfo[] = [];

      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        const nico = new NicoResolver(`https://www.nicovideo.jp/watch/${element.contentId}`);
        const info = await nico.getVideoInfo();
        res.push(info);
      }

      return {
        tracks: res.map((track) => this.buildZklinkTrack(track, requester)),
      };
    } catch (e: any) {
      throw new Error(e);
    }
  }

  private async getTrack(id: string, requester: unknown) {
    try {
      const niconico = new NicoResolver(`https://www.nicovideo.jp/watch/${id}`);
      const info = await niconico.getVideoInfo();

      return { tracks: [this.buildZklinkTrack(info, requester)] };
    } catch (e: any) {
      throw new Error(e);
    }
  }

  private filterNullOrUndefined(obj: unknown): obj is unknown {
    return obj !== undefined && obj !== null;
  }

  private buildZklinkTrack(nicoTrack: any, requester: unknown) {
    return new ZklinkTrack(
      {
        encoded: "",
        info: {
          sourceName: this.sourceName(),
          identifier: nicoTrack.id,
          isSeekable: true,
          author: nicoTrack.owner ? nicoTrack.owner.nickname : "Không rõ",
          length: nicoTrack.duration * 1000,
          isStream: false,
          position: 0,
          title: nicoTrack.title,
          uri: `https://www.nicovideo.jp/watch/${nicoTrack.id}`,
          artworkUrl: nicoTrack.thumbnail ? nicoTrack.thumbnail.url : "",
        },
        pluginInfo: {
          name: "Zklink.mod@nico",
        },
      },
      requester
    );
  }

  private debug(logs: string) {
    this.Zklink
      ? // @ts-ignore
        this.Zklink.emit(ZklinkEvents.Debug, `[Zklink] / [Plugin] / [Nico] | ${logs}`)
      : true;
  }
}

// Giao diện (Interfaces)
/** @ignore */
export interface Result {
  tracks: ZklinkTrack[];
  name?: string;
}
/** @ignore */
export interface OwnerInfo {
  id: number;
  nickname: string;
  iconUrl: string;
  channel: string | null;
  live: {
    id: string;
    title: string;
    url: string;
    begunAt: string;
    isVideoLive: boolean;
    videoLiveOnAirStartTime: string | null;
    thumbnailUrl: string | null;
  } | null;
  isVideoPublic: boolean;
  isMylistsPublic: boolean;
  videoLiveNotice: null;
  viewer: number | null;
}
/** @ignore */
interface OriginalVideoInfo {
  id: string;
  title: string;
  description: string;
  count: {
    view: number;
    comment: number;
    mylist: number;
    like: number;
  };
  duration: number;
  thumbnail: {
    url: string;
    middleUrl: string;
    largeUrl: string;
    player: string;
    ogp: string;
  };
  rating: {
    isAdult: boolean;
  };
  registerdAt: string;
  isPrivate: boolean;
  isDeleted: boolean;
  isNoBanner: boolean;
  isAuthenticationRequired: boolean;
  isEmbedPlayerAllowed: boolean;
  viewer: null;
  watchableUserTypeForPayment: string;
  commentableUserTypeForPayment: string;
  [key: string]: any;
}
/** @ignore */
export interface VideoInfo extends OriginalVideoInfo {
  owner: OwnerInfo;
}
