import { ZklinkPlugin as Plugin } from "../ZklinkPlugin.js";
import { Zklink } from "../../Zklink.js";
import { ZklinkEvents, ZklinkPluginType } from "../../Interface/Constants.js";
import { RawData, WebSocket } from "ws";
import { ZklinkNode } from "../../Node/ZklinkNode.js";
import { metadata } from "../../metadata.js";
import { VoiceChannelOptions } from "../../Interface/Player.js";

export class ZklinkPlugin extends Plugin {
  protected manager?: Zklink;
  /** Plugin đang bật hay tắt */
  public enabled: boolean = false;
  protected runningWs: Map<string, WebSocket> = new Map<string, WebSocket>();

  constructor() {
    super();
  }

  /** Hàm trả về tên plugin */
  public name(): string {
    return "Zklink-voiceReceiver";
  }

  /** Hàm trả về loại plugin */
  public type(): ZklinkPluginType {
    return ZklinkPluginType.Default;
  }

  /** Mở kết nối WebSocket cho voice receiver */
  public open(node: ZklinkNode, voiceOptions: VoiceChannelOptions): void {
    if (!this.enabled) throw new Error("Plugin này chưa được tải!");
    if (!node.options.driver?.includes("nodelink"))
      throw new Error(
        "Node này không hỗ trợ voice receiver, vui lòng dùng Nodelink2 để sử dụng tính năng này!"
      );
    const wsUrl = `${node.options.secure ? "wss" : "ws"}://${
      node.options.host
    }:${node.options.port}`;
    const ws = new WebSocket(wsUrl + "/connection/data", {
      headers: {
        Authorization: node.options.auth,
        "User-Id": this.manager!.id,
        "Client-Name": `${metadata.name}/${metadata.version} (${metadata.github})`,
        "user-agent": this.manager!.ZklinkOptions.options!.userAgent!,
        "Guild-Id": voiceOptions.guildId,
      },
    });
    this.runningWs.set(voiceOptions.guildId, ws);
    ws.on("open", () => {
      // Debug đã bị xóa - Đã kết nối tới server nhận voice của nodelink
      // @ts-ignore
      this.manager?.emit(ZklinkEvents.VoiceConnect, node);
    });
    ws.on("message", (data: RawData) => this.wsMessageEvent(node, data));
    ws.on("error", (err) => {
      // Debug đã bị xóa - Lỗi tại server nhận voice của nodelink
      // @ts-ignore
      this.manager?.emit(ZklinkEvents.VoiceError, node, err);
    });
    ws.on("close", (code: number, reason: Buffer) => {
      // Debug đã bị xóa - Ngắt kết nối tới server nhận voice của nodelink
      // @ts-ignore
      this.manager?.emit(ZklinkEvents.VoiceDisconnect, node, code, reason);
      // @ts-ignore
      ws.removeAllListeners();
    });
  }

  /** Open the ws voice reciver client */
  public close(guildId: string): void {
    const targetWs = this.runningWs.get(guildId);
    if (!targetWs) return;
    targetWs.close();
    this.runningWs.delete(guildId);
    // Debug đã bị xóa - Đã huỷ kết nối tới server nhận voice của nodelink
    // @ts-ignore
    targetWs.removeAllListeners();
    return;
  }

  protected wsMessageEvent(node: ZklinkNode, data: RawData) {
    const wsData = JSON.parse(data.toString());
    // Debug đã bị xóa - Log data nhận được
    switch (wsData.type) {
      case "startSpeakingEvent": {
        // @ts-ignore
        this.manager?.emit(
          ZklinkEvents.VoiceStartSpeaking,
          node,
          wsData.data.userId,
          wsData.data.guildId
        );
        break;
      }
      case "endSpeakingEvent": {
        // @ts-ignore
        this.manager?.emit(
          ZklinkEvents.VoiceEndSpeaking,
          node,
          wsData.data.data,
          wsData.data.userId,
          wsData.data.guildId
        );
        break;
      }
    }
    // this.node.wsMessageEvent(wsData);
  }

  /** Hàm load để kích hoạt plugin */
  public load(manager: Zklink): void {
    this.manager = manager;
    this.enabled = true;
  }

  /** Hàm unload để dừng plugin */
  public unload(manager: Zklink): void {
    this.manager = manager;
    this.enabled = false;
  }

  private debug(logs: string) {
    // Debug đã bị xóa
  }
}
