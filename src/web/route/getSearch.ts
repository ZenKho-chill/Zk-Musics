import util from "node:util";
import { User } from "discord.js";
import { Manager } from "../../manager.js";
import Fastify from "fastify";
import { ZklinkSearchResultType } from "../../Zklink/Interface/Manager.js";

export async function getSearch(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  client.logger.info(
    "SearchRouterService",
    `${req.method} ${req.routeOptions.url} truy_vấn=${
      req.query ? util.inspect(req.query) : "{}"
    }`
  );
  const query = (req.query as Record<string, string>)["identifier"];
  const requester = (req.query as Record<string, string>)["requester"];
  const source = (req.query as Record<string, string>)["source"];
  let validSource = "youtube_music";
  if (source) {
    const isSourceExist = client.Zklink.searchEngines.get(source);
    if (isSourceExist) validSource = source;
  }
  const user = await client.users.fetch(requester).catch(() => undefined);
  if (!query) {
    res.code(400);
    res.send({ error: "Không tìm thấy tham số tìm kiếm!" });
    return;
  }
  const result = await client.Zklink.search(query, {
    requester: user,
    engine: source,
  }).catch(() => ({
    playlistName: "Zk@error@noNode",
    tracks: [],
    type: ZklinkSearchResultType.SEARCH,
  }));
  if (result.tracks.length == 0 && result.playlistName == "Zk@error@noNode") {
    res.code(404);
    res.send({ error: "Không có node khả dụng!" });
    return;
  }
  res.send({
    type: result.type,
    playlistName: result.playlistName ?? null,
    tracks: result.tracks.map((track) => {
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
