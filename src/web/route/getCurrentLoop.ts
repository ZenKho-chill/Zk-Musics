import util from "node:util";
import { Manager } from "../../manager.js";
import Fastify from "fastify";
import { logInfo } from "../../utilities/Logger.js";

export async function getCurrentLoop(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  logInfo(
    "StatusRouterService",
    `${req.method} ${req.routeOptions.url} params=${req.params ? util.inspect(req.params) : "{}"}`
  );
  const guildId = (req.params as Record<string, string>)["guildId"];
  const player = client.Zklink.players.get(guildId);
  if (!player) {
    res.code(400);
    res.send({ error: client.i18n.get("vi", "web", "api.player_not_found") });
    return;
  }
  res.send({ data: player.loop });
}
