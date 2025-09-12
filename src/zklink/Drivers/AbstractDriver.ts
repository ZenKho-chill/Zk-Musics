import { ZklinkRequesterOptions } from "../Interface/Rest.js";
import { ZklinkDatabase } from "../Utilities/ZklinkDatabase.js";
import { ZklinkNode } from "../Node/ZklinkNode.js";
import { ZklinkWebsocket } from "../Utilities/ZklinkWebsocket.js";
import { ZklinkPlayer } from "../Player/ZklinkPlayer.js";
import { Zklink } from "../Zklink.js";

export abstract class AbstractDriver {
  /** Id cho driver */
  abstract id: string;
  /** URL WS để kết nối tới server lavalink/nodelink */
  abstract wsUrl: string;
  /** URL HTTP để gửi yêu cầu REST tới server lavalink/nodelink */
  abstract httpUrl: string;
  /** ID phiên (session) của lavalink để resume */
  abstract sessionId: string | null;
  /** Tập các hàm mở rộng hỗ trợ driver trên lớp ZklinkPlayer */
  abstract playerFunctions: ZklinkDatabase<(player: ZklinkPlayer, ...args: any) => unknown>;
  /** Tập các hàm mở rộng hỗ trợ driver trên lớp Zklink */
  abstract functions: ZklinkDatabase<(manager: Zklink, ...args: any) => unknown>;
  /** Lớp quản lý Zklink */
  abstract manager: Zklink | null;
  /** Node lavalink/nodelink mà Zklink yêu cầu */
  abstract node: ZklinkNode | null;

  /**
   * Thiết lập dữ liệu và thông tin xác thực để kết nối tới server lavalink/nodelink
   * @returns void
   */
  abstract initial(manager: Zklink, node: ZklinkNode): void;
  /**
   * Kết nối tới server lavalink/nodelink
   * @returns WebSocket
   */
  abstract connect(): ZklinkWebsocket;
  /**
   * Hàm fetch để gửi yêu cầu REST tới server lavalink/nodelink
   * @returns Promise<D | undefined>
   */
  abstract requester<D = any>(options: ZklinkRequesterOptions): Promise<D | undefined>;
  /**
   * Đóng kết nối tới lavalink/nodelink
   * @returns void
   */
  abstract wsClose(): void;
  /**
   * Cập nhật session để cho phép (hoặc không) resume
   * @returns void
   */
  abstract updateSession(sessionId: string, mode: boolean, timeout: number): Promise<void>;
}
