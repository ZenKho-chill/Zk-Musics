import { User } from "discord.js";
import { Manager } from "../../manager.js";
import { ZklinkPlayer } from "../../zklink/main.js";

export default class {
  async execute(client: Manager, player: ZklinkPlayer) {
    const song = player.queue.current;
    if (!song) {
      return;
    }
    const requesterQueue =
      song && song.requester ? (song!.requester as User) : null;

    const currentData = {
      title: song.title ?? "Tiêu đề không xác định",
      uri: song!.uri,
      length: song!.duration,
      thumbnail: song!.artworkUrl,
      author: song.author ?? "Tác giả không xác định",
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
