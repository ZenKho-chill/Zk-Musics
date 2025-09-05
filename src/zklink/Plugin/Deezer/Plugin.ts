import {
  ZklinkSearchOptions,
  ZklinkSearchResult,
  ZklinkSearchResultType,
} from "../../Interface/Manager.js";
import { Zklink } from "../../Zklink.js";
import { ZklinkTrack } from "../../Player/ZklinkTrack.js";
import { SourceZklinkPlugin } from "../SourceZklinkPlugin.js";
import { ZklinkEvents, ZklinkPluginType } from "../../Interface/Constants.js";
import { fetch } from "undici";

const API_URL = "https://api.deezer.com/";
const REGEX =
  /^https?:\/\/(?:www\.)?deezer\.com\/[a-z]+\/(track|album|playlist)\/(\d+)$/;
const SHORT_REGEX = /^https:\/\/deezer\.page\.link\/[a-zA-Z0-9]{12}$/;

export class ZklinkPlugin extends SourceZklinkPlugin {
  private manager: Zklink | null;
  private _search?: (
    query: string,
    options?: ZklinkSearchOptions
  ) => Promise<ZklinkSearchResult>;
  private readonly methods: Record<
    string,
    (id: string, requester: unknown) => Promise<Result>
  >;
  /**
   * Mã nhận diện nguồn của plugin
   * @returns string
   */
  public sourceIdentify(): string {
    return "dz";
  }

  /**
   * Tên nguồn của plugin
   * @returns string
   */
  public sourceName(): string {
    return "deezer";
  }

  /**
   * Loại plugin
   * @returns ZklinkPluginType
   */
  public type(): ZklinkPluginType {
    return ZklinkPluginType.SourceResolver;
  }

  /**
   * Khởi tạo plugin
   */
  constructor() {
    super();
    this.methods = {
      track: this.getTrack.bind(this),
      album: this.getAlbum.bind(this),
      playlist: this.getPlaylist.bind(this),
    };
    this.manager = null;
    this._search = undefined;
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

  /** Tên hàm để lấy tên plugin */
  public name(): string {
    return "Zklink-deezer";
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
    if (!this.manager || !this._search)
      throw new Error("Zklink-deezer chưa được tải.");

    if (!query) throw new Error("Cần truyền query");

    const isUrl = /^https?:\/\//.test(query);

    if (SHORT_REGEX.test(query)) {
      const url = new URL(query);
      const res = await fetch(url.origin + url.pathname, { method: "HEAD" });
      query = String(res.headers.get("location"));
    }

    const [, type, id] = REGEX.exec(query) || [];

    if (type in this.methods) {
      this.debug(`Bắt đầu tìm kiếm từ plugin ${this.sourceName()}`);
      try {
        const _function = this.methods[type];
        const result: Result = await _function(id, options?.requester);

        const loadType =
          type === "track"
            ? ZklinkSearchResultType.TRACK
            : ZklinkSearchResultType.PLAYLIST;
        const playlistName = result.name ?? undefined;

        const tracks = result.tracks.filter(this.filterNullOrUndefined);
        return this.buildSearch(playlistName, tracks, loadType);
      } catch (e) {
        return this.buildSearch(undefined, [], ZklinkSearchResultType.SEARCH);
      }
    } else if (options?.engine === this.sourceName() && !isUrl) {
      const result = await this.searchTrack(query, options?.requester);

      return this.buildSearch(
        undefined,
        result.tracks,
        ZklinkSearchResultType.SEARCH
      );
    } else
      return this.buildSearch(undefined, [], ZklinkSearchResultType.SEARCH);
  }

  private async searchTrack(
    query: string,
    requester: unknown
  ): Promise<Result> {
    try {
      const req = await fetch(
        `${API_URL}/search/track?q=${decodeURIComponent(query)}`
      );
      const data = await req.json();

      const res = data as SearchResult;
      return {
        tracks: res?.data?.map((track) =>
          this.buildZklinkTrack(track, requester)
        ),
      };
    } catch (e: any) {
      throw new Error(e);
    }
  }

  private async getTrack(id: string, requester: unknown): Promise<Result> {
    try {
      const request = await fetch(`${API_URL}/track/${id}/`);
      const data = await request.json();
      const track = data as DeezerTrack;

      return { tracks: [this.buildZklinkTrack(track, requester)] };
    } catch (e: any) {
      throw new Error(e);
    }
  }

  private async getAlbum(id: string, requester: unknown): Promise<Result> {
    try {
      const request = await fetch(`${API_URL}/album/${id}/`);
      const data = await request.json();
      const album = data as Album;

      const tracks = album.tracks.data
        .filter(this.filterNullOrUndefined)
        .map((track) => this.buildZklinkTrack(track, requester));

      return { tracks, name: album.title };
    } catch (e: any) {
      throw new Error(e);
    }
  }

  private async getPlaylist(id: string, requester: unknown): Promise<Result> {
    try {
      const request = await fetch(`${API_URL}/playlist/${id}`);
      const data = await request.json();
      const playlist = data as Playlist;

      const tracks = playlist.tracks.data
        .filter(this.filterNullOrUndefined)
        .map((track) => this.buildZklinkTrack(track, requester));

      return { tracks, name: playlist.title };
    } catch (e: any) {
      throw new Error(e);
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

  private buildZklinkTrack(dezzerTrack: any, requester: unknown) {
    return new ZklinkTrack(
      {
        encoded: "",
        info: {
          sourceName: this.sourceName(),
          identifier: dezzerTrack.id,
          isSeekable: true,
          author: dezzerTrack.artist ? dezzerTrack.artist.name : "Không rõ",
          length: dezzerTrack.duration * 1000,
          isStream: false,
          position: 0,
          title: dezzerTrack.title,
          uri: `https://www.deezer.com/track/${dezzerTrack.id}`,
          artworkUrl: dezzerTrack.album ? dezzerTrack.album.cover : "",
        },
        pluginInfo: {
          name: "Zklink@deezer",
        },
      },
      requester
    );
  }

  private debug(logs: string) {
    this.manager
      ? // @ts-ignore
        this.manager.emit(
          ZklinkEvents.Debug,
          `[Zklink] / [Plugin] / [Deezer] | ${logs}`
        )
      : true;
  }
}

// Giao diện (Interfaces)
/** @ignore */
interface Result {
  tracks: ZklinkTrack[];
  name?: string;
}
/** @ignore */
interface Album {
  title: string;
  tracks: AlbumTracks;
}
/** @ignore */
interface AlbumTracks {
  data: DeezerTrack[];
  next: string | null;
}
/** @ignore */
interface Playlist {
  tracks: PlaylistTracks;
  title: string;
}
/** @ignore */
interface PlaylistTracks {
  data: DeezerTrack[];
  next: string | null;
}
/** @ignore */
interface DeezerTrack {
  data: ZklinkTrack[];
}
/** @ignore */
interface SearchResult {
  exception?: {
    severity: string;
    message: string;
  };
  loadType: string;
  playlist?: {
    duration_ms: number;
    name: string;
  };
  data: ZklinkTrack[];
}
