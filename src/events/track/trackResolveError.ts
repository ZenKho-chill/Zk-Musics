import { Manager } from "../../manager.js";
import { TextChannel, EmbedBuilder, MessageFlags } from "discord.js";
import { Mode247Builder } from "../../services/Mode247Builder.js";
import { CleanUpMessage } from "../../services/CleanUpMessage.js";
import { ZklinkPlayer, ZklinkTrack } from "../../Zklink/main.js";
import { UpdateMusicStatusChannel } from "../../utilities/UpdateStatusChannel.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
export default class {
  async execute(client: Manager, player: ZklinkPlayer, track: ZklinkTrack, message: string) {
    if (!client.isDatabaseConnected)
      return logWarn(
        "DatabaseService",
        "Cơ sở dữ liệu chưa kết nối nên sự kiện này tạm thời sẽ không chạy. Vui lòng thử lại sau!"
      );

    const guild = await client.guilds.fetch(player.guildId).catch(() => undefined);

    logWarn("TrackResolveError", message);

    /////////// Cập nhật thiết lập nhạc //////////
    await client.UpdateMusic(player);
    /////////// Cập nhật thiết lập nhạc ///////////

    /////////// Cập nhật kênh trạng thái nhạc //////////
    await UpdateMusicStatusChannel(client, player);
    /////////// Cập nhật kênh trạng thái nhạc //////////

    const channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel;

    let guildModel = await client.db.language.get(`${player.guildId}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(`${player.guildId}`, client.config.bot.LANGUAGE);
    }

    const language = guildModel;

    const embed = new EmbedBuilder()
      .setColor(client.color_main)
      .setDescription(`${client.i18n.get(language, "events.player", "player_track_error")}`);

    if (channel) {
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

    logError("TrackResolveError", `Lỗi track tại ${guild!.name} / ${player.guildId}.`);

    const data247 = await new Mode247Builder(client, player).get(player.guildId);
    if (data247 !== null && data247 && data247.twentyfourseven && channel)
      new CleanUpMessage(client, channel, player);

    const currentPlayer = client.Zklink.players.get(player.guildId) as ZklinkPlayer;
    if (!currentPlayer) return;
    if (currentPlayer.queue.length > 0) return await player.skip().catch(() => {});
    if (!currentPlayer.sudoDestroy) await player.destroy().catch(() => {});
  }
}
