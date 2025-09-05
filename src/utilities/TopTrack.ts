import { Manager } from "../manager.js";
import { ZklinkPlayer } from "../Zklink/Player/ZklinkPlayer.js";
import { User } from "discord.js";

export async function TopTrack(client: Manager, player: ZklinkPlayer) {
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
  const trackNameNormalized = song.title.trim();
  const topTrackEntry = await client.db.TopTrack.get(requester.id);

  let topTracks = topTrackEntry?.Tracks || [];
  const existingTrack = topTracks.find((track) => track.name === trackNameNormalized);

  if (existingTrack) {
    existingTrack.count += 1;
  } else {
    topTracks.push({
      name: trackNameNormalized,
      count: 1,
    });
  }
  await client.db.TopTrack.set(requester.id, {
    userId: requester.id,
    username: requester.username,
    Tracks: topTracks,
  });
}