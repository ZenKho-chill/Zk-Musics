import util from "node:util";
import { User } from "discord.js";
import { Manager } from "../../manager.js";
import Fastify from "fastify";
import { logInfo } from "../../utilities/Logger.js";

export async function getCurrentTrackStatus(
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
    res.send({ error: "Không tìm thấy player hiện tại!" });
    return;
  }
  const song = player.queue.current;
  const requester = song ? (song.requester as User) : null;

  res.send({
    data: song
      ? {
          title: song.title,
          uri: song.uri,
          length: song.duration,
          thumbnail: song.artworkUrl,
          author: song.author,
          requester: requester
            ? {
                id: requester.id,
                username: requester.username,
                globalName: requester.globalName,
                defaultAvatarURL: requester.defaultAvatarURL ?? null,
              }
            : null,
        }
      : null,
  });
}
