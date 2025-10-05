import { Manager } from "../../manager.js";
import { EmbedBuilder, TextChannel, MessageFlags } from "discord.js";
import { CleanUpMessage } from "../../services/CleanUpMessage.js";
import { Mode247Builder } from "../../services/Mode247Builder.js";
import { ZklinkPlayer } from "../../Zklink/main.js";
import { UpdateMusicStatusChannel, ClearMusicStatusChannelWithDelay } from "../../utilities/UpdateStatusChannel.js";
import { NowPlayingUpdateService } from "../../services/NowPlayingUpdateService.js";
import chalk from "chalk";
export default class {
  async execute(client: Manager, player: ZklinkPlayer) {
    if (!client.isDatabaseConnected) {
      // Log đã bị xóa - Cơ sở dữ liệu chưa kết nối
      return;
    }

    const guild = await client.guilds.fetch(player.guildId).catch(() => undefined);
    // Log đã bị xóa - Player đã bị hủy

    /////////// Cập nhật thiết lập nhạc ///////////
    await client.UpdateMusic(player);
    /////////// Cập nhật thiết lập nhạc ///////////

    /////////// Dừng tracking và xóa nowplaying message //////////
    await NowPlayingUpdateService.getInstance().deleteNowPlaying(client, player.guildId);
    /////////// Dừng tracking và xóa nowplaying message //////////

    /////////// Cập nhật kênh trạng thái nhạc //////////
    const isSudoDestroy = player.data.get("sudo-destroy");
    const voiceStatusAlreadyCleared = player.data.get("voice-status-cleared");
    
    // Chỉ xử lý voice status nếu chưa được clear ở voiceStateUpdate
    if (!voiceStatusAlreadyCleared) {
      // Lấy voice channel ID theo thứ tự ưu tiên
      const savedVoiceChannelId = (player.data.get("last-voice-channel-id") as string) || 
                                  (player.data.get("initial-voice-channel-id") as string) ||
                                  player.voiceId || 
                                  client.guilds.cache.get(player.guildId)?.members.me?.voice?.channelId;
      
      if (isSudoDestroy) {
        // Nếu player bị destroy do kick/disconnect, xóa voice status
        await ClearMusicStatusChannelWithDelay(client, player.guildId, savedVoiceChannelId, 500);
      } else {
        // Nếu player kết thúc bình thường, cập nhật voice status về trạng thái mặc định
        await UpdateMusicStatusChannel(client, player);
      }
    } else {
      // Log đã bị xóa - Voice status đã được xóa trong voiceStateUpdate
    }
    /////////// Cập nhật kênh trạng thái nhạc //////////

    client.emit("playerDestroy", player);

    const channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel;
    client.sentQueue.set(player.guildId, false);
    let data = await new Mode247Builder(client, player).get(player.guildId);

    if (!channel) return;

    if (data !== null && data && data.twentyfourseven) {
      await new Mode247Builder(client, player).build247(player.guildId, true, data.voice);
      client.Zklink.players.create({
        guildId: data.guild!,
        voiceId: data.voice!,
        textId: data.text!,
        shardId: guild?.shardId ?? 0,
        nodeName: (await client.Zklink.nodes.getLeastUsed()).options.name,
        deaf: true,
        mute: false,
        region: player.lastRegion ?? player.region ?? null,
        volume: client.config.bot.DEFAULT_VOLUME ?? 100,
      });
    } else await client.db.autoreconnect.delete(player.guildId);

    let guildModel = await client.db.language.get(`${channel.guild.id}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(`${channel.guild.id}`, client.config.bot.LANGUAGE);
    }

    const language = guildModel;

    const embed = new EmbedBuilder()
      .setColor(client.color_main)
      .setDescription(`${client.i18n.get(language, "events.player", "queue_end_desc")}`);

    if (!isSudoDestroy) {
      const setup = await client.db.setup.get(player.guildId);
      const msg = await channel.send({
        embeds: [embed],
        flags: MessageFlags.SuppressNotifications,
      });
      setTimeout(
        async () =>
          !setup || setup == null || setup.channel !== channel.id
            ? msg.delete().catch(() => null)
            : true,
        client.config.features.DELETE_MSG_TIMEOUT
      );
    }

    const setupdata = await client.db.setup.get(`${player.guildId}`);
    if (setupdata?.channel == player.textId) return;
    new CleanUpMessage(client, channel, player);
    player.data.clear();
  }
}
