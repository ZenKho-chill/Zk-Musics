import { ZklinkNodeOptions } from "../Interface/Manager.js";
import { Zklink } from "../Zklink.js";
import { ZklinkConnectState, ZklinkEvents } from "../Interface/Constants.js";
import { ZklinkRest } from "./ZklinkRest.js";
import { setTimeout } from "node:timers/promises";
import { ZklinkPlayerEvents } from "./ZklinkPlayerEvents.js";
import { LavalinkEventsEnum } from "../Interface/LavalinkEvents.js";
import { LavalinkNodeStatsResponse, NodeStats } from "../Interface/Node.js";
import { AbstractDriver } from "../Drivers/AbstractDriver.js";
// Trình điều khiển
import { Lavalink4 } from "../Drivers/Lavalink4.js";
import { ZklinkWebsocket } from "../Utilities/ZklinkWebsocket.js";

export class ZklinkNode {
  /** Quản lý Zklink */
  public manager: Zklink;
  /** Tùy chọn node Zklink */
  public options: ZklinkNodeOptions;
  /** Quản lý REST của Zklink */
  public rest: ZklinkRest;
  /** Trạng thái online của server lavalink */
  public online: boolean = false;
  protected retryCounter = 0;
  /** Trạng thái kết nối của server lavalink */
  public state: ZklinkConnectState = ZklinkConnectState.Closed;
  /** Toàn bộ trạng thái của server lavalink */
  public stats: NodeStats;
  protected sudoDisconnect = false;
  protected wsEvent: ZklinkPlayerEvents;
  /** Driver để kết nối tới phiên bản hiện tại của Nodelink/Lavalink */
  public driver: AbstractDriver;

  /**
   * Lớp xử lý server lavalink
   * @param manager Zklink manager
   * @param options Tùy chọn server lavalink
   */
  constructor(manager: Zklink, options: ZklinkNodeOptions) {
    this.manager = manager;
    this.options = options;
    const getDriver = this.manager.drivers.filter((driver) => driver.id === options.driver);
    if (!getDriver || getDriver.length == 0) {
      this.debug("Không tìm thấy driver");
      this.driver = new Lavalink4();
    } else {
      this.debug(`Đang sử dụng driver: ${getDriver[0].id}`);
      this.driver = getDriver[0];
    }
    this.driver.initial(manager, this);
    const customRest =
      this.manager.ZklinkOptions.options!.structures &&
      this.manager.ZklinkOptions.options!.structures.rest;
    this.rest = customRest
      ? new customRest(manager, options, this)
      : new ZklinkRest(manager, options, this);
    this.wsEvent = new ZklinkPlayerEvents();
    this.stats = {
      players: 0,
      playingPlayers: 0,
      uptime: 0,
      memory: {
        free: 0,
        used: 0,
        allocated: 0,
        reservable: 0,
      },
      cpu: {
        cores: 0,
        systemLoad: 0,
        lavalinkLoad: 0,
      },
      frameStats: {
        sent: 0,
        nulled: 0,
        deficit: 0,
      },
    };
  }

  /** Kết nối tới server lavalink này */
  public connect(): ZklinkWebsocket {
    return this.driver.connect();
  }

  /** @ignore */
  public wsOpenEvent() {
    this.clean(true);
    this.state = ZklinkConnectState.Connected;
    this.debug(`Node đã kết nối! URL: ${this.driver.wsUrl}`);
    // @ts-ignore
    this.manager.emit(ZklinkEvents.NodeConnect, this);
  }

  /** @ignore */
  public wsMessageEvent(data: Record<string, any>) {
    switch (data.op) {
      case LavalinkEventsEnum.Ready: {
        const isResume = this.manager.ZklinkOptions.options!.resume;
        const timeout = this.manager.ZklinkOptions.options?.resumeTimeout;
        this.driver.sessionId = data.sessionId;
        const customRest =
          this.manager.ZklinkOptions.options!.structures &&
          this.manager.ZklinkOptions.options!.structures.rest;
        this.rest = customRest
          ? new customRest(this.manager, this.options, this)
          : new ZklinkRest(this.manager, this.options, this);
        if (isResume && timeout) {
          this.driver.updateSession(data.sessionId, isResume, timeout);
        }
        break;
      }
      case LavalinkEventsEnum.Event: {
        this.wsEvent.initial(data, this.manager);
        break;
      }
      case LavalinkEventsEnum.PlayerUpdate: {
        this.wsEvent.initial(data, this.manager);
        break;
      }
      case LavalinkEventsEnum.Status: {
        this.stats = this.updateStatusData(data as LavalinkNodeStatsResponse);
        break;
      }
    }
  }

  /** @ignore */
  public wsErrorEvent(logs: Error) {
    this.debug(`Node gặp lỗi! URL: ${this.driver.wsUrl}`);
    // @ts-ignore
    this.manager.emit(ZklinkEvents.NodeError, this, logs);
  }

  /** @ignore */
  public async wsCloseEvent(code: number, reason: Buffer) {
    this.online = false;
    this.state = ZklinkConnectState.Disconnected;
    this.debug(`Node đã ngắt kết nối! URL: ${this.driver.wsUrl}`);
    // @ts-ignore
    this.manager.emit(ZklinkEvents.NodeDisconnect, this, code, reason);
    if (
      !this.sudoDisconnect &&
      this.retryCounter !== this.manager.ZklinkOptions.options!.retryCount
    ) {
      await setTimeout(this.manager.ZklinkOptions.options!.retryTimeout);
      this.retryCounter = this.retryCounter + 1;
      this.reconnect(true);
      return;
    }
    this.nodeClosed();
    return;
  }

  protected nodeClosed() {
    // @ts-ignore
    this.manager.emit(ZklinkEvents.NodeClosed, this);
    this.debug(`Node đã đóng! URL: ${this.driver.wsUrl}`);
    this.clean();
  }

  protected updateStatusData(data: LavalinkNodeStatsResponse): NodeStats {
    return {
      players: data.players ?? this.stats.players,
      playingPlayers: data.playingPlayers ?? this.stats.playingPlayers,
      uptime: data.uptime ?? this.stats.uptime,
      memory: data.memory ?? this.stats.memory,
      cpu: data.cpu ?? this.stats.cpu,
      frameStats: data.frameStats ?? this.stats.frameStats,
    };
  }

  /** Ngắt kết nối khỏi server lavalink này */
  public disconnect() {
    this.sudoDisconnect = true;
    this.driver.wsClose();
  }

  /** Kết nối lại tới server lavalink này */
  public reconnect(noClean: boolean) {
    if (!noClean) this.clean();
    this.driver.connect();
  }

  /** Dọn sạch trạng thái server lavalink và đặt về giá trị mặc định */
  public clean(online: boolean = false) {
    this.sudoDisconnect = false;
    this.retryCounter = 0;
    this.online = online;
    this.state = ZklinkConnectState.Closed;
  }

  protected debug(logs: string) {
    // @ts-ignore
    this.manager.emit(ZklinkEvents.Debug, `[Zklink] / [Nút @ ${this.options.name}] | ${logs}`);
  }
}
