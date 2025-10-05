import util from "node:util";
import { Manager } from "../../manager.js";
import Fastify from "fastify";
import { ZklinkLoopMode } from "../../Zklink/Interface/Constants.js";
import { ZklinkPlayer } from "../../Zklink/Player/ZklinkPlayer.js";
// Log đã bị xóa - import logInfo

export type TrackRes = {
  title: string;
  uri: string;
  length: number;
  thumbnail: string;
  author: string;
  requester: null;
};

export class PatchControl {
  protected skiped: boolean = false;
  protected isPrevious: boolean = false;
  protected addedTrack: TrackRes[] = [];
  constructor(protected client: Manager) {}

  async main(req: Fastify.FastifyRequest, res: Fastify.FastifyReply) {
    // Log đã bị xóa - PatchControl request info
    const isValid = await this.checker(req, res);
    if (!isValid) return;
    const guildId = (req.params as Record<string, string>)["guildId"];
    const player = this.client.Zklink.players.get(guildId) as ZklinkPlayer;
    const jsonBody = req.body as Record<string, unknown>;
    const currentKeys = Object.keys(jsonBody);
    for (const key of currentKeys) {
      const data = await (this as any)[key](res, player, jsonBody[key]);
      if (!data) return;
    }
    res.send({
      loop: jsonBody.loop,
      skiped: this.skiped,
      previous: this.isPrevious,
      position: jsonBody.position,
      volume: jsonBody.volume,
      added: this.addedTrack,
    });
    this.resetData();
  }

  async loop(res: Fastify.FastifyReply, player: ZklinkPlayer, mode: string) {
    if (!mode || !["song", "queue", "none"].includes(mode)) {
      res.code(400);
      res.send({
        error: `Chế độ loop không hợp lệ, mode '${mode}' không tồn tại!`,
      });
      return false;
    }
    player.setLoop(mode as ZklinkLoopMode);
    return true;
  }

  async skipMode(res: Fastify.FastifyReply, player: ZklinkPlayer, mode: string) {
    if (!mode || !["previous", "skip"].includes(mode)) {
      res.code(400);
      res.send({ error: `Chế độ không hợp lệ, mode '${mode}' không tồn tại!` });
      return false;
    }
    if (player.queue.length == 0) return true;
    if (mode == "skip") {
      await player.skip();
      this.skiped = true;
      return true;
    }
    await player.previous();
    this.isPrevious = true;
    return true;
  }

  async position(res: Fastify.FastifyReply, player: ZklinkPlayer, pos: string) {
    if (isNaN(Number(pos))) {
      res.code(400);
      res.send({ error: `Vị trí phải là một số!` });
      return false;
    }
    await player.seek(Number(pos));
    return true;
  }

  async volume(res: Fastify.FastifyReply, player: ZklinkPlayer, vol: string) {
    if (!vol) return true;
    if (isNaN(Number(vol))) {
      res.code(400);
      res.send({ error: `Âm lượng phải là một số!` });
      return false;
    }
    await player.setVolume(Number(vol));
    return true;
  }

  async add(res: Fastify.FastifyReply, player: ZklinkPlayer, uriArray: string) {
    if (!uriArray) return true;
    for (const uri of uriArray) {
      if (!this.isValidHttpUrl(uri)) {
        res.code(400);
        res.send({ error: `Thuộc tính add phải chứa một đường dẫn hợp lệ!` });
        return false;
      }
      const result = await this.client.Zklink.search(uri);
      if (result.tracks.length == 0) {
        res.code(400);
        res.send({ error: `Không tìm thấy bài hát!` });
        return false;
      }
      const song = result.tracks[0];
      player.queue.add(song);
      this.addedTrack.push({
        title: song.title,
        uri: song.uri || "",
        length: song.duration,
        thumbnail: song.artworkUrl || "",
        author: song.author,
        requester: null,
      });
    }
    return true;
  }

  async checker(req: Fastify.FastifyRequest, res: Fastify.FastifyReply): Promise<boolean> {
    const accpetKey: string[] = ["loop", "skipMode", "position", "volume", "add"];
    const guildId = (req.params as Record<string, string>)["guildId"];
    const player = this.client.Zklink.players.get(guildId);
    if (!player) {
      res.code(404);
      res.send({ error: "Không tìm thấy player hiện tại!" });
      return false;
    }
    if (req.headers["content-type"] !== "application/json") {
      res.code(400);
      res.send({ error: "content-type phải là application/json!" });
      return false;
    }
    if (!req.body) {
      res.code(400);
      res.send({ error: "Thiếu body" });
      return false;
    }
    const jsonBody = req.body as Record<string, unknown>;
    for (const key of Object.keys(jsonBody)) {
      if (!accpetKey.includes(key)) {
        res.code(400);
        res.send({ error: `Body không hợp lệ, key '${key}' không tồn tại!` });
        return false;
      }
    }
    return true;
  }

  resetData() {
    this.skiped = false;
    this.addedTrack = [];
    this.isPrevious = false;
  }

  isValidHttpUrl(string: string) {
    let url;

    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
  }
}
