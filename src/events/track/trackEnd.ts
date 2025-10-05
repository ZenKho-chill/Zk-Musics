import { Manager } from "../../manager.js";
import { TextChannel } from "discord.js";
import { CleanUpMessage } from "../../services/CleanUpMessage.js";
import { ZklinkPlayer } from "../../Zklink/main.js";
import { UpdateMusicStatusChannel } from "../../utilities/UpdateStatusChannel.js";
import { NowPlayingUpdateService } from "../../services/NowPlayingUpdateService.js";
import chalk from "chalk";
export default class {
  async execute(client: Manager, player: ZklinkPlayer) {
    // Log đã bị xóa - Event trackEnd được trigger
    
    if (!client.isDatabaseConnected) {
      // Log đã bị xóa - Cơ sở dữ liệu chưa kết nối
      return;
    }

    const guild = await client.guilds.fetch(player.guildId).catch(() => undefined);
    // Log đã bị xóa - Bài hát kết thúc

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
      // Log đã bị xóa - Guild queue info
      
      // Chỉ xóa current khi thực sự không còn bài nào để phát và không loop
      if (!player.queue.length && !player.queue.current && player.loop === "none") {
        // Log đã bị xóa - Điều kiện xóa current đã thỏa mãn
        await client.db.autoreconnect.set(`${player.guildId}.current`, "");
        // Log đã bị xóa - Đã xóa current track khỏi database
      } else {
        // Log đã bị xóa - Không xóa current track
      }
    } else {
      // Log đã bị xóa - AUTO_RESUME bị tắt
    }
    /////////// Xóa current track khỏi database nếu không còn bài nào để phát //////////

    const currentPlayer = client.Zklink.players.get(player.guildId) as ZklinkPlayer;
    if (!currentPlayer) return;
    if (!currentPlayer.sudoDestroy) await player.destroy().catch(() => {});
  }
}
