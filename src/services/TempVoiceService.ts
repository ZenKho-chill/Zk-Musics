import { Manager } from "../manager.js";
import {
  VoiceState,
  ChannelType,
  VoiceChannel,
  StageChannel,
  PermissionsBitField,
} from "discord.js";
import { TempVoiceChannel } from "../database/schema/TempVoiceChannel.js";

export default class TempVoiceService {
  private static readonly MAX_CHANNELS_PER_USER = 1;

  public async init(client: Manager) {
    const allChannels = await client.db.TempVoiceChannel.all();

    for (const entry of allChannels) {
      const tempVoiceChannel = entry.value;
      const guild = client.guilds.cache.get(tempVoiceChannel.guildId);
      if (!guild) continue;

      const tempChannel = guild.channels.cache.get(tempVoiceChannel.channelId);

      if (tempChannel instanceof VoiceChannel) {
        if (tempChannel.members.size === 0) {
          await tempChannel.delete("Kênh voice tạm thời đã hết hạn");
          await client.db.TempVoiceChannel.delete(tempVoiceChannel.id);
        } else {
          this.monitorChannel(tempChannel, tempVoiceChannel.id, client);
        }
      } else {
        await client.db.TempVoiceChannel.delete(tempVoiceChannel.id);
      }
    }
  }

  private async monitorChannel(
    channel: VoiceChannel,
    channelId: string,
    client: Manager
  ) {
    const checkEmpty = async () => {
      const updatedChannel = channel.guild.channels.cache.get(channel.id);
      if (
        updatedChannel &&
        updatedChannel instanceof VoiceChannel &&
        updatedChannel.members.size === 0
      ) {
        try {
          await updatedChannel.delete("Kênh voice tạm thời đã hết hạn");
          await client.db.TempVoiceChannel.delete(channelId);
        } catch (error) {
          if ((error as Error).message !== "Unknown Channel") {
            client.logger.error(
              TempVoiceService.name,
              `Lỗi khi xóa kênh voice tạm thời`
            );
          }
        }
      }
    };

    setInterval(checkEmpty, 5 * 60 * 1000); // Kiểm tra mỗi 5 phút
    channel.guild.client.on(
      "voiceStateUpdate",
      async (oldState: VoiceState, newState: VoiceState) => {
        if (
          oldState.channelId === channel.id &&
          oldState.channel?.members.size === 0
        ) {
          await checkEmpty();
        }
      }
    );
  }

  public async handleVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState,
    client: Manager
  ) {
    const guildId = newState.guild.id;
    const userId = newState.member?.id;

    const guildSettings = await client.db.TempVoiceChannelSetting.get(guildId);
    if (!guildSettings?.tempVoiceEnabled || !guildSettings.createVoiceChannelId)
      return;

    if (newState.channelId === guildSettings.createVoiceChannelId) {
      const allChannels = await client.db.TempVoiceChannel.all();
      const userChannels = allChannels.filter(
        (entry) =>
          entry.value.guildId === guildId && entry.value.ownerId === userId
      );

      if (userChannels.length >= TempVoiceService.MAX_CHANNELS_PER_USER) {
        const existingChannelId = userChannels[0].value.channelId;
        const existingChannel =
          newState.guild.channels.cache.get(existingChannelId);

        if (
          existingChannel instanceof VoiceChannel ||
          existingChannel instanceof StageChannel
        ) {
          await newState.member?.voice.setChannel(existingChannel);
        }
        return;
      }

      // Đảm bảo tên kênh hợp lệ
      const channelName = `${
        newState.member?.displayName || "Người dùng"
      } - Phòng tạm`;

      // Tạo kênh voice tạm thời với quyền phù hợp
      const tempChannel = await newState.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: newState.channel?.parentId,
        permissionOverwrites: [
          {
            id: newState.guild.roles.everyone,
            allow: [
              PermissionsBitField.Flags.Connect,
              PermissionsBitField.Flags.Speak,
            ],
          },
          {
            id: userId!,
            allow: [
              PermissionsBitField.Flags.ManageChannels,
              PermissionsBitField.Flags.MuteMembers,
              PermissionsBitField.Flags.DeafenMembers,
            ],
          },
        ],
      });

      // Chuyển người dùng vào kênh mới
      await newState.member?.voice.setChannel(tempChannel);

      const tempVoiceChannel: TempVoiceChannel = {
        id: `${guildId}-${userId}-${Date.now()}`,
        ownerId: userId!,
        guildId,
        createdAt: Date.now(),
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour expiration
        channelId: tempChannel.id,
      };

      await client.db.TempVoiceChannel.set(
        tempVoiceChannel.id,
        tempVoiceChannel
      );
      this.monitorChannel(tempChannel, tempVoiceChannel.id, client);
    }

    if (oldState.channelId && !newState.channelId) {
      const allChannels = await client.db.TempVoiceChannel.all();
      const tempVoiceChannel = allChannels.find(
        (channel) => channel.value.channelId === oldState.channelId
      );
      const tempChannel = oldState.guild.channels.cache.get(oldState.channelId);

      if (
        tempVoiceChannel &&
        tempChannel instanceof VoiceChannel &&
        tempChannel.members.size === 0
      ) {
        try {
          await tempChannel.delete("Kênh voice tạm thời đã hết hạn");
          await client.db.TempVoiceChannel.delete(tempVoiceChannel.id);
        } catch (error) {
          if ((error as Error).message !== "Unknown Channel") {
            client.logger.error(TempVoiceService.name, `Lỗi khi xóa kênh tạm`);
          }
        }
      }
    }
  }
}
