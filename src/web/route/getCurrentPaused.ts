import util from "node:util";
import { Manager } from "../../manager.js";
import Fastify from "fastify";
import { logInfo } from "../../utilities/Logger.js";

export async function getCurrentPaused(
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
    res.send({ error: client.i18n.get(client.config.bot.LANGUAGE, "server.web", "api_player_not_found") });
    return;
  }
  res.send({ data: player.paused });
}
