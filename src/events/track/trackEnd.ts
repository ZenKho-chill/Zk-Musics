import { Manager } from "../../manager.js";
import { TextChannel } from "discord.js";
import { CleanUpMessage } from "../../services/CleanUpMessage.js";
import { ZklinkPlayer } from "../../zklink/main.js";
import { UpdateMusicStatusChannel } from "../../utilities/UpdateStatusChannel.js";
import chalk from "chalk";
export default class {
  async execute(client: Manager, player: ZklinkPlayer) {
    if (!client.isDatabaseConnected)
      return client.logger.warn(
        "DatabaseService",
        "Cơ sở dữ liệu chưa kết nối nên sự kiện này tạm thời sẽ không chạy. Vui lòng thử lại sau!"
      );

    const guild = await client.guilds.fetch(player.guildId).catch(() => undefined);
    client.logger.info(
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
      if (player.queue.length || player!.queue!.current)
        return new CleanUpMessage(client, channel, player);

      if (player.loop !== "none") return new CleanUpMessage(client, channel, player);
    }

    const currentPlayer = client.zklink.players.get(player.guildId) as ZklinkPlayer;
    if (!currentPlayer) return;
    if (!currentPlayer.sudoDestroy) await player.destroy().catch(() => {});
  }
}