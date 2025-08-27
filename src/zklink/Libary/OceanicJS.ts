import { AbstractLibrary } from "./AbstractLibrary.js";
import { ZklinkNodeOptions } from "../Interface/Manager.js";

export class OceanicJS extends AbstractLibrary {
  // Gửi packet tới Discord Gateway
  public sendPacket(shardId: number, payload: any, important: boolean): void {
    return this.client.shards
      .get(shardId)
      ?.send(payload.op, payload.d, important);
  }

  // Lấy id của bot (client user)
  public getId(): string {
    return this.client.user.id;
  }

  // Lấy số shard để làm việc với lavalink
  public getShardCount(): number {
    return this.client.shards && this.client.shards.size
      ? this.client.shards.size
      : 1;
  }

  // Listen: gắn listener vào thư viện (client)
  public listen(nodes: ZklinkNodeOptions[]): void {
    // Gắn sự kiện ready một lần
    this.client.once("ready", () => this.ready(nodes));
    // Gắn sự kiện raw websocket (nên khớp spec dapi)
    this.client.on("packet", (packet: any) => this.raw(packet));
  }
}
