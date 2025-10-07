import { Manager } from "../../manager.js";
import Fastify from "fastify";
// Log đã bị xóa - import logInfo

export async function getCommands(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  // Log đã bị xóa - getCommands request info
  res.send({
    data: client.commands.map((command) => ({
      name: command.name.join("-"),
      description: command.description,
      category: command.category,
      accessableby: command.accessableby,
      usage: command.usage,
      aliases: command.aliases,
    })),
  });
}
