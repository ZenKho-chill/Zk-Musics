import { Manager } from "../../manager.js";
import { TextChannel } from "discord.js";
import { CleanUpMessage } from "../../services/CleanUpMessage.js";
import { ZklinkPlayer } from "../../Zklink/main.js";
import { UpdateMusicStatusChannel } from "../../utilities/UpdateStatusChannel.js";
import { NowPlayingUpdateService } from "../../services/NowPlayingUpdateService.js";
import chalk from "chalk";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
export default class {
  async execute(client: Manager, player: ZklinkPlayer) {
    logDebug("TrackEnd", `Event trackEnd được trigger cho guild ${player.guildId}`);
    
    if (!client.isDatabaseConnected)
      return logWarn(
        "DatabaseService",
        "Cơ sở dữ liệu chưa kết nối nên sự kiện này tạm thời sẽ không chạy. Vui lòng thử lại sau!"
      );

    const guild = await client.guilds.fetch(player.guildId).catch(() => undefined);
    logInfo(
      "TrackEnd",
      `${chalk.hex("#f08080")("Bài hát kết thúc tại @ ")}${chalk.hex("#f08080")(
        guild!.name
      )} / ${chalk.hex("#f08080")(player.guildId)}`
    );

    /////////// Cập nhật thiết lập nhạc //////////
    await client.UpdateMusic(player);
    /////////// Cập nhật thiết lập nhạc ///////////

    /////////// Cập nhật kênh trạng thái nhạc //////////
    await UpdateMusicStatusChannel(client, player);
    /////////// Cập nhật kênh trạng thái nhạc //////////

    client.emit("playerEnd", player);

    const channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel;
    if (channel) {
      // Luôn gọi CleanUpMessage để dọn dẹp message và collector
      new CleanUpMessage(client, channel, player);
      
      if (player.queue.length || player!.queue!.current) return;
      if (player.loop !== "none") return;
    }

    /////////// Xóa current track khỏi database nếu không còn bài nào để phát //////////
    if (client.config.features.AUTO_RESUME) {
      logDebug("TrackEnd", `Guild ${player.guildId} - Queue length: ${player.queue.length}, Current: ${!!player.queue.current}, Loop: ${player.loop}`);
      
      // Chỉ xóa current khi thực sự không còn bài nào để phát và không loop
      if (!player.queue.length && !player.queue.current && player.loop === "none") {
        logDebug("TrackEnd", `Điều kiện xóa current đã thỏa mãn cho guild ${player.guildId}, đang xóa...`);
        await client.db.autoreconnect.set(`${player.guildId}.current`, "");
        logInfo("TrackEnd", `✅ Đã xóa current track khỏi database cho guild ${player.guildId} - không còn bài để phát`);
      } else {
        logDebug("TrackEnd", `Không xóa current track cho guild ${player.guildId} - vẫn còn bài hoặc đang loop`);
      }
    } else {
      logDebug("TrackEnd", `AUTO_RESUME bị tắt, không xử lý current track cho guild ${player.guildId}`);
    }
    /////////// Xóa current track khỏi database nếu không còn bài nào để phát //////////

    const currentPlayer = client.Zklink.players.get(player.guildId) as ZklinkPlayer;
    if (!currentPlayer) return;
    if (!currentPlayer.sudoDestroy) await player.destroy().catch(() => {});
  }
}
