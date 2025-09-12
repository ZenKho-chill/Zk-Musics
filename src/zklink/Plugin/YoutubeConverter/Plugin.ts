import { ZklinkTrack } from "../../main.js";
import { ZklinkPluginType } from "../../main.js";
import { ZklinkSearchOptions, ZklinkSearchResult, ZklinkSearchResultType } from "../../main.js";
import { Zklink } from "../../main.js";
import { ZklinkPlugin as Plugin } from "../../main.js";

const YOUTUBE_REGEX = [
  /^https?:\/\//,
  /(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be.com\/\S*(?:watch|embed)(?:(?:(?=\/[-a-zA-Z0-9_]{11,}(?!\S))\/)|(?:\S*v=|v\/)))([-a-zA-Z0-9_]{11,})/,
  /^.*(youtu.be\/|list=)([^#\&\?]*).*/,
];

export type YoutubeConvertOptions = {
  /**
   * Thứ tự các nguồn sẽ thay thế tìm kiếm trên YouTube, ví dụ: scsearch, spsearch.
   * Thêm nhiều nguồn sẽ làm giảm hiệu năng.
   */
  sources?: string[];
};

export class ZklinkPlugin extends Plugin {
  private options: YoutubeConvertOptions;
  private _search?: (query: string, options?: ZklinkSearchOptions) => Promise<ZklinkSearchResult>;
  constructor(options?: YoutubeConvertOptions) {
    super();
    this.options = options ?? { sources: ["scsearch"] };
    if (!this.options.sources || this.options.sources.length == 0)
      this.options.sources = ["scsearch"];
  }
  /** Hàm trả về tên plugin */
  public name(): string {
    return "Zklink-youtubeConvert";
  }

  /** Hàm trả về loại plugin */
  public type(): ZklinkPluginType {
    return ZklinkPluginType.Default;
  }

  /** Hàm load để kích hoạt plugin */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public load(manager: Zklink): void {
    this._search = manager.search.bind(manager);
    manager.search = this.search.bind(this);
  }

  /** Hàm unload để dừng plugin */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public unload(manager: Zklink): void {
    if (!this._search) return;
    manager.search = this._search.bind(manager);
    this._search = undefined;
  }

  private async search(query: string, options?: ZklinkSearchOptions): Promise<ZklinkSearchResult> {
    // Kiểm tra xem hàm tìm kiếm có sẵn không
    if (!this._search) return this.buildSearch(undefined, [], ZklinkSearchResultType.SEARCH);

    // Kiểm tra xem query có phải link YouTube không
    const match = YOUTUBE_REGEX.some((match) => {
      return match.test(query) == true;
    });
    if (!match) return await this._search(query, options);

    // Lấy truy vấn tìm kiếm từ track
    const preRes = await this._search(query, options);
    if (preRes.tracks.length == 0) return preRes;

    // Xoá trường encoded của track để 'lách' Zklink
    if (preRes.type == ZklinkSearchResultType.PLAYLIST) {
      for (const track of preRes.tracks) {
        track.encoded = "";
      }
      return preRes;
    }

    const song = preRes.tracks[0];
    const searchQuery = [song.author, song.title].filter((x) => !!x).join(" - ");
    const res = await this.searchEngine(searchQuery, options);
    if (res.tracks.length !== 0) return res;
    return preRes;
  }

  private async searchEngine(
    query: string,
    options?: ZklinkSearchOptions
  ): Promise<ZklinkSearchResult> {
    if (!this._search) return this.buildSearch(undefined, [], ZklinkSearchResultType.SEARCH);
    // Duyệt qua các nguồn đã cấu hình, thử từng nguồn để tìm kết quả
    for (const SearchParams of this.options.sources!) {
      const res = await this._search(`directSearch=${SearchParams}:${query}`, options);
      if (res.tracks.length !== 0) return res;
    }
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
      type: type ?? ZklinkSearchResultType.SEARCH,
    };
  }
}
