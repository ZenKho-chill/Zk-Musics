import { Manager } from "../manager.js";
import { ZklinkTrack } from "../Zklink/Player/ZklinkTrack.js";
import { FormatDuration } from "./FormatDuration.js";

export function TrackTitle(client: Manager, track: ZklinkTrack) {
  const sanitizedTitle = track.title.replace(
    /https?:\/\/\S+/g,
    "Ai muốn hát rồi sẽ tìm thấy một bài"
  );

  const title =
    sanitizedTitle.length > 35 ? sanitizedTitle.substring(0, 35) + "..." : sanitizedTitle;

  const author = track.author;
  const supportUrl = client.config.bot.SERVER_SUPPORT_URL;

  if (new FormatDuration().parse(track.duration) === "Live Stream") {
    return `${author}`;
  }

  if (client.config.features.HIDE_LINK) {
    return `${title}`;
  } else if (client.config.features.REPLACE_LINK) {
    return `[${title}](${supportUrl})`;
  } else {
    return `[${title}](${track.uri || supportUrl})`;
  }
}
