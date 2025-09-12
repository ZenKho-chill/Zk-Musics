import { Manager } from "../manager.js";
import { ZklinkPlayer } from "../Zklink/Player/ZklinkPlayer.js";

export async function UpdateMusicStatusChannel(client: Manager, player: ZklinkPlayer) {
  const guildId = player.guildId;
  if (!guildId) return;

  // Đọc config voice status từ file thay vì database
  const voiceStatus = client.config.features.VOICE_STATUS_CHANNEL ?? true;

  if (!voiceStatus) {
    client.logger.info(
      UpdateMusicStatusChannel.name,
      `Trạng thái voice đã bị tắt trong config, bỏ qua cập nhật.`
    );
    return;
  }

  const VoiceChannel = client.guilds.cache.get(guildId)?.members.me?.voice?.channelId;
  if (!VoiceChannel) return;

  try {
    const url = `/channels/${VoiceChannel}/voice-status` as const;

    let statusText = "Gõ **/play** để bắt đầu!"; // Trạng thái mặc định

    if (player.queue.current) {
      const { title, author, isStream } = player.queue.current;
      statusText = isStream ? `♪ Đang nghe ${author}` : `**♪ ${title}** của ${author}`;
    }

    await client.rest.put(url, { body: { status: statusText } });

    client.logger.info(
      UpdateMusicStatusChannel.name,
      `Đã cập nhật trạng thái nhạc cho Guild ${guildId}: ${statusText}`
    );
  } catch (error) {
    client.logger.error(
      UpdateMusicStatusChannel.name,
      `Cập nhật trạng thái nhạc thất bại cho Guild ${guildId}: ${error.message}`
    );
  }
}
