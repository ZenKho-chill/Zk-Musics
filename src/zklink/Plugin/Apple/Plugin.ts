import {
  ZklinkSearchOptions,
  ZklinkSearchResult,
  ZklinkSearchResultType,
} from "../../Interface/Manager.js";
import { Zklink } from "../../Zklink.js";
import { ZklinkTrack } from "../../Player/ZklinkTrack.js";
import { SourceZklinkPlugin } from "../SourceZklinkPlugin.js";
import { ZklinkEvents, ZklinkPluginType } from "../../Interface/Constants.js";
import { Config } from "../../../@types/Config.js";
import { ConfigData } from "../../../services/ConfigData.js";
const data: Config = ConfigData.getInstance().data;
import { fetch } from "undici";
const REGEX =
  /(?:https:\/\/music\.apple\.com\/)(?:.+)?(artist|album|music-video|playlist)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)/;
const REGEX_SONG_ONLY =
  /(?:https:\/\/music\.apple\.com\/)(?:.+)?(artist|album|music-video|playlist)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)(\?|\&)([^=]+)\=([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)/;

type HeaderType = {
  Authorization: string;
  origin: string;
};

/** Tùy chọn plugin Apple cho Zklink */
export type AppleOptions = {
  /** Mã quốc gia để lấy nội dung, ví dụ: en */
  countryCode?: string;
  /** Chiều rộng ảnh bìa */
  imageWidth?: number;
  /** Chiều cao ảnh bìa */
  imageHeight?: number;
};

const credentials = {
  APPLE_TOKEN: data.lavalink.APPLE_TOKEN,
};
export class ZklinkPlugin extends SourceZklinkPlugin {
  public options: AppleOptions;
  private manager: Zklink | null;
  private _search?: (query: string, options?: ZklinkSearchOptions) => Promise<ZklinkSearchResult>;
  private readonly methods: Record<string, (id: string, requester: unknown) => Promise<Result>>;
  private credentials: HeaderType;
  private fetchURL: string;
  private baseURL: string;
  public countryCode: string;
  public imageWidth: number;
  public imageHeight: number;

  /**
   * Mã nhận diện nguồn của plugin
   * @returns string
   */
  public sourceIdentify(): string {
    return "am";
  }

  /**
   * Tên nguồn của plugin
   * @returns string
   */
  public sourceName(): string {
    return "apple";
  }

  /**
   * Loại plugin
   * @returns ZklinkPluginType
   */
  public type(): ZklinkPluginType {
    return ZklinkPluginType.SourceResolver;
  }

  /** Tên hàm để lấy tên plugin */
  public name(): string {
    return "Zklink-apple";
  }

  /**
   * Khởi tạo plugin
   * @param appleOptions Tùy chọn plugin Apple cho Zklink
   */
  constructor(appleOptions: AppleOptions) {
    super();
    this.methods = {
      artist: this.getArtist.bind(this),
      album: this.getAlbum.bind(this),
      playlist: this.getPlaylist.bind(this),
      track: this.getTrack.bind(this),
    };
    this.options = appleOptions;
    this.manager = null;
    this._search = undefined;
    this.countryCode = this.options?.countryCode ? this.options?.countryCode : "us";
    this.imageHeight = this.options?.imageHeight ? this.options?.imageHeight : 900;
    this.imageWidth = this.options?.imageWidth ? this.options?.imageWidth : 600;
    this.baseURL = "https://api.music.apple.com/v1/";
    this.fetchURL = `https://amp-api.music.apple.com/v1/catalog/${this.countryCode}`;
    this.credentials = {
      Authorization: `Bearer ${credentials.APPLE_TOKEN}`,
      origin: "https://music.apple.com",
    };
  }

  /**
   * Tải plugin vào Zklink
   * @param Zklink Lớp quản lý Zklink
   */
  public load(manager: Zklink): void {
    this.manager = manager;
    this._search = manager.search.bind(manager);
    manager.search = this.search.bind(this);
  }

  /**
   * Gỡ plugin khỏi Zklink
   * @param Zklink Lớp quản lý Zklink
   */
  public unload(Zklink: Zklink) {
    this.manager = Zklink;
    this.manager.search = Zklink.search.bind(Zklink);
  }

  protected async search(
    query: string,
    options?: ZklinkSearchOptions
  ): Promise<ZklinkSearchResult> {
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
    let type: string;
    let id: string;
    let isTrack: boolean = false;

    if (!this.manager || !this._search) throw new Error("Zklink-apple chưa được tải.");

    if (!query) throw new Error("Cần truyền query");

    const isUrl = /^https?:\/\//.test(query);

    if (!REGEX_SONG_ONLY.exec(query) || REGEX_SONG_ONLY.exec(query) == null) {
      const extract = REGEX.exec(query) || [];
      id = extract![4];
      type = extract![1];
    } else {
      const extract = REGEX_SONG_ONLY.exec(query) || [];
      id = extract![8];
      type = extract![1];
      isTrack = true;
    }

    if (type in this.methods) {
      try {
        // Debug đã bị xóa - Bắt đầu tìm kiếm từ plugin
        let _function = this.methods[type];
        if (isTrack) _function = this.methods.track;
        const result: Result = await _function(id, options?.requester);

        const loadType = isTrack ? ZklinkSearchResultType.TRACK : ZklinkSearchResultType.PLAYLIST;
        const playlistName = result.name ?? undefined;

        const tracks = result.tracks.filter(this.filterNullOrUndefined);
        return this.buildSearch(playlistName, tracks, loadType);
      } catch (e) {
        return this.buildSearch(undefined, [], ZklinkSearchResultType.SEARCH);
      }
    } else if (options?.engine === "apple" && !isUrl) {
      const result = await this.searchTrack(query, options?.requester);

      return this.buildSearch(undefined, result.tracks, ZklinkSearchResultType.SEARCH);
    } else return this.buildSearch(undefined, [], ZklinkSearchResultType.SEARCH);
  }

  private async getData<D = any>(params: string) {
    try {
      const req = await fetch(`${this.fetchURL}${params}`, {
        headers: this.credentials,
      });

      if (!req.ok) {
        // Debug đã bị xóa - Lỗi khi gọi Apple Music API
        return null as D;
      }

      const text = await req.text();
      if (!text.trim()) {
        // Debug đã bị xóa - Apple Music API trả về response rỗng
        return null as D;
      }

      const res = JSON.parse(text) as any;
      return res.data as D;
    } catch (error) {
      // Debug đã bị xóa - Lỗi khi parse JSON từ Apple Music API
      return null as D;
    }
  }

  private async searchTrack(query: string, requester: unknown): Promise<Result> {
    try {
      const res = await this.getData(
        `/search?types=songs&term=${query.replace(/ /g, "+").toLocaleLowerCase()}`
      ).catch((e) => {
        // Debug đã bị xóa - Lỗi khi tìm kiếm track
        return null;
      });

      if (!res) {
        return { tracks: [] };
      }

      return {
        tracks:
          res?.results?.songs?.data?.map((track: Track) =>
            this.buildZklinkTrack(track, requester)
          ) || [],
      };
    } catch (e: any) {
      // Debug đã bị xóa - Lỗi không mong đợi trong searchTrack
      return { tracks: [] };
    }
  }

  private async getTrack(id: string, requester: unknown): Promise<Result> {
    try {
      const track = await this.getData(`/songs/${id}`).catch((e) => {
        // Debug đã bị xóa - Lỗi khi lấy track
        return null;
      });

      if (!track || !track[0]) {
        return { tracks: [] };
      }

      return { tracks: [this.buildZklinkTrack(track[0], requester)] };
    } catch (e: any) {
      // Debug đã bị xóa - Lỗi không mong đợi trong getTrack
      return { tracks: [] };
    }
  }

  private async getArtist(id: string, requester: unknown): Promise<Result> {
    try {
      const track = await this.getData(`/artists/${id}/view/top-songs`).catch((e) => {
        // Debug đã bị xóa - Lỗi khi lấy artist
        return null;
      });

      if (!track || !track[0]) {
        return { tracks: [] };
      }

      return { tracks: [this.buildZklinkTrack(track[0], requester)] };
    } catch (e: any) {
      // Debug đã bị xóa - Lỗi không mong đợi trong getArtist
      return { tracks: [] };
    }
  }

  private async getAlbum(id: string, requester: unknown): Promise<Result> {
    try {
      const album = await this.getData(`/albums/${id}`).catch((e) => {
        // Debug đã bị xóa - Lỗi khi lấy album
        return null;
      });

      if (!album || !album[0]) {
        return { tracks: [] };
      }

      const tracks =
        album[0].relationships?.tracks?.data
          ?.filter(this.filterNullOrUndefined)
          ?.map((track: Track) => this.buildZklinkTrack(track, requester)) || [];

      return { tracks, name: album[0].attributes?.name };
    } catch (e: any) {
      // Debug đã bị xóa - Lỗi không mong đợi trong getAlbum
      return { tracks: [] };
    }
  }

  private async getPlaylist(id: string, requester: unknown): Promise<Result> {
    try {
      const playlist = await this.getData(`/playlists/${id}`).catch((e) => {
        // Debug đã bị xóa - Lỗi khi lấy playlist
        return null;
      });

      if (!playlist || !playlist[0]) {
        return { tracks: [] };
      }

      const tracks =
        playlist[0].relationships?.tracks?.data
          ?.filter(this.filterNullOrUndefined)
          ?.map((track: any) => this.buildZklinkTrack(track, requester)) || [];

      return { tracks, name: playlist[0].attributes?.name };
    } catch (e: any) {
      // Debug đã bị xóa - Lỗi không mong đợi trong getPlaylist
      return { tracks: [] };
    }
  }

  private filterNullOrUndefined(obj: unknown): obj is unknown {
    return obj !== undefined && obj !== null;
  }

  private buildSearch(
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

  private buildZklinkTrack(appleTrack: Track, requester: unknown) {
    const artworkURL = String(appleTrack.attributes.artwork.url)
      .replace("{w}", String(this.imageWidth))
      .replace("{h}", String(this.imageHeight));
    return new ZklinkTrack(
      {
        encoded: "",
        info: {
          sourceName: this.sourceName(),
          identifier: appleTrack.id,
          isSeekable: true,
          author: appleTrack.attributes.artistName ? appleTrack.attributes.artistName : "Không rõ",
          length: appleTrack.attributes.durationInMillis,
          isStream: false,
          position: 0,
          title: appleTrack.attributes.name,
          uri: appleTrack.attributes.url || "",
          artworkUrl: artworkURL ? artworkURL : "",
        },
        pluginInfo: {
          name: "Zklink@apple",
        },
      },
      requester
    );
  }

  private debug(logs: string) {
    // Debug đã bị xóa
  }
}

// Giao diện (Interfaces)
/** @ignore */
export interface Result {
  tracks: ZklinkTrack[];
  name?: string;
}
/** @ignore */
export interface Track {
  id: string;
  type: string;
  href: string;
  attributes: TrackAttributes;
}
/** @ignore */
export interface TrackAttributes {
  albumName: string;
  hasTimeSyncedLyrics: boolean;
  genreNames: any[];
  trackNumber: number;
  releaseDate: string;
  durationInMillis: number;
  isVocalAttenuationAllowed: boolean;
  isMasteredForItunes: boolean;
  isrc: string;
  artwork: Record<string, any>;
  audioLocale: string;
  composerName: string;
  url: string;
  playParams: Record<string, any>;
  discNumber: number;
  hasCredits: boolean;
  hasLyrics: boolean;
  isAppleDigitalMaster: boolean;
  audioTraits: any[];
  name: string;
  previews: any[];
  artistName: string;
}
