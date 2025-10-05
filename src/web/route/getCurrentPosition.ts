import util from "node:util";
import { Manager } from "../../manager.js";
import Fastify from "fastify";
// Log đã bị xóa - import logInfo

export async function getCurrentPosition(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  // Log đã bị xóa - getCurrentPosition request info
  const guildId = (req.params as Record<string, string>)["guildId"];
  const player = client.Zklink.players.get(guildId);
  if (!player) {
    res.code(400);
    res.send({ error: "Không tìm thấy player hiện tại!" });
    return;
  }
  res.send({ data: player.position });
}
