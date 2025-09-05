import { ZklinkNodeOptions } from "../Interface/Manager.js";
import { Zklink } from "../Zklink.js";
import { LavalinkLoadType } from "../Interface/Constants.js";
import { ZklinkNode } from "./ZklinkNode.js";
import {
  LavalinkPlayer,
  LavalinkResponse,
  LavalinkStats,
  ZklinkRequesterOptions,
  RawTrack,
  RoutePlanner,
  UpdatePlayerInfo,
} from "../Interface/Rest.js";
import { NodeInfo } from "../Interface/Node.js";

export class ZklinkRest {
  /** Quản lý Zklink */
  public manager: Zklink;
  protected options: ZklinkNodeOptions;
  /** Quản lý node (lớp ZklinkNode) */
  public nodeManager: ZklinkNode;
  protected sessionId: string | null;

  /**
   * Lớp xử lý REST cho server lavalink
   * @param manager Quản lý Zklink
   * @param options Tùy chọn node Zklink (theo interface ZklinkNodeOptions)
   * @param nodeManager Lớp xử lý server lavalink của Zklink
   */
  constructor(
    manager: Zklink,
    options: ZklinkNodeOptions,
    nodeManager: ZklinkNode
  ) {
    this.manager = manager;
    this.options = options;
    this.nodeManager = nodeManager;
    this.sessionId = this.nodeManager.driver.sessionId
      ? this.nodeManager.driver.sessionId
      : "";
  }

  /**
   * Lấy tất cả player theo sessionId hiện tại
   * @returns Promise trả về mảng các Lavalink player
   */
  public async getPlayers(): Promise<LavalinkPlayer[]> {
    const options: ZklinkRequesterOptions = {
      path: `/sessions/${this.sessionId}/players`,
      headers: { "content-type": "application/json" },
    };
    return (
      (await this.nodeManager.driver.requester<LavalinkPlayer[]>(options)) ?? []
    );
  }

  /**
   * Lấy trạng thái hiện tại của lavalink
   * @returns Promise trả về đối tượng trạng thái lavalink hiện tại
   */
  public async getStatus(): Promise<LavalinkStats | undefined> {
    const options: ZklinkRequesterOptions = {
      path: "/stats",
      headers: { "content-type": "application/json" },
    };
    return await this.nodeManager.driver.requester<LavalinkStats>(options);
  }

  /**
   * Giải mã một track từ thuộc tính "encoded"
   * @returns Promise trả về đối tượng raw track
   */
  public async decodeTrack(base64track: string): Promise<RawTrack | undefined> {
    const options: ZklinkRequesterOptions = {
      path: `/decodetrack?encodedTrack=${encodeURIComponent(base64track)}`,
      headers: { "content-type": "application/json" },
    };
    return await this.nodeManager.driver.requester<RawTrack>(options);
  }

  /**
   * Cập nhật thông tin cho một Lavalink player
   * @returns void (gửi yêu cầu PATCH lên REST)
   */
  public updatePlayer(data: UpdatePlayerInfo): void {
    const options: ZklinkRequesterOptions = {
      path: `/sessions/${this.sessionId}/players/${data.guildId}`,
      params: { noReplace: data.noReplace?.toString() || "false" },
      headers: { "content-type": "application/json" },
      method: "PATCH",
      data: data.playerOptions as Record<string, unknown>,
      rawReqData: data,
    };
    this.nodeManager.driver.requester<LavalinkPlayer>(options);
  }

  /**
   * Huỷ (destroy) một Lavalink player
   * @returns void (gửi yêu cầu DELETE lên REST)
   */
  public destroyPlayer(guildId: string): void {
    const options: ZklinkRequesterOptions = {
      path: `/sessions/${this.sessionId}/players/${guildId}`,
      headers: { "content-type": "application/json" },
      method: "DELETE",
    };
    this.nodeManager.driver.requester(options);
  }

  /**
   * Hàm resolver để lấy track từ lavalink
   * @returns LavalinkResponse
   */
  public async resolver(data: string): Promise<LavalinkResponse | undefined> {
    const options: ZklinkRequesterOptions = {
      path: "/loadtracks",
      params: { identifier: data },
      headers: { "content-type": "application/json" },
      method: "GET",
    };

    const resData = await this.nodeManager.driver.requester<LavalinkResponse>(
      options
    );

    if (!resData) {
      return {
        loadType: LavalinkLoadType.EMPTY,
        data: {},
      };
    } else return resData;
  }

  /**
   * Lấy trạng thái routeplanner từ Lavalink
   * @returns Promise trả về thông tin routeplanner
   */
  public async getRoutePlannerStatus(): Promise<RoutePlanner | undefined> {
    const options = {
      path: "/routeplanner/status",
      headers: { "content-type": "application/json" },
    };
    return await this.nodeManager.driver.requester<RoutePlanner>(options);
  }

  /**
   * Thả (release) địa chỉ IP bị blacklist trở lại pool IP
   * @param address Địa chỉ IP
   */
  public async unmarkFailedAddress(address: string): Promise<void> {
    const options = {
      path: "/routeplanner/free/address",
      method: "POST",
      headers: { "content-type": "application/json" },
      data: { address },
    };
    await this.nodeManager.driver.requester(options);
  }

  /**
   * Lấy thông tin Lavalink
   */
  public getInfo(): Promise<NodeInfo | undefined> {
    const options = {
      path: "/info",
      headers: { "content-type": "application/json" },
    };
    return this.nodeManager.driver.requester(options);
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
