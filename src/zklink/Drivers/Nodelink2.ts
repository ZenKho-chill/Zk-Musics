import { Zklink } from "../Zklink.js";
import { metadata } from "../metadata.js";
import { LavalinkLoadType, ZklinkEvents } from "../Interface/Constants.js";
import { ZklinkRequesterOptions } from "../Interface/Rest.js";
import { ZklinkNode } from "../Node/ZklinkNode.js";
import { AbstractDriver } from "./AbstractDriver.js";
import { ZklinkPlayer } from "../Player/ZklinkPlayer.js";
import util from "node:util";
import { ZklinkWebsocket } from "../Utilities/ZklinkWebsocket.js";
import { ZklinkDatabase } from "../Utilities/ZklinkDatabase.js";

export enum Nodelink2loadType {
  SHORTS = "shorts",
  ALBUM = "album",
  ARTIST = "artist",
  SHOW = "show",
  EPISODE = "episode",
  STATION = "station",
  PODCAST = "podcast",
}

export interface NodelinkGetLyricsInterface {
  loadType: Nodelink2loadType | LavalinkLoadType;
  data:
    | {
        name: string;
        synced: boolean;
        data: {
          startTime: number;
          endTime: number;
          text: string;
        }[];
        rtl: boolean;
      }
    | Record<string, never>;
}

export class Nodelink2 extends AbstractDriver {
  public id: string = "nodelink/v2";
  public wsUrl: string = "";
  public httpUrl: string = "";
  public sessionId: string | null;
  public playerFunctions: ZklinkDatabase<(player: ZklinkPlayer, ...args: any) => unknown>;
  public functions: ZklinkDatabase<(manager: Zklink, ...args: any) => unknown>;
  protected wsClient?: ZklinkWebsocket;
  public manager: Zklink | null = null;
  public node: ZklinkNode | null = null;

  constructor() {
    super();
    this.sessionId = null;
    this.playerFunctions = new ZklinkDatabase<(player: ZklinkPlayer, ...args: any) => unknown>();
    this.functions = new ZklinkDatabase<(manager: Zklink, ...args: any) => unknown>();
    this.playerFunctions.set("getLyric", this.getLyric);
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
    if (!this.isRegistered) throw new Error(`Driver ${this.id} chưa được đăng ký — gọi initial()`);
    const isResume = this.manager!.ZklinkOptions.options!.resume;
    const ws = new ZklinkWebsocket(this.wsUrl, {
      headers: {
        Authorization: this.node!.options.auth,
        "user-id": this.manager!.id,
        "accept-encoding": (process as any).isBun ? "gzip, deflate" : "br, gzip, deflate",
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

  public async requester<D = any>(options: ZklinkRequesterOptions): Promise<D | undefined> {
    if (!this.isRegistered) throw new Error(`Driver ${this.id} chưa được đăng ký — gọi initial()`);
    if (options.path.includes("/sessions") && this.sessionId == null)
      throw new Error("sessionId chưa được khởi tạo! Vui lòng đợi nodelink kết nối!");
    const url = new URL(`${this.httpUrl}${options.path}`);
    if (options.params) url.search = new URLSearchParams(options.params).toString();

    if (options.data) {
      options.body = JSON.stringify(options.data);
    }

    const lavalinkHeaders = {
      authorization: this.node!.options.auth,
      "user-agent": this.manager!.ZklinkOptions.options!.userAgent!,
      "accept-encoding": (process as any).isBun ? "gzip, deflate" : "br, gzip, deflate",
      ...options.headers,
    };

    options.headers = lavalinkHeaders;

    const res = await fetch(url, options);

    if (res.status == 204) {
      // Debug đã bị xóa - Request method và endpoint data (status 204)
      return undefined;
    }
    if (res.status !== 200) {
      // Debug đã bị xóa - Request method và endpoint data
      // Debug đã bị xóa - Lỗi từ server nodelink
      return undefined;
    }

    const preFinalData = (await res.json()) as D;
    let finalData: any = preFinalData;

    if (finalData.loadType) {
      finalData = this.convertV4trackResponse(finalData) as D;
    }

    // Debug đã bị xóa - Request method và endpoint data (cuối function)

    return finalData;
  }

  protected wsMessageEvent(data: string) {
    if (!this.isRegistered) throw new Error(`Driver ${this.id} chưa được đăng ký — gọi initial()`);
    const wsData = JSON.parse(data.toString());
    this.node!.wsMessageEvent(wsData);
  }

  protected debug(logs: string) {
    // Debug đã bị xóa
  }

  public wsClose(): void {
    if (this.wsClient) this.wsClient.close(1006, "Tự đóng");
  }

  protected convertV4trackResponse(nl2Data: Record<string, any>): Record<string, any> {
    if (!nl2Data) return {};
    switch (nl2Data.loadType) {
      case Nodelink2loadType.SHORTS: {
        nl2Data.loadType = LavalinkLoadType.TRACK;
        return nl2Data;
      }
      case Nodelink2loadType.ALBUM: {
        nl2Data.loadType = LavalinkLoadType.PLAYLIST;
        return nl2Data;
      }
      case Nodelink2loadType.ARTIST: {
        nl2Data.loadType = LavalinkLoadType.PLAYLIST;
        return nl2Data;
      }
      case Nodelink2loadType.EPISODE: {
        nl2Data.loadType = LavalinkLoadType.PLAYLIST;
        return nl2Data;
      }
      case Nodelink2loadType.STATION: {
        nl2Data.loadType = LavalinkLoadType.PLAYLIST;
        return nl2Data;
      }
      case Nodelink2loadType.PODCAST: {
        nl2Data.loadType = LavalinkLoadType.PLAYLIST;
        return nl2Data;
      }
      case Nodelink2loadType.SHOW: {
        nl2Data.loadType = LavalinkLoadType.PLAYLIST;
        return nl2Data;
      }
    }
    return nl2Data;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async updateSession(sessionId: string, mode: boolean, timeout: number): Promise<void> {
    // Debug đã bị xóa - CẢNH BÁO: Nodelink không hỗ trợ resume
    return;
  }

  public async getLyric(
    player: ZklinkPlayer,
    language: string
  ): Promise<NodelinkGetLyricsInterface | undefined> {
    const options: ZklinkRequesterOptions = {
      path: "/loadlyrics",
      params: {
        encodedTrack: String(player.queue.current?.encoded),
        language: language,
      },
      headers: { "content-type": "application/json" },
      method: "GET",
    };
    const data = await player.node.driver.requester<NodelinkGetLyricsInterface>(options);
    return data;
  }

  protected testJSON(text: string) {
    if (typeof text !== "string") {
      return false;
    }
    try {
      JSON.parse(text);
      return true;
    } catch (error) {
      return false;
    }
  }
}
