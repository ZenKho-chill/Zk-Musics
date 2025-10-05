import { Manager } from "../manager.js";
import Fastify from "fastify";
import WebsocketPlugin from "@fastify/websocket";
import { WebsocketRoute } from "./websocket.js";
import { PlayerRoute } from "./player.js";
import { getSearch } from "./route/getSearch.js";
import { getCommands } from "./route/getCommands.js";
// Log đã bị xóa - import logInfo, logError

export class RestAPI {
  app: Fastify.FastifyInstance;
  constructor(private client: Manager) {
    this.app = Fastify({
      logger: false,
    });

    this.app.register(
      (fastify, _, done) => {
        fastify.addHook("preValidation", function hook(req, reply, done) {
          if (!req.headers["authorization"]) {
            reply.code(400);
            reply.send(JSON.stringify({ error: "Thiếu Authorization" }));
            return done();
          }
          if (req.headers["authorization"] !== client.config.features.RestAPI.auth) {
            reply.code(401);
            reply.send(JSON.stringify({ error: "Authorization không hợp lệ" }));
            return done();
          }
          if (
            client.config.features.RestAPI.whitelist.length !== 0 &&
            !client.config.features.RestAPI.whitelist.includes(req.hostname)
          ) {
            reply.code(401);
            reply.send(JSON.stringify({ error: "Bạn không có trong whitelist" }));
            return done();
          }
          done();
        });
        fastify.register(WebsocketPlugin);
        fastify.register((fastify, _, done) => {
          new WebsocketRoute(client).main(fastify);
          done();
        });
        fastify.register(
          (fastify, _, done) => {
            new PlayerRoute(client).main(fastify);
            done();
          },
          { prefix: "players" }
        );
        fastify.get("/search", (req, res) => getSearch(client, req, res));
        fastify.get("/commands", (req, res) => getCommands(client, req, res));
        done();
      },
      { prefix: "v1" }
    );

    this.app.get("/zk", (request, reply) => {
      const response = [
        "Zk Music's nghĩ có khi có thứ hữu ích hơn cái này 😅",
        "Cẩn thận nha, Zk Music's có thể gây nghiện đó 😜",
        "Không đâu, đây không phải chỗ cosplay Zk Music's 😅",
        "Cười lên nào, Zk Music's không thích mặt nghiêm túc 😆",
        "Zk Music's gợi ý bạn thử kiểm tra chỗ khác xem? 🧐",
        "Hãy làm điều gì hữu ích hơn với sự trợ giúp của Zk Music's!",
        "Bộ sưu tập Zk Music's này không tồn tại, nhưng cố lên nhé! 💪",
        "Ở đây không có Zk Music's, nhưng bạn vẫn có thể mỉm cười 😊",
        "Đừng lo, Zk Music's không phải là tất cả đâu 😎",
      ];
      // Log đã bị xóa - HealthRouterService request info
      reply.send({ zk: response[Math.floor(Math.random() * response.length)] });
    });

    const port = this.client.config.features.RestAPI.port;

    this.app
      .listen({ port, host: "0.0.0.0" })
      .then(() => {
        // Log đã bị xóa - Server đang chạy ở cổng
      })
      .catch((err) => {
        if (this.client.config.bot.TOKEN.length > 1) {
          this.client.config.features.RestAPI.port = this.client.config.features.RestAPI.port + 1;
          const newPort = this.client.config.features.RestAPI.port;
          return this.app
            .listen({ port: newPort, host: "0.0.0.0" })
            .then(() => {
              // Log đã bị xóa - Server đang chạy ở cổng mới
            })
            .catch((err) => {
              // Log đã bị xóa - Failed to start server on new port
            });
        } else {
          // Log đã bị xóa - Failed to start server
        }
      });
  }
}
