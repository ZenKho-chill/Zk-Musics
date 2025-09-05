import { request } from "undici";
import { ZklinkPluginType } from "../../Interface/Constants.js";
import {
  ZklinkSearchOptions,
  ZklinkSearchResult,
  ZklinkSearchResultType,
} from "../../Interface/Manager.js";
import { ZklinkTrack } from "../../Player/ZklinkTrack.js";
import { Zklink } from "../../Zklink.js";
import { SourceZklinkPlugin } from "../SourceZklinkPlugin.js";
import { RequestManager } from "./RequestManager.js";

const REGEX =
  /(?:https:\/\/open\.spotify\.com\/|spotify:)(?:.+)?(track|playlist|album|artist)[\/:]([A-Za-z0-9]+)/;
const SHORT_REGEX = /(?:https:\/\/spotify\.link)\/([A-Za-z0-9]+)/;

/** Tùy chọn plugin Spotify cho Zklink */
export interface SpotifyOptions {
  /** Client ID của ứng dụng Spotify của bạn. */
  clientId: string;
  /** Client secret của ứng dụng Spotify của bạn. */
  clientSecret: string;
  /** Danh sách client cho nhiều ứng dụng Spotify. KHÔNG KHUYẾN NGHỊ */
  clients?: { clientId: string; clientSecret: string }[];
  /** 100 bài hát mỗi trang */
  playlistPageLimit?: number;
  /** 50 bài hát mỗi trang */
  albumPageLimit?: number;
  /** Giới hạn số bài khi tìm kiếm track */
  searchLimit?: number;
  /** Nhập mã quốc gia bạn đang sống (2 ký tự, ví dụ: US, IN, EN) */
  searchMarket?: string;
}

export class ZklinkPlugin extends SourceZklinkPlugin {
  /**
   * The options of the plugin.
   */
  public options: SpotifyOptions;

  private _search:
    | ((
        query: string,
        options?: ZklinkSearchOptions
      ) => Promise<ZklinkSearchResult>)
    | null;
  private Zklink: Zklink | null;

  private readonly methods: Record<
    string,
    (id: string, requester: unknown) => Promise<Result>
  >;
  private requestManager: RequestManager;

  /**
   * Khởi tạo plugin.
   * @param spotifyOptions Tùy chọn khi chạy plugin
   */
  constructor(spotifyOptions: SpotifyOptions) {
    super();
    this.options = spotifyOptions;
    this.requestManager = new RequestManager(spotifyOptions);

    this.methods = {
      track: this.getTrack.bind(this),
      album: this.getAlbum.bind(this),
      artist: this.getArtist.bind(this),
      playlist: this.getPlaylist.bind(this),
    };
    this.Zklink = null;
    this._search = null;
  }

  /**
   * Nhận diện nguồn của plugin
   * @returns string
   */
  public sourceIdentify(): string {
    return "sp";
  }

