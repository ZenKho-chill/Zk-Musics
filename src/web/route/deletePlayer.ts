import util from "node:util";
import { Manager } from "../../manager.js";
import Fastify from "fastify";
// Log đã bị xóa - import logInfo

export async function deletePlayer(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  // Log đã bị xóa - deletePlayer request info
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
