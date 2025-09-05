import { ZklinkEvents } from "../Interface/Constants.js";
import { Zklink } from "../Zklink.js";
import { ZklinkPlayer } from "./ZklinkPlayer.js";
import { ZklinkTrack } from "./ZklinkTrack.js";

export class ZklinkQueue extends Array<ZklinkTrack> {
  /** Quản lý Zklink */
  manager: Zklink;
  /** Player của Zklink */
  player: ZklinkPlayer;

  /**
   * Lớp xử lý hàng đợi track của Zklink
   * @param manager Quản lý Zklink
   * @param player Player Zklink hiện tại
   */
  constructor(manager: Zklink, player: ZklinkPlayer) {
    super();
    this.manager = manager;
    this.player = player;
  }

  /** Lấy kích thước hàng đợi */
  public get size() {
    return this.length;
  }

  /** Lấy kích thước hàng đợi bao gồm track đang phát */
  public get totalSize(): number {
    return this.length + (this.current ? 1 : 0);
  }

  /** Kiểm tra hàng đợi có rỗng hay không */
  public get isEmpty() {
    return this.length === 0;
  }

  /** Lấy tổng thời lượng của hàng đợi */
  public get duration() {
    return this.reduce((acc, cur) => acc + (cur.duration || 0), 0);
  }

  /** Track đang phát hiện tại */
  public current: ZklinkTrack | undefined | null = null;
  /** Các track đã phát trước đó */
  public previous: ZklinkTrack[] = [];

  /**
   * Thêm track vào hàng đợi
   * @param track Track (hoặc mảng track) cần thêm
   * @returns ZklinkQueue
   */
  public add(track: ZklinkTrack | ZklinkTrack[]): ZklinkQueue {
    if (Array.isArray(track) && track.some((t) => !(t instanceof ZklinkTrack)))
      throw new Error("Track phải là một instance của ZklinkTrack");
    if (!Array.isArray(track) && !(track instanceof ZklinkTrack))
      track = [track];

    if (!this.current) {
      if (Array.isArray(track)) this.current = track.shift();
      else {
        this.current = track;
        return this;
      }
    }

    if (Array.isArray(track)) for (const t of track) this.push(t);
    else this.push(track);
    // @ts-ignore
    this.manager.emit(ZklinkEvents.QueueAdd, this.player, this, track);
    return this;
  }

  /**
   * Xoá track khỏi hàng đợi
   * @param position Vị trí track trong hàng đợi
   * @returns ZklinkQueue
   */
  public remove(position: number): ZklinkQueue {
    if (position < 0 || position >= this.length)
      throw new Error("Vị trí phải nằm giữa 0 và " + (this.length - 1));
    const track = this[position];
    this.splice(position, 1);
    // @ts-ignore
    this.manager.emit(ZklinkEvents.QueueRemove, this.player, this, track);
    return this;
  }

  /** Trộn (shuffle) hàng đợi */
  public shuffle(): ZklinkQueue {
    for (let i = this.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this[i], this[j]] = [this[j], this[i]];
    }
    // @ts-ignore
    this.manager.emit(ZklinkEvents.QueueShuffle, this.player, this);
    return this;
  }

  /** Xoá toàn bộ hàng đợi */
  public clear(): ZklinkQueue {
    this.splice(0, this.length);
    // @ts-ignore
    this.manager.emit(ZklinkEvents.QueueClear, this.player, this);
    return this;
  }
}
