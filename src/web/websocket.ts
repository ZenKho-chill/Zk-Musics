import Fastify from "fastify";
import { Manager } from "../manager.js";
import { WebSocket } from "@fastify/websocket";
import { logInfo } from "../utilities/Logger.js";

export class WebsocketRoute {
  constructor(protected client: Manager) {}

  main(fastify: Fastify.FastifyInstance) {
    fastify.get("/websocket", { websocket: true }, (socket, req) => {
      logInfo("WebsocketRoute", `${req.method} ${req.routeOptions.url}`);
      socket.on("close", (code, reason) => {
        logInfo(
          "WebsocketRoute",
          `Đóng kết nối với code: ${code}, lý do: ${reason}`
        );
      });
      if (!this.checker(socket, req)) return;
      this.client.wsl.set(String(req.headers["guild-id"]), {
        send: (data) => socket.send(JSON.stringify(data)),
      });
      logInfo(
        "WebsocketRoute",
        `Websocket đã mở cho guildId: ${req.headers["guild-id"]}`
      );
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
      socket.send(JSON.stringify({ error: this.client.i18n.get("vi", "web", "websocket.guild_connection_exists") }));
      socket.close(1000, JSON.stringify({ error: this.client.i18n.get("vi", "web", "websocket.guild_connection_exists") }));
      return false;
    }
    return true;
  }
}
