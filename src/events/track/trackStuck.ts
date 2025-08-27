import { Manager } from "../../manager.js";
import { TextChannel, EmbedBuilder, MessageFlags } from "discord.js";
import { Mode247Builder } from "../../services/Mode247Builder.js";
import { CleanUpMessage } from "../../services/CleanUpMessage.js";
import { ZklinkPlayer } from "../../zklink/main.js";
import { UpdateMusicStatusChannel } from "../../utilities/UpdateStatusChannel.js";
import chalk from "chalk";
export default class {
  async execute(
    client: Manager,
    player: ZklinkPlayer,
    data: Record<string, any>
  ) {
    if (!client.isDatabaseConnected)
      return client.logger.warn(
        "DatabaseService",
        "Cơ sở dữ liệu chưa kết nối nên sự kiện này tạm thời sẽ không chạy. Vui lòng thử lại sau!"
      );

    /////////// Cập nhật thiết lập nhạc //////////
    await client.UpdateMusic(player);
    /////////// Cập nhật thiết lập nhạc ///////////

    /////////// Cập nhật kênh trạng thái nhạc //////////
    await UpdateMusicStatusChannel(client, player);
    /////////// Cập nhật kênh trạng thái nhạc //////////

    const guild = await client.guilds
      .fetch(player.guildId)
      .catch(() => undefined);

    const channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel;
    if (!channel) return player.destroy().catch(() => {});

    let guildModel = await client.db.language.get(`${channel.guild.id}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(
        `${channel.guild.id}`,
        client.config.bot.LANGUAGE
      );
    }

    const language = guildModel;

    const embed = new EmbedBuilder()
      .setColor(client.color_main)
      .setDescription(
        `${client.i18n.get(language, "events.player", "player_track_stuck")}`
      );

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

    client.logger.error(
      "TrackStuck",
      `${chalk.hex("#fc2c03")("Bài bị kẹt tại @ ")}${chalk.hex("#fc2c03")(
        guild!.name
      )} / ${chalk.hex("#fc2c03")(player.guildId)}`
    );

    const data247 = await new Mode247Builder(client, player).get(
      player.guildId
    );
    if (data247 !== null && data247 && data247.twentyfourseven && channel)
      new CleanUpMessage(client, channel, player);
    const currentPlayer = client.zklink.players.get(
      player.guildId
    ) as ZklinkPlayer;
    if (!currentPlayer) return;
    if (currentPlayer.queue.length > 0)
      return await player.skip().catch(() => {});
    if (!currentPlayer.sudoDestroy) await player.destroy().catch(() => {});
  }
}
