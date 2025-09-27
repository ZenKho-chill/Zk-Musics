import { Manager } from "../../manager.js";
import { ZklinkPlayer } from "../../Zklink/main.js";
import { UpdateMusicStatusChannel } from "../../utilities/UpdateStatusChannel.js";
import chalk from "chalk";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";

export default class {
  async execute(client: Manager, player: ZklinkPlayer) {
    const guild = await client.guilds.fetch(player.guildId).catch(() => undefined);

    // Lưu voice channel ID để có thể sử dụng khi cần xóa voice status
    if (player.voiceId) {
      player.data.set("initial-voice-channel-id", player.voiceId);
      logDebug(
        "PlayerCreate",
        `Đã lưu voice channel ID ${player.voiceId} cho Guild ${player.guildId}`
      );
    }

    /////////// Cập nhật kênh trạng thái nhạc //////////
    await UpdateMusicStatusChannel(client, player);
    /////////// Cập nhật kênh trạng thái nhạc //////////

    logInfo(
      "PlayerCreate",
      `${chalk.hex("#f2d7b7")("Player Created in @ ")}${chalk.hex("#f2d7b7")(
        guild?.name
      )} / ${chalk.hex("#f2d7b7")(player.guildId)}`
    );
    logInfo(
      "PlayerCreate",
      `${chalk.hex("#f2d7b7")(client.i18n.get("vi", "server.events", "player_created"))}${chalk.hex("#f2d7b7")(
        guild?.name
      )} / ${chalk.hex("#f2d7b7")(player.guildId)}`
    );
    client.emit("playerCreate", player);
  }
}
