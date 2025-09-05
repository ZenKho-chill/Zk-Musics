import { Manager } from "../manager.js";
import { ZklinkPlayer } from "../Zklink/main.js";
import { User } from "discord.js";

export async function TopArtist(client: Manager, player: ZklinkPlayer) {
  if (!player.queue?.current) {
    return;
  }

  if (player.queue.current.isStream || player.queue.current.source === "soundcloud") {
    return;
  }

  const requester = player.queue.current.requester as User;
  if (!requester) {
    return;
  }

  const song = player.queue.current;
  const artistNameNormalized = song.author.trim();
  const topArtistEntry = await client.db.TopArtist.get(requester.id);
  let topArtists = topArtistEntry?.Artists || [];
  const existingArtist = topArtists.find((artist) => artist.name === artistNameNormalized);

  if (existingArtist) {
    existingArtist.count += 1;
  } else {
    topArtists.push({
      name: artistNameNormalized,
      count: 1,
    });
  }
  await client.db.TopArtist.set(requester.id, {
    userId: requester.id,
    username: requester.username,
    Artists: topArtists,
  });
}