import { Manager } from "../../manager.js";
import { ZkslinkPlayer } from "../../zklink/main.js";
import { UpdateMusicStatusChannel } from "../../utilities/UpdateStatusChannel.js";
import chalk from "chalk";

export default class {
  async execute(client: Manager, player: ZkslinkPlayer) {
    const guild = await client.guilds
      .fetch(player.guildId)
      .catch(() => undefined);

    /////////// Cập nhật kênh trạng thái nhạc //////////
    await UpdateMusicStatusChannel(client, player);
    /////////// Cập nhật kênh trạng thái nhạc //////////

    client.logger.info(
      "PlayerCreate",
      `${chalk.hex("#f2d7b7")("Player Created in @ ")}${chalk.hex("#f2d7b7")(
        guild?.name
      )} / ${chalk.hex("#f2d7b7")(player.guildId)}`
    );
    client.logger.info(
      "PlayerCreate",
      `${chalk.hex("#f2d7b7")("Player đã được tạo tại @ ")} ${chalk.hex(
        "#f2d7b7"
      )(guild?.name)} / ${chalk.hex("#f2d7b7")(player.guildId)}`
    );
    client.emit("playerCreate", player);
  }
}
