import { ZklinkConnectState, ZklinkEvents } from "../Interface/Constants.js";
import { ZklinkNodeOptions } from "../Interface/Manager.js";
import { ZklinkNode } from "../Node/ZklinkNode.js";
import { Zklink } from "../Zklink.js";
import { ZklinkDatabase } from "../Utilities/ZklinkDatabase.js";

export class ZklinkNodeManager extends ZklinkDatabase<ZklinkNode> {
  /** Quản lý Zklink */
  public manager: Zklink;

  /**
   * Lớp chính để quản lý các server lavalink
   * @param manager
   */
  constructor(manager: Zklink) {
    super();
    this.manager = manager;
  }

  /**
   * Thêm một Node mới.
   * @returns ZklinkNode
   */
  public add(node: ZklinkNodeOptions) {
    const newNode = new ZklinkNode(this.manager, node);
    newNode.connect();
    this.set(node.name, newNode);
    this.debug(`Đã thêm node ${node.name} vào manager!`);
    return newNode;
  }

  /**
   * Lấy node ít được sử dụng nhất.
   * @returns ZklinkNode
   */
  public async getLeastUsed(): Promise<ZklinkNode> {
    if (this.manager.ZklinkOptions.options!.nodeResolver) {
      const resolverData =
        await this.manager.ZklinkOptions.options!.nodeResolver(this);
      if (resolverData) return resolverData;
    }
    const nodes: ZklinkNode[] = this.values;

    const onlineNodes = nodes.filter(
      (node) => node.state === ZklinkConnectState.Connected
    );
    if (!onlineNodes.length) throw new Error("Không có node nào đang online");

    const temp = await Promise.all(
      onlineNodes.map(async (node) => {
        const stats = await node.rest.getStatus();
        return !stats
          ? { players: 0, node: node }
          : { players: stats.players, node: node };
      })
    );
    temp.sort((a, b) => a.players - b.players);

    return temp[0].node;
  }

  /**
   * Lấy tất cả các node hiện tại
   * @returns ZklinkNode[]
   */
  public all(): ZklinkNode[] {
    return this.values;
  }

  /**
   * Xóa một node.
   * @returns void
   */
  public remove(name: string): void {
    const node = this.get(name);
    if (node) {
      node.disconnect();
      this.delete(name);
      this.debug(`Đã xóa node ${name} khỏi manager!`);
    }
    return;
  }

  protected debug(logs: string) {
    // @ts-ignore
    this.manager.emit(
      ZklinkEvents.Debug,
      `[Zklink] / [Quản lý Node] | ${logs}`
    );
  }
}
