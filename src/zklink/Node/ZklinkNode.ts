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
import { log } from "../../utilities/LoggerHelper.js";

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
  private connectionStartTime: number = 0; // Track connection start time

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
      // Debug đã bị xóa - Không tìm thấy driver, sử dụng lavalink v4 thay thế
      this.driver = new Lavalink4();
    } else {
      // Debug đã bị xóa - Đang sử dụng driver
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
    this.connectionStartTime = Date.now(); // Lưu thời gian bắt đầu
    log.info("Lavalink", `Bắt đầu kết nối lavalink: ${this.options.name}(${this.options.host}:${this.options.port})`);
    log.debug("Node connect debug", `Node: ${this.options.name} | Host: ${this.options.host} | Port: ${this.options.port} | Auth: ${this.options.auth?.substring(0, 10)}... | Driver: ${this.options.driver}`);
    
    const ws = this.driver.connect();
    
    // Add timeout để debug connection issues với detailed timing
    const timeoutId = global.setTimeout(() => {
      const elapsed = Date.now() - this.connectionStartTime;
      if (this.state !== ZklinkConnectState.Connected) {
        log.warn("Lavalink connection timeout", `Node: ${this.options.name} | State: ${this.state} | Elapsed: ${elapsed}ms | Still not connected after 10s`);
      }
    }, 10000);
    
    return ws;
  }

  /** @ignore */
  public wsOpenEvent() {
    const wasReconnecting = this.retryCounter > 0;
    const attemptCount = this.retryCounter; // Lưu trước khi clean
    const connectionTime = Date.now() - this.connectionStartTime; // Tính thời gian kết nối
    
    // Prevent duplicate connection events
    if (this.online) {
      log.warn("Duplicate wsOpenEvent", `Node: ${this.options.name} | Host: ${this.options.host}:${this.options.port} | Already online, ignoring duplicate connection`);
      return;
    }
    
    log.debug("wsOpenEvent triggered", `Node: ${this.options.name} | Host: ${this.options.host}:${this.options.port} | WasReconnecting: ${wasReconnecting} | AttemptCount: ${attemptCount} | State: ${this.state} | ConnectionTime: ${connectionTime}ms`);
    
    this.clean(true);
    this.state = ZklinkConnectState.Connected;
    
    if (wasReconnecting) {
      log.info("Lavalink", `Đã khôi phục kết nối: ${this.options.name}(${this.options.host}:${this.options.port}) sau ${attemptCount} lần thử (${connectionTime}ms)`);
    } else {
      log.info("Lavalink", `Kết nối thành công: ${this.options.name}(${this.options.host}:${this.options.port}) (${connectionTime}ms)`);
    }
    
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
    log.error("Lavalink node error", `Node: ${this.options.name} | Error: ${logs.message}`);
    // @ts-ignore
    this.manager.emit(ZklinkEvents.NodeError, this, logs);
  }

  /** @ignore */
  public async wsCloseEvent(code: number, reason: Buffer) {
    this.online = false;
    this.state = ZklinkConnectState.Disconnected;
    const reasonText = reason?.toString() || "Không có lý do";
    
    // Chỉ log disconnect và emit event lần đầu tiên
    if (this.retryCounter === 0) {
      log.warn("Lavalink node disconnected", `Node: ${this.options.name} | Host: ${this.options.host}:${this.options.port} | Code: ${code} | Reason: ${reasonText}`);
      // @ts-ignore - Chỉ emit event lần đầu
      this.manager.emit(ZklinkEvents.NodeDisconnect, this, code, reason);
    }
    
    if (!this.sudoDisconnect) {
      try {
        // Exponential backoff: 3s, 6s, 12s, 24s, 30s (max)
        const backoffDelay = Math.min(
          this.manager.ZklinkOptions.options!.retryTimeout! * Math.pow(2, this.retryCounter),
          30000 // Max 30 seconds
        );
        
        await setTimeout(backoffDelay);
        this.retryCounter = this.retryCounter + 1;
        this.reconnect(true);
      } catch (error) {
        log.error("Lỗi khi reconnect node", `Node: ${this.options.name}`, error as Error);
        this.nodeClosed();
      }
      return;
    }
    
    this.nodeClosed();
    return;
  }

  protected nodeClosed() {
    // @ts-ignore
    this.manager.emit(ZklinkEvents.NodeClosed, this);
    log.info("Lavalink", `Node: ${this.options.name} | Đang dọn dẹp tài nguyên...`);
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
    // Debug đã bị xóa
  }
}
