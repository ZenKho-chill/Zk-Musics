import {
  PermissionsBitField,
  EmbedBuilder,
  VoiceState,
  GuildMember,
  Role,
  TextChannel,
} from "discord.js";
import { Manager } from "../../manager.js";
import { Mode247Builder } from "../../services/Mode247Builder.js";
import { ZklinkPlayerState } from "../../Zklink/main.js";
import { ClearMusicStatusChannel, ClearMusicStatusChannelWithDelay } from "../../utilities/UpdateStatusChannel.js";

export default class {
  async execute(client: Manager, oldState: VoiceState, newState: VoiceState) {
    if (!client.isDatabaseConnected) {
      // Log đã bị xóa - Cơ sở dữ liệu chưa kết nối
      return;
    }

    const player = client.Zklink?.players.get(newState.guild.id);
    if (!player) return;

    const is247 = await client.db.autoreconnect.get(`${newState.guild.id}`);

    if (newState.channelId == null && newState.member?.user.id === client.user?.id) {
      // Lưu lại voice channel từ oldState (trước khi disconnect) thay vì player.voiceId
      const lastVoiceChannel = oldState.channelId || player.voiceId;

      // Set flag để playerDestroy biết voice status đã được handle ở đây
      player.data.set("sudo-destroy", true);
      player.data.set("voice-status-cleared", true);
      
      player.state !== ZklinkPlayerState.DESTROYED ? player.destroy() : true;

      // Xóa voice status channel khi bot bị kick/disconnect
      if (lastVoiceChannel) {
        // Log đã bị xóa - Bot bị kick/disconnect
        await ClearMusicStatusChannelWithDelay(client, newState.guild.id, lastVoiceChannel, 500);
      } else {
        // Nếu không có channel ID, log và skip - đây là trường hợp bình thường
        // Log đã bị xóa - Bot bị kick/disconnect không xác định được voice channel
      }

      // Cancel leave timeout nếu có vì player đã bị destroy
      const existingTimeout = client.leaveDelay.get(newState.guild.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        client.leaveDelay.delete(newState.guild.id);
        // Log đã bị xóa - Đã hủy leave timeout
      }
    }

    if (oldState.member?.user.bot || newState.member?.user.bot) return;

    let data = await new Mode247Builder(client).get(newState.guild.id);

    const setup = await client.db.setup.get(newState.guild.id);

    let guildModel = await client.db.language.get(`${newState.guild.id}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(`${newState.guild.id}`, client.config.bot.LANGUAGE);
    }
    const language = guildModel;

    if (data && data.twentyfourseven) return;

    const isInVoice = await newState.guild.members.fetch(client.user!.id).catch(() => undefined);

    if (!isInVoice || !isInVoice.voice.channelId) {
      player.data.set("sudo-destroy", true);
      player.state !== ZklinkPlayerState.DESTROYED ? player.destroy() : true;
    }

    if (
      newState.channelId &&
      String(newState.channel!.type) == "GUILD_STAGE_VOICE" &&
      newState.guild.members.me!.voice.suppress &&
      (newState.guild.members.me!.permissions.has(PermissionsBitField.Flags.Connect) ||
        (newState.channel &&
          newState.channel
            .permissionsFor(newState.guild.members.me as GuildMember | Role)
            .has(PermissionsBitField.Flags.Speak)))
    )
      newState.guild.members.me!.voice.setSuppressed(false);

    if (oldState.id === client.user!.id) return;
    const isInOldVoice = await oldState.guild.members.fetch(client.user!.id).catch(() => undefined);
    if (!isInOldVoice || !isInOldVoice.voice.channelId) return;

    const vcRoom = oldState.guild.members.me!.voice.channel!.id;

    const leaveEmbed = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel;

    if (
      newState.guild.members.me!.voice?.channel &&
      newState.guild.members.me!.voice.channel.members.filter((m) => !m.user.bot).size !== 0
    ) {
      if (oldState.channelId) return;
      if (oldState.channelId === newState.channelId) return;
      if (newState.guild.members.me!.voice.channel.members.filter((m) => !m.user.bot).size > 2)
        return;
      // Tiếp tục phát nhạc

      const leaveTimeout = client.leaveDelay.get(newState.guild.id);
      if (leaveTimeout) {
        clearTimeout(leaveTimeout);
        client.leaveDelay.delete(newState.guild.id);
      }

      const currentPause = player.paused;

      player.paused == false ? true : player.setPause(false);
      if (currentPause !== false && player.track !== null) {
        const msg = leaveEmbed
          ? await leaveEmbed.send({
              embeds: [
                new EmbedBuilder()
                  .setDescription(`${client.i18n.get(language, "events.player", "leave_resume")}`)
                  .setColor(client.color_main),
              ],
            })
          : null;
        setTimeout(
          async () =>
            (!setup || setup == null || setup.channel !== player.textId) && msg
              ? msg.delete().catch(() => null)
              : true,
          client.config.features.DELETE_MSG_TIMEOUT
        );
      }
    }

    if (
      isInOldVoice &&
      isInOldVoice.voice.channelId === oldState.channelId &&
      oldState.guild.members.me!.voice?.channel &&
      oldState.guild.members.me!.voice.channel.members.filter((m) => !m.user.bot).size === 0
    ) {
      // Tạm dừng phát nhạc
      const currentPause = player.paused;
      player.paused == true ? true : player.setPause(true);

      if (currentPause !== true && player.track !== null) {
        const msg = await leaveEmbed.send({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${client.i18n.get(language, "events.player", "leave_pause")}`)
              .setColor(client.color_main),
          ],
        });
        setTimeout(async () => {
          const isChannelAvalible = await client.channels
            .fetch(msg.channelId)
            .catch(() => undefined);
          if (!isChannelAvalible) return;
          !setup || setup == null || setup.channel !== player.textId
            ? msg.delete().catch(() => null)
            : true;
        }, client.config.features.DELETE_MSG_TIMEOUT);
      }

      // Hẹn giờ rời phòng (delay leave timeout)
      let leaveDelayTimeout = setTimeout(async () => {
        const vcMembers = oldState.guild.members.me!.voice.channel?.members.filter(
          (m) => !m.user.bot
        ).size;
        if (!vcMembers || vcMembers === 1) {
          const newPlayer = client.Zklink?.players.get(newState.guild.id);

          // Kiểm tra player còn tồn tại và chưa bị destroy
          if (newPlayer && newPlayer.state !== ZklinkPlayerState.DESTROYED) {
            newPlayer.data.set("sudo-destroy", true);
            newPlayer.data.set("voice-status-cleared", true); // Flag để tránh duplicate trong playerDestroy
            
            try {
              // Xóa voice status trước khi stop player
              // Log đã bị xóa - Auto-leave timeout
              await ClearMusicStatusChannelWithDelay(client, newState.guild.id, newPlayer.voiceId, 500);
              
              newPlayer.stop(is247 && is247.twentyfourseven ? false : true);
              // Log đã bị xóa - Bot đã tự động rời voice channel
            } catch (error) {
              // Log đã bị xóa - Lỗi khi stop player
            }
          } else {
            // Log đã bị xóa - Player đã bị destroy trước đó
          }
        }
        clearTimeout(leaveDelayTimeout);
        client.leaveDelay.delete(newState.guild.id);
      }, client.config.features.LEAVE_TIMEOUT);
      client.leaveDelay.set(newState.guild.id, leaveDelayTimeout);
    }
  }
}
