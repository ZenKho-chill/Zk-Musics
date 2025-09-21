import util from "node:util";
import { Manager } from "../../manager.js";
import Fastify from "fastify";
import { logInfo } from "../../utilities/Logger.js";

export async function deletePlayer(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  logInfo(
    "PlayerRouterService",
    `${req.method} ${req.routeOptions.url} params=${req.params ? util.inspect(req.params) : "{}"}`
  );
  const guildId = (req.params as Record<string, string>)["guildId"];
  const player = client.Zklink.players.get(guildId);
  if (!player) {
    res.code(404);
    res.send({ error: "Không tìm thấy player hiện tại!" });
    return;
  }
  await player.destroy();
  res.code(204);
}
