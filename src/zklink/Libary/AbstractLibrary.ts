import { ZklinkNodeOptions } from "../Interface/Manager.js";
import { Zklink } from "../Zklink.js";
export const AllowedPackets = ["VOICE_STATE_UPDATE", "VOICE_SERVER_UPDATE"];

export abstract class AbstractLibrary {
  protected readonly client: any;
  protected manager: Zklink | null;
  constructor(client: any) {
    this.client = client;
    this.manager = null;
  }

  protected async ready(nodes: ZklinkNodeOptions[]): Promise<void> {
    this.manager!.id = this.getId();
    this.manager!.shardCount = this.getShardCount();
    // @ts-ignore
    this.manager!.emit(
      "debug",
      `Đã đăng ký ${this.manager!.plugins.size} plugin | Bắt đầu kết nối các node hiện có`
    );
    
    // Kết nối tuần tự để tránh race condition
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      this.manager?.nodes.add(node);
      
      // Thêm delay giữa các kết nối để tránh race condition
      if (i < nodes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
      }
    }
  }

  public set(manager: Zklink): AbstractLibrary {
    this.manager = manager;
    return this;
  }

  abstract getId(): string;

  abstract getShardCount(): number;

  abstract sendPacket(shardId: number, payload: any, important: boolean): void;

  abstract listen(nodes: ZklinkNodeOptions[]): void;

  protected raw(packet: any): void {
    if (!AllowedPackets.includes(packet.t)) return;
    const guildId = packet.d.guild_id;
    const players = this.manager!.players.get(guildId);
    if (!players) return;
    if (packet.t === "VOICE_SERVER_UPDATE") return players.setServerUpdate(packet.d);
    const userId = packet.d.user_id;
    if (userId !== this.manager!.id) return;
    players.setStateUpdate(packet.d);
  }
}
