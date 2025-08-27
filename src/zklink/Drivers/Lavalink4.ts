import { Zklink } from "../Zklink.js";
import { metadata } from "../metadata.js";
import { ZklinkEvents } from "../Interface/Constants.js";
import { ZklinkRequesterOptions } from "../Interface/Rest.js";
import { ZklinkNode } from "../Node/ZklinkNode.js";
import { AbstractDriver } from "./AbstractDriver.js";
import util from "node:util";
import { ZklinkPlayer } from "../Player/ZklinkPlayer.js";
import { ZklinkWebsocket } from "../Utilities/ZklinkWebsocket.js";
import { ZklinkDatabase } from "../Utilities/ZklinkDatabase.js";

export class Lavalink4 extends AbstractDriver {
  public id: string = "lavalink/v4";
  public wsUrl: string = "";
  public httpUrl: string = "";
  public sessionId: string | null;
  public playerFunctions: ZklinkDatabase<
    (player: ZklinkPlayer, ...args: any) => unknown
  >;
  public functions: ZklinkDatabase<(manager: Zklink, ...args: any) => unknown>;
  protected wsClient?: ZklinkWebsocket;
  public manager: Zklink | null = null;
  public node: ZklinkNode | null = null;

  constructor() {
    super();
    this.playerFunctions = new ZklinkDatabase<
      (player: ZklinkPlayer, ...args: any) => unknown
    >();
    this.functions = new ZklinkDatabase<
      (manager: Zklink, ...args: any) => unknown
    >();
    this.sessionId = null;
  }

  public get isRegistered(): boolean {
    return (
      this.manager !== null &&
      this.node !== null &&
      this.wsUrl.length !== 0 &&
      this.httpUrl.length !== 0
    );
  }

  public initial(manager: Zklink, node: ZklinkNode): void {
    this.manager = manager;
    this.node = node;
    this.wsUrl = `${this.node.options.secure ? "wss" : "ws"}://${
      this.node.options.host
    }:${this.node.options.port}/v4/websocket`;
    this.httpUrl = `${this.node.options.secure ? "https://" : "http://"}${
      this.node.options.host
    }:${this.node.options.port}/v4`;
  }

  public connect(): ZklinkWebsocket {
    if (!this.isRegistered)
      throw new Error(`Driver ${this.id} chưa được đăng ký — gọi initial()`);
    const isResume = this.manager!.ZklinkOptions.options!.resume;
    const ws = new ZklinkWebsocket(this.wsUrl, {
      headers: {
        authorization: this.node!.options.auth,
        "user-id": this.manager!.id,
        "client-name": `${metadata.name}/${metadata.version} (${metadata.github})`,
        "session-id": this.sessionId !== null && isResume ? this.sessionId : "",
        "user-agent": this.manager!.ZklinkOptions.options!.userAgent!,
        "num-shards": this.manager!.shardCount,
      },
    });

    ws.on("open", () => {
      this.node!.wsOpenEvent();
    });
    ws.on("message", (data) => this.wsMessageEvent(data));
    ws.on("error", (err) => this.node!.wsErrorEvent(err));
    ws.on("close", (code: number, reason: Buffer) => {
      this.node!.wsCloseEvent(code, reason);
      ws.removeAllListeners();
    });
    this.wsClient = ws;
    return ws;
  }

  public async requester<D = any>(
    options: ZklinkRequesterOptions
  ): Promise<D | undefined> {
    if (!this.isRegistered)
      throw new Error(`Driver ${this.id} chưa được đăng ký — gọi initial()`);
    if (options.path.includes("/sessions") && this.sessionId == null)
      throw new Error(
        "sessionId chưa được khởi tạo! Vui lòng đợi lavalink kết nối!"
      );
    const url = new URL(`${this.httpUrl}${options.path}`);
    if (options.params)
      url.search = new URLSearchParams(options.params).toString();

    if (options.data) {
      options.body = JSON.stringify(options.data);
    }

    const lavalinkHeaders = {
      authorization: this.node!.options.auth,
      "user-agent": this.manager!.ZklinkOptions.options!.userAgent!,
      ...options.headers,
    };

    options.headers = lavalinkHeaders;

    const res = await fetch(url, options);

    if (res.status == 204) {
      this.debug("Player đã bị hủy");
      return undefined;
    }
    if (res.status !== 200) {
      this.debug(
        `${options.method ?? "GET"} ${url.pathname + url.search} dữ liệu=${
          options.body ? String(options.body) : "{}"
        }`
      );
      this.debug(
        "Lỗi từ server lavalink. " +
          `Mã trạng thái: ${res.status}\n Headers: ${util.inspect(
            options.headers
          )}`
      );
      return undefined;
    }

    const finalData = await res.json();

    this.debug(
      `${options.method ?? "GET"} ${url.pathname + url.search} dữ liệu=${
        options.body ? String(options.body) : "{}"
      }`
    );

    return finalData as D;
  }

  protected wsMessageEvent(data: string) {
    if (!this.isRegistered)
      throw new Error(`Driver ${this.id} chưa được đăng ký — gọi initial()`);
    const wsData = JSON.parse(data.toString());
    this.node!.wsMessageEvent(wsData);
  }

  protected debug(logs: string) {
    if (!this.isRegistered)
      throw new Error(`Driver ${this.id} chưa được đăng ký — gọi initial()`);
    // @ts-ignore
    this.manager!.emit(
      ZklinkEvents.Debug,
      `[Zklink] / [Node @ ${this.node?.options.name}] / [Trình điều khiển] / [Lavalink4] | ${logs}`
    );
  }

  public wsClose(): void {
    if (this.wsClient) this.wsClient.close(1006, "Tự đóng");
  }

  public async updateSession(
    sessionId: string,
    mode: boolean,
    timeout: number
  ): Promise<void> {
    const options: ZklinkRequesterOptions = {
      path: `/sessions/${sessionId}`,
      headers: { "content-type": "application/json" },
      method: "PATCH",
      data: {
        resuming: mode,
        timeout: timeout,
      },
    };

    await this.requester<{ resuming: boolean; timeout: number }>(options);
    this.debug(`Phiên đã được cập nhật! resume: ${mode}, timeout: ${timeout}`);
    return;
  }
}
