import { User } from "discord.js";
import { Manager } from "../../manager.js";
import { ZklinkPlayer } from "../../Zklink/main.js";

export default class {
  async execute(client: Manager, player: ZklinkPlayer) {
    const song = player.queue.current;
    if (!song) {
      return;
    }
    const requesterQueue = song && song.requester ? (song!.requester as User) : null;

    // Get guild language for localization
    let guildModel = await client.db.language.get(`${player.guildId}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(`${player.guildId}`, client.config.bot.LANGUAGE);
    }
    const language = guildModel;

    const currentData = {
      title: song.title ?? client.i18n.get(language, "server.events", "player.track_title_unknown"),
      uri: song!.uri,
      length: song!.duration,
      thumbnail: song!.artworkUrl,
      author: song.author ?? client.i18n.get(language, "server.events", "player.track_author_unknown"),
      requester: requesterQueue
        ? {
            id: requesterQueue.id,
            username: requesterQueue.username,
            globalName: requesterQueue.globalName,
            defaultAvatarURL: requesterQueue.defaultAvatarURL ?? null,
          }
        : null,
    };

    client.wsl.get(player.guildId)?.send({
      op: "trackStart",
      guild: player.guildId,
      data: currentData,
    });
  }
}
