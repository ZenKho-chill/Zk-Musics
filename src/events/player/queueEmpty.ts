import { TextChannel } from "discord.js";
import { Manager } from "../../manager.js";
import { CleanUpMessage } from "../../services/CleanUpMessage.js";
import { ZklinkPlayer } from "../../Zklink/main.js";
import { UpdateMusicStatusChannel } from "../../utilities/UpdateStatusChannel.js";
import { NowPlayingUpdateService } from "../../services/NowPlayingUpdateService.js";
import chalk from "chalk";

export default class {
  async execute(client: Manager, player: ZklinkPlayer) {
    // Log đã bị xóa - Event queueEmpty được trigger
    
    if (!client.isDatabaseConnected) {
      // Log đã bị xóa - Cơ sở dữ liệu chưa kết nối
      return;
    }

    /////////// Cập nhật thiết lập nhạc //////////
    await client.UpdateMusic(player);
    /////////// Cập nhật thiết lập nhạc ///////////

    /////////// Cập nhật kênh trạng thái nhạc //////////
    await UpdateMusicStatusChannel(client, player);
    /////////// Cập nhật kênh trạng thái nhạc //////////

    /////////// Xóa nowplaying message nếu có //////////
    await NowPlayingUpdateService.getInstance().deleteNowPlaying(client, player.guildId);
    /////////// Xóa nowplaying message nếu có //////////

    const guild = await client.guilds.fetch(player.guildId).catch(() => undefined);

    if (player.data.get("autoplay") === true) {
      const author = player.data.get("author");
      const title = player.data.get("title");
      const requester = player.data.get("requester");
      let identifier = player.data.get("identifier");
      const source = String(player.data.get("source"));

      if (source.toLowerCase() === "youtube") {
        const search = `https://music.youtube.com/watch?v=${identifier}&list=RD${identifier}`;
        const res = await player.search(search, { requester: requester });

        const finalRes = res.tracks.filter((track) => {
          const req1 = !player.queue.some((s) => s.encoded === track.encoded);
          const req2 = !player.queue.previous.some((s) => s.encoded === track.encoded);
          return req1 && req2;
        });

        if (finalRes.length !== 0) {
          await player.play(finalRes.length <= 1 ? finalRes[0] : finalRes[1]);
          const channel = await client.channels.fetch(player.textId).catch(() => undefined);
          if (channel) return new CleanUpMessage(client, channel, player);
          return;
        }
      } else if (source.toLowerCase() !== "spotify") {
        const findQuery = "directSearch=spsearch:" + [author, title].filter((x) => !!x).join(" - ");
        const preRes = await player.search(findQuery, { requester: requester });
        if (preRes.tracks.length !== 0) {
          identifier = preRes.tracks[0]?.identifier ?? identifier;
        }
      }
      if (identifier) {
        const spotifyQuery = `seed_tracks=${identifier}`;
        let findQuery = "directSearch=sprec:" + spotifyQuery;
        const res = await player.search(findQuery, { requester: requester });

        const finalRes = res.tracks.filter((track) => {
          const unwantedKeywords = /remix|dj|koplo|live|instrumental/i;
          const isUnwanted =
            unwantedKeywords.test(track.title) || unwantedKeywords.test(track.author);
          const req1 = !player.queue.some((s) => s && s.encoded === track.encoded);
          const req2 = !player.queue.previous.some((s) => s && s.encoded === track.encoded);
          return !isUnwanted && req1 && req2;
        });

        if (finalRes.length !== 0) {
          await player.play(finalRes.length <= 1 ? finalRes[0] : finalRes[1]);
          const channel = await client.channels.fetch(player.textId).catch(() => undefined);
          if (channel) return new CleanUpMessage(client, channel, player);
          return;
        }
      }
    }

    // Log đã bị xóa - Hàng chờ (queue) đã rỗng

    /////////// Xóa current track khỏi database khi queue rỗng //////////
    if (client.config.features.AUTO_RESUME) {
      // Log đã bị xóa - Queue rỗng, đang xóa current track
      await client.db.autoreconnect.set(`${player.guildId}.current`, "");
      // Log đã bị xóa - Đã xóa current track khỏi database
    }
    /////////// Xóa current track khỏi database khi queue rỗng //////////

    const channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel;
    new CleanUpMessage(client, channel, player);
    client.emit("playerEmpty", player);
  }
}
