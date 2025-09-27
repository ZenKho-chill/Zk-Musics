import util from "node:util";
import { User } from "discord.js";
import { Manager } from "../../manager.js";
import Fastify from "fastify";
import { logInfo } from "../../utilities/Logger.js";

export async function getQueueStatus(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  logInfo(
    "StatusRouterService",
    `${req.method} ${req.routeOptions.url} tham_số=${req.params ? util.inspect(req.params) : "{}"}`
  );
  const guildId = (req.params as Record<string, string>)["guildId"];
  const player = client.Zklink.players.get(guildId);
  if (!player) {
    res.code(400);
    res.send({ error: client.i18n.get(client.config.bot.LANGUAGE, "server.web", "api_player_not_found") });
    return;
  }
  return res.send({
    data: player.queue.map((track) => {
      const requesterQueue = track.requester as User;
      return {
        title: track.title,
        uri: track.uri,
        length: track.duration,
        thumbnail: track.artworkUrl,
        author: track.author,
        requester: requesterQueue
          ? {
              id: requesterQueue.id,
              username: requesterQueue.username,
              globalName: requesterQueue.globalName,
              defaultAvatarURL: requesterQueue.defaultAvatarURL ?? null,
            }
          : null,
      };
    }),
  });
}
