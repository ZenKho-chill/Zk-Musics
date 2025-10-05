import { Manager } from "../../manager.js";
import { ZklinkPlayer } from "../../Zklink/main.js";
import { UpdateMusicStatusChannel } from "../../utilities/UpdateStatusChannel.js";
import { log } from "../../utilities/LoggerHelper.js";
import chalk from "chalk";

export default class {
  async execute(client: Manager, player: ZklinkPlayer) {
    const guild = await client.guilds.fetch(player.guildId).catch(() => undefined);

    // Lưu voice channel ID để có thể sử dụng khi cần xóa voice status
    if (player.voiceId) {
      player.data.set("initial-voice-channel-id", player.voiceId);
      // Log đã bị xóa - Đã lưu voice channel ID
    }

    /////////// Cập nhật kênh trạng thái nhạc //////////
    await UpdateMusicStatusChannel(client, player);
    /////////// Cập nhật kênh trạng thái nhạc //////////

    // Log đã bị xóa - Player đã được tạo
    client.emit("playerCreate", player);
  }
}
