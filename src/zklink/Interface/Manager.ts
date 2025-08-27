export type Constructor<T> = new (...args: any[]) => T;

export interface Structures {
  rest?: Constructor<>;
}

export interface ZklinkNodeOptions {
  name: string;
  host: string;
  port: number;
  auth: string;
  driver?: string;
}
import { AbstractLibrary } from "../Library/AbstractLibrary.js";
import { ZklinkPlugin } from "../Plugin/ZklinkPlugin.js";
import { ZklinkTrack } from "../Player/ZklinkTrack.js";
import { ZklinkNodeManager } from "../Manager/ZklinkNodeManager.js";
import { ZklinkNode } from "../Node/ZklinkNode.js";
import { ZklinkRest } from "../Node/ZklinkRest.js";
import { ZklinkPlayer } from "../Player/ZklinkPlayer.js";
import { AbstractDriver } from "../Drivers/AbstractDriver.js";
import { ZklinkQueue } from "../Player/ZklinkQueue.js";

/**
 * Giao diện cấu trúc tùy chỉnh
 */
export type Constructor<T> = new (...args: any[]) => T;

export interface Structures {
  /**
   * Cấu trúc tùy chỉnh mở rộng lớp ZklinkRest
   */
  rest?: Constructor<ZklinkRest>;
  /**
   * Cấu trúc tùy chỉnh mở rộng lớp ZklinkPlayer
   */
  player?: Constructor<ZklinkPlayer>;
  /**
   * Cấu trúc tùy chỉnh mở rộng lớp ZklinkQueue
   */
  queue?: Constructor<ZklinkQueue>;
}

/**
 * Giao diện tuỳ chọn node Zklink
 */
export interface ZklinkNodeOptions {
  /** Tên dùng để lấy thông tin server lavalink trong Zklink */
  name: string;
  /** Địa chỉ IP hoặc domain của server lavalink */
  host: string;
  /** Cổng mà server lavalink mở */
  port: number;
  /** Mật khẩu của server lavalink */
  auth: string;
  /** Có sử dụng SSL hay không */
  secure: boolean;
  /** Lớp driver để xử lý phản hồi từ lavalink */
  driver?: string;
}

/**
 * Một số tuỳ chọn cấu hình bổ sung cho Zklink
 */
export interface ZklinkAdditionalOptions {
  /** Driver tùy chỉnh bổ sung cho Zklink */
  additionalDriver?: AbstractDriver[];
  /** Thời gian chờ trước khi thử kết nối lại (ms) */
  retryTimeout?: number;
  /** Số lần thử kết nối lại tới Lavalink trước khi dừng */
  retryCount?: number;
  /** Thời gian chờ retry cho voice manager khi kết nối tới Discord voice (ms) */
  voiceConnectionTimeout?: number;
  /** Công cụ tìm kiếm mặc định (ví dụ: youtube, spotify, ...) */
  defaultSearchEngine?: string;
  /** Âm lượng mặc định khi tạo player */
  defaultVolume?: number;
  /** Tìm bài từ youtube khi resolve bài thất bại */
  searchFallback?: {
    /** Bật/tắt tính năng tìm phụ */
    enable: boolean;
    /** Chọn công cụ tìm phụ, khuyến nghị soundcloud hoặc youtube */
    engine: string;
  };
  /** Có resume kết nối khi ngắt kết nối tới Lavalink (Server Side) (LƯU Ý: KHÔNG RESUME nếu server Lavalink bị tắt) */
  resume?: boolean;
  /** Khi session bị xóa trên Lavalink. Đơn vị giây (Server Side) (LƯU Ý: KHÔNG RESUME nếu server Lavalink bị tắt) */
  resumeTimeout?: number;
  /** User Agent dùng khi gửi yêu cầu tới Lavalink */
  userAgent?: string;
  /** Node Resolver để tùy chỉnh */
  nodeResolver?: (nodes: ZklinkNodeManager) => Promise<ZklinkNode | undefined>;
  /** Cấu trúc tùy chỉnh cho Zklink */
  structures?: Structures;
}

/**
 * Giao diện cấu hình Zklink
 */
export interface ZklinkOptions {
  /** Mảng thông tin đăng nhập server lavalink */
  nodes: ZklinkNodeOptions[];
  /** Thư viện Discord để dùng voice manager, ví dụ: discordjs, erisjs. Xem {@link Library} */
  library: AbstractLibrary;
  /** Mảng plugin Zklink. Xem {@link Plugin} */
  plugins?: ZklinkPlugin[];
  /** Tuỳ chọn bổ sung cho Zklink */
  options?: ZklinkAdditionalOptions;
}

/**
 * Kiểu enum cho kết quả hàm tìm kiếm của Zklink
 */
export enum ZklinkSearchResultType {
  TRACK = "TRACK",
  PLAYLIST = "PLAYLIST",
  SEARCH = "SEARCH",
}

/**
 * Giao diện kết quả tìm kiếm của Zklink
 */
export interface ZklinkSearchResult {
  type: ZklinkSearchResultType;
  playlistName?: string;
  tracks: ZklinkTrack[];
}

/**
 * Giao diện tuỳ chọn cho hàm tìm kiếm Zklink
 */
export interface ZklinkSearchOptions {
  /** Thông tin người dùng đã yêu cầu bài hát */
  requester?: unknown;
  /** Node muốn sử dụng (lấy bằng tên node) */
  nodeName?: string;
  /** Công cụ tìm kiếm muốn sử dụng (lấy bằng tên) */
  engine?: string;
}