  /**
   * Tên nguồn của plugin
   * @returns string
   */
  public sourceName(): string {
    return "spotify";
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
   * @param Zklink Lớp Zklink
   */
  public load(Zklink: Zklink) {
    this.Zklink = Zklink;
    this._search = Zklink.search.bind(Zklink);
    Zklink.search = this.search.bind(this);
  }

  /**
   * Gỡ tải plugin
   * @param Zklink Lớp Zklink
   */
  public unload(Zklink: Zklink) {
    this.Zklink = Zklink;
    Zklink.search = Zklink.search.bind(Zklink);
  }

  /** Hàm trả về tên plugin */
  public name(): string {
    return "Zklink-spotify";
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
   * @param options Tùy chọn tìm kiếm kiểu ZklinkSearchOptions
   * @returns ZklinkSearchResult
   */
  public async searchDirect(
    query: string,
    options?: ZklinkSearchOptions | undefined
  ): Promise<ZklinkSearchResult> {
    if (!this.Zklink || !this._search)
      throw new Error("Zklink-spotify chưa được tải.");

    if (!query) throw new Error("Cần truyền query");

    const isUrl = /^https?:\/\//.test(query);

    if (SHORT_REGEX.test(query)) {
      const res = await fetch(query, { method: "HEAD" });
      query = String(res.headers.get("location"));
    }

    const [, type, id] = REGEX.exec(query) || [];

    if (type in this.methods) {
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

  private async searchTrack(
    query: string,
    requester: unknown
  ): Promise<Result> {
    const limit =
      this.options.searchLimit &&
      this.options.searchLimit > 0 &&
      this.options.searchLimit < 50
        ? this.options.searchLimit
        : 10;
    const tracks = await this.requestManager.makeRequest<SearchResult>(
      `/search?q=${decodeURIComponent(
        query
      )}&type=track&limit=${limit}&market=${this.options.searchMarket ?? "US"}`
    );
    return {
      tracks: tracks.tracks.items.map((track) =>
        this.buildZklinkTrack(track, requester)
      ),
    };
  }

  private async getTrack(id: string, requester: unknown): Promise<Result> {
    const track = await this.requestManager.makeRequest<TrackResult>(
      `/tracks/${id}`
    );
    return { tracks: [this.buildZklinkTrack(track, requester)] };
  }

  private async getAlbum(id: string, requester: unknown): Promise<Result> {
    const album = await this.requestManager.makeRequest<AlbumResult>(
      `/albums/${id}?market=${this.options.searchMarket ?? "US"}`
    );
    const tracks = album.tracks.items
      .filter(this.filterNullOrUndefined)
      .map((track) =>
        this.buildZklinkTrack(track, requester, album.images[0]?.url)
      );

    if (album && tracks.length) {
      let next = album.tracks.next;
      let page = 1;

      while (
        next &&
        (!this.options.playlistPageLimit
          ? true
          : page < this.options.playlistPageLimit)
      ) {
        const nextTracks =
          await this.requestManager.makeRequest<PlaylistTracks>(
            next ?? "",
            true
          );
        page++;
        if (nextTracks.items.length) {
          next = nextTracks.next;
          tracks.push(
            ...nextTracks.items
              .filter(this.filterNullOrUndefined)
              .filter((a) => a.track)
              .map((track) =>
                this.buildZklinkTrack(
                  track.track!,
                  requester,
                  album.images[0]?.url
                )
              )
          );
        }
      }
    }

    return { tracks, name: album.name };
  }

  private async getArtist(id: string, requester: unknown): Promise<Result> {
    const artist = await this.requestManager.makeRequest<Artist>(
      `/artists/${id}`
    );
    const fetchedTracks = await this.requestManager.makeRequest<ArtistResult>(
      `/artists/${id}/top-tracks?market=${this.options.searchMarket ?? "US"}`
    );

    const tracks = fetchedTracks.tracks
      .filter(this.filterNullOrUndefined)
      .map((track) =>
        this.buildZklinkTrack(track, requester, artist.images[0]?.url)
      );

    return { tracks, name: artist.name };
  }

  private async getPlaylist(id: string, requester: unknown): Promise<Result> {
    const playlist = await this.requestManager.makeRequest<PlaylistResult>(
      `/playlists/${id}?market=${this.options.searchMarket ?? "US"}`
    );

    const tracks = playlist.tracks.items
      .filter(this.filterNullOrUndefined)
      .map((track) =>
        this.buildZklinkTrack(track.track, requester, playlist.images[0]?.url)
      );

    if (playlist && tracks.length) {
      let next = playlist.tracks.next;
      let page = 1;
      while (
        next &&
        (!this.options.playlistPageLimit
          ? true
          : page < this.options.playlistPageLimit)
      ) {
        const nextTracks =
          await this.requestManager.makeRequest<PlaylistTracks>(
            next ?? "",
            true
          );
        page++;
        if (nextTracks.items.length) {
          next = nextTracks.next;
          tracks.push(
            ...nextTracks.items
              .filter(this.filterNullOrUndefined)
              .filter((a) => a.track)
              .map((track) =>
                this.buildZklinkTrack(
                  track.track!,
                  requester,
                  playlist.images[0]?.url
                )
              )
          );
        }
      }
    }
    return { tracks, name: playlist.name };
  }

  private filterNullOrUndefined(obj: unknown): obj is unknown {
    return obj !== undefined && obj !== null;
  }

  private buildZklinkTrack(
    spotifyTrack: Track,
    requester: unknown,
    thumbnail?: string
  ) {
    return new ZklinkTrack(
      {
        encoded: "",
        info: {
          sourceName: "spotify",
          identifier: spotifyTrack.id,
          isSeekable: true,
          author: spotifyTrack.artists[0]
            ? spotifyTrack.artists[0].name
            : "Không rõ",
          length: spotifyTrack.duration_ms,
          isStream: false,
          position: 0,
          title: spotifyTrack.name,
          uri: `https://open.spotify.com/track/${spotifyTrack.id}`,
          artworkUrl: thumbnail
            ? thumbnail
            : spotifyTrack.album?.images[0]?.url,
        },
        pluginInfo: {
          name: this.name(),
        },
      },
      requester
    );
  }
}

/** @ignore */
export interface SearchResult {
  tracks: Tracks;
}
/** @ignore */
export interface Result {
  tracks: ZklinkTrack[];
  name?: string;
}
/** @ignore */
export interface TrackResult {
  album: Album;
  artists: Artist[];
  available_markets: string[];
  disc_number: number;

  duration_ms: number;
  explicit: boolean;
  external_ids: ExternalIds;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  is_local: boolean;
  name: string;
  popularity: number;
  preview_url: string;
  track: any;
  track_number: number;
  type: string;
  uri: string;
}
/** @ignore */
export interface AlbumResult {
  album_type: string;
  artists: Artist[];
  available_markets: string[];
  copyrights: Copyright[];
  external_ids: ExternalIds;
  external_urls: ExternalUrls;
  genres: string[];
  href: string;
  id: string;
  images: Image[];
  label: string;
  name: string;
  popularity: number;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  tracks: Tracks;
  type: string;
  uri: string;
}
/** @ignore */
export interface ArtistResult {
  tracks: Track[];
}
/** @ignore */
export interface PlaylistResult {
  collaborative: boolean;
  description: string;
  external_urls: ExternalUrls;
  followers: Followers;
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: Owner;
  primary_color: string | null;
  public: boolean;
  snapshot_id: string;
  tracks: PlaylistTracks;
  type: string;
  uri: string;
}
/** @ignore */
export interface Owner {
  display_name: string;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  type: string;
  uri: string;
}
/** @ignore */
export interface Followers {
  href: string | null;
  total: number;
}
/** @ignore */
export interface Tracks {
  href: string;
  items: Track[];
  next: string | null;
}
/** @ignore */
export interface PlaylistTracks {
  href: string;
  items: SpecialTracks[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}
/** @ignore */
export interface SpecialTracks {
  added_at: string;
  is_local: boolean;
  primary_color: string | null;
  track: Track;
}
/** @ignore */
export interface Copyright {
  text: string;
  type: string;
}
/** @ignore */
export interface ExternalUrls {
  spotify: string;
}
/** @ignore */
export interface ExternalIds {
  isrc: string;
}
/** @ignore */
export interface Album {
  album_type: string;
  artists: Artist[];
  available_markets: string[];
  external_urls: { [key: string]: string };
  href: string;
  id: string;
  images: Image[];
  name: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  type: string;
  uri: string;
}
/** @ignore */
export interface Image {
  height: number;
  url: string;
  width: number;
}
/** @ignore */
export interface Artist {
  external_urls: {
    spotify: string;
  };
  followers: {
    href: string;
    total: number;
  };
  genres: [];
  href: string;
  id: string;
  images: Image[];
  name: string;
  popularity: number;
  type: string;
  uri: string;
}
/** @ignore */
export interface Track {
  album?: Album;
  artists: Artist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  is_local: boolean;
  name: string;
  preview_url: string;
  track_number: number;
  type: string;
  uri: string;
}
