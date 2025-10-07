import util from "node:util";
import { Manager } from "../../manager.js";
import Fastify from "fastify";
import { log } from "../../utilities/LoggerHelper.js";

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
  try {
    await player.destroy();
  } catch (error) {
    log.error("Lỗi khi destroy player qua API", `Guild: ${guildId}`, error as Error);
    return res.code(500).send({ error: "Failed to destroy player" });
  }
  res.code(204);
}
