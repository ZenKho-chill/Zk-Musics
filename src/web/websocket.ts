import Fastify from "fastify";
import { Manager } from "../manager.js";
import { WebSocket } from "@fastify/websocket";
import { log } from "../utilities/LoggerHelper.js";

export class WebsocketRoute {
  constructor(protected client: Manager) {}

  main(fastify: Fastify.FastifyInstance) {
    fastify.get("/websocket", { websocket: true }, (socket, req) => {
      log.info("WebsocketRoute request nhận được", `IP: ${req.ip}`);
      socket.on("close", (code, reason) => {
        log.info("Đóng kết nối websocket", `Code: ${code}, Reason: ${reason}`);
      });
      if (!this.checker(socket, req)) return;
      this.client.wsl.set(String(req.headers["guild-id"]), {
        send: (data) => socket.send(JSON.stringify(data)),
      });
      log.info("Websocket đã mở cho guildId", `Guild: ${req.headers["guild-id"]}`);
    });
  }

  checker(socket: WebSocket, req: Fastify.FastifyRequest) {
    if (!req.headers["guild-id"]) {
      socket.send(JSON.stringify({ error: "Thiếu guild-id" }));
      socket.close(1000, JSON.stringify({ error: "Thiếu guild-id" }));
      return false;
    }
    if (!req.headers["authorization"]) {
      socket.send(JSON.stringify({ error: "Thiếu Authorization" }));
      socket.close(1000, JSON.stringify({ error: "Thiếu Authorization" }));
      return false;
    }
    if (req.headers["authorization"] !== this.client.config.features.RestAPI.auth) {
      socket.send(JSON.stringify({ error: "Authorization không hợp lệ" }));
      socket.close(1000, JSON.stringify({ error: "Authorization không hợp lệ" }));
      return false;
    }
    if (this.client.wsl.get(String(req.headers["guild-id"]))) {
      socket.send(JSON.stringify({ error: "Đã có kết nối cho guild này" }));
      socket.close(1000, JSON.stringify({ error: "Đã có kết nối cho guild này" }));
      return false;
    }
    return true;
  }
}
