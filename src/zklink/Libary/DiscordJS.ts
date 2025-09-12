import { AbstractLibrary } from "./AbstractLibrary.js";
import { ZklinkNodeOptions } from "../Interface/Manager.js";

export class DiscordJS extends AbstractLibrary {
  // Gửi packet tới Discord Gateway
  public sendPacket(shardId: number, payload: any, important: boolean): void {
    return this.client.ws.shards.get(shardId)?.send(payload, important);
  }

  // Lấy id của bot (client user)
  public getId(): string {
    return this.client.user.id;
  }

  // Lấy số shard để làm việc với lavalink
  public getShardCount(): number {
    return this.client.shard && this.client.shard.count ? this.client.shard.count : 1;
  }

  // Listen: gắn listener vào thư viện (client)
  public listen(nodes: ZklinkNodeOptions[]): void {
    this.client.once("ready", () => this.ready(nodes));
    this.client.on("raw", (packet: any) => this.raw(packet));
  }
}
