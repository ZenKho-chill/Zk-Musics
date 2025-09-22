import util from "node:util";
import { Guild, GuildMember } from "discord.js";
import { Manager } from "../../manager.js";
import Fastify from "fastify";
import { logInfo } from "../../utilities/Logger.js";

export class PostCreatePlayer {
  guild: Guild | null = null;
  member: GuildMember | null = null;
  constructor(protected client: Manager) {}

  async main(req: Fastify.FastifyRequest, res: Fastify.FastifyReply) {
    logInfo(
      "PostCreatePlayer",
      `${req.method} ${req.routeOptions.url} dữ_liệu=${req.body ? util.inspect(req.body) : "{}"}`
    );
    const data = req.body as Record<string, string>;
    const validBody = await this.checker(data, req, res);
    if (!validBody) return;
    const playerData = {
      guildId: this.guild!.id,
      voiceId: this.member!.voice.channel!.id,
      textId: "",
      shardId: this.guild?.shardId ?? 0,
      deaf: true,
      volume: this.client.config.bot.DEFAULT_VOLUME ?? 100,
    };
    this.client.Zklink.create(playerData);
    res.send(playerData);
  }

  clean() {
    this.guild = null;
    this.member = null;
  }

  async checker(
    data: Record<string, string>,
    req: Fastify.FastifyRequest,
    res: Fastify.FastifyReply
  ): Promise<boolean> {
    const reqKey = ["guildId", "userId"];
    if (!data) return this.errorRes(req, res, "Thiếu body");
    if (Object.keys(data).length !== reqKey.length) return this.errorRes(req, res, "Thiếu key");
    if (!data["guildId"]) return this.errorRes(req, res, "Thiếu key guildId");
    if (!data["userId"]) return this.errorRes(req, res, "Thiếu key userId");
    const Guild = await this.client.guilds.fetch(data["guildId"]).catch(() => undefined);
    if (!Guild) return this.errorRes(req, res, "Không tìm thấy guild");
    const isPlayerExist = this.client.Zklink.players.get(Guild.id);
    if (isPlayerExist) return this.errorRes(req, res, this.client.i18n.get("vi", "web", "api.player_already_exists"));
    this.guild = Guild;
    const Member = await Guild.members.fetch(data["userId"]).catch(() => undefined);
    if (!Member) return this.errorRes(req, res, this.client.i18n.get("vi", "web", "api.user_not_found"));
    if (!Member.voice.channel || !Member.voice)
      return this.errorRes(req, res, "Người dùng chưa vào voice");
    this.member = Member;
    return true;
  }

  async errorRes(req: Fastify.FastifyRequest, res: Fastify.FastifyReply, message: string) {
    res.code(400);
    res.send({ error: message });
    this.clean();
    return false;
  }
}
