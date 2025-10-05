import { Manager } from "../manager.js";
import { ZklinkPlayer } from "../Zklink/Player/ZklinkPlayer.js";
import { PermissionsBitField } from "discord.js";

export async function UpdateMusicStatusChannel(client: Manager, player: ZklinkPlayer) {
  const guildId = player.guildId;
  if (!guildId) return;

  // Đọc config voice status từ file thay vì database
  const voiceStatus = client.config.features.VOICE_STATUS_CHANNEL ?? true;

  if (!voiceStatus) {
    // Log đã bị xóa - Trạng thái voice đã bị tắt trong config
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

    // Log đã bị xóa - Đã cập nhật trạng thái nhạc cho Guild
  } catch (error) {
    // Log đã bị xóa - Cập nhật trạng thái nhạc thất bại cho Guild
  }
}

/**
 * Kiểm tra xem guild có trong trạng thái bình thường không (bot vẫn có quyền)
 * @param client Manager instance
 * @param guildId Guild ID
 * @returns true nếu bot vẫn có quyền trong guild
 */
function isGuildAccessible(client: Manager, guildId: string): boolean {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return false;
  
  const botMember = guild.members.me;
  if (!botMember) return false;
  
  // Kiểm tra bot có quyền view channels và connect không
  const hasBasicPermissions = botMember.permissions.has([
    PermissionsBitField.Flags.ViewChannel, 
    PermissionsBitField.Flags.Connect
  ]);
  return hasBasicPermissions;
}

/**
 * Xóa voice status channel khi bot bị kick hoặc disconnect
 * @param client Manager instance
 * @param guildId Guild ID
 * @param voiceChannelId Voice channel ID (optional)
 */
export async function ClearMusicStatusChannel(client: Manager, guildId: string, voiceChannelId?: string) {
  // Đọc config voice status từ file thay vì database
  const voiceStatus = client.config.features.VOICE_STATUS_CHANNEL ?? true;

  if (!voiceStatus) {
    // Log đã bị xóa - Trạng thái voice đã bị tắt trong config
    return;
  }

  // Kiểm tra guild có tồn tại không
  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    // Log đã bị xóa - Guild không tồn tại trong cache
    return;
  }

  // Tìm voice channel theo thứ tự ưu tiên
  let targetVoiceChannel = voiceChannelId;
  
  if (!targetVoiceChannel) {
    // Fallback 1: Lấy từ bot member hiện tại
    targetVoiceChannel = guild.members.me?.voice?.channelId;
  }
  
  if (!targetVoiceChannel) {
    // Fallback 2: Tìm trong cache guild channels theo activity
    const voiceChannels = guild.channels.cache.filter(channel => 
      channel.isVoiceBased() && 
      channel.members.has(client.user!.id)
    );
    if (voiceChannels.size > 0) {
      targetVoiceChannel = voiceChannels.first()?.id;
    }
  }

  if (!targetVoiceChannel) {
    // Fallback 3: Lấy từ player cache nếu có
    const activePlayer = client.Zklink?.players.get(guildId);
    if (activePlayer && activePlayer.voiceId) {
      targetVoiceChannel = activePlayer.voiceId;
      // Log đã bị xóa - Sử dụng voice channel từ active player
    }
  }

  if (!targetVoiceChannel) {
    // Fallback 4: Lấy từ initial voice channel đã lưu
    const activePlayer = client.Zklink?.players.get(guildId);
    const initialVoiceChannel = activePlayer?.data.get("initial-voice-channel-id") as string;
    if (initialVoiceChannel) {
      targetVoiceChannel = initialVoiceChannel;
      // Log đã bị xóa - Sử dụng initial voice channel từ player data
    }
  }

  if (!targetVoiceChannel) {
    // Fallback 4: Thử tìm voice channels bằng REST API và thử clear từng cái
    try {
      const guild = client.guilds.cache.get(guildId);
      if (guild) {
        const channels = await guild.channels.fetch();
        const voiceChannels = channels.filter(channel => channel?.isVoiceBased());
        
        if (voiceChannels.size > 0) {
          // Log đã bị xóa - Tìm thấy voice channels
          
          // Thử xóa voice status cho từng voice channel
          for (const [channelId] of voiceChannels) {
            try {
              const url = `/channels/${channelId}/voice-status` as const;
              await client.rest.put(url, { body: { status: "" } });
              
              // Log đã bị xóa - Đã xóa voice status thành công cho Guild
              return; // Thành công, thoát khỏi loop
            } catch (channelError: any) {
              // Bỏ qua lỗi cho channel này và thử channel tiếp theo
              // Log đã bị xóa - Không thể xóa voice status cho channel
            }
          }
        }
      }
    } catch (error: any) {
      // Log đã bị xóa - Lỗi khi tìm voice channels
    }

    // Nếu tất cả fallbacks đều thất bại
    const hasGuildAccess = isGuildAccessible(client, guildId);
    
    if (hasGuildAccess) {
      // Nếu bot vẫn có quyền nhưng không tìm thấy voice channel
      // Log đã bị xóa - Đã thử tất cả methods nhưng không thể xóa voice status
    } else {
      // Nếu bot mất quyền trong guild thì đây là trường hợp bình thường
      // Log đã bị xóa - Bot không có quyền truy cập Guild
    }
    return;
  }

  try {
    const url = `/channels/${targetVoiceChannel}/voice-status` as const;
    
    // Xóa voice status bằng cách gửi status trống
    await client.rest.put(url, { body: { status: "" } });

    // Log đã bị xóa - Đã xóa trạng thái voice channel cho Guild
  } catch (error: any) {
    // Kiểm tra lỗi cụ thể để log phù hợp
    if (error.code === 50001 || error.code === 50013) {
      // Log đã bị xóa - Không có quyền truy cập voice channel
    } else if (error.code === 10003) {
      // Log đã bị xóa - Voice channel không tồn tại trong Guild
    } else {
      // Log đã bị xóa - Xóa trạng thái voice channel thất bại cho Guild
    }
  }
}

/**
 * Xóa voice status với độ trễ (để đảm bảo Discord đã cập nhật trạng thái)
 * @param client Manager instance
 * @param guildId Guild ID
 * @param voiceChannelId Voice channel ID (optional)
 * @param delayMs Độ trễ tính bằng milliseconds (mặc định: 1000ms)
 */
export async function ClearMusicStatusChannelWithDelay(
  client: Manager, 
  guildId: string, 
  voiceChannelId?: string, 
  delayMs: number = 1000
) {
  setTimeout(async () => {
    await ClearMusicStatusChannel(client, guildId, voiceChannelId);
  }, delayMs);
}
