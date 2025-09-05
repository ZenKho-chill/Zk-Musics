import { Manager } from "../../manager.js";
import { EmbedBuilder, TextChannel, MessageFlagsBitField } from "discord.js";
import { CleanUpMessage } from "../../services/CleanUpMessage.js";
import { Mode247Builder } from "../../services/Mode247Builder.js";
import { ZklinkPlayer } from "../../Zklink/main.js";
import chalk from "chalk";
import { UpdateMusicStatusChannel } from "../../utilities/UpdateStatusChannel.js";
export default class {
  async execute(client: Manager, player: ZklinkPlayer) {
    if (!client.isDatabaseConnected)
      return client.logger.warn(
        "DatabaseService",
        "Cơ sở dữ liệu chưa kết nối nên sự kiện này tạm thời sẽ không chạy. Vui lòng thử lại sau!"
      );

    const guild = await client.guilds
      .fetch(player.guildId)
      .catch(() => undefined);
    client.logger.info(
      "PlayerStop",
      `${chalk.hex("#ff7f50")("Player đã dừng tại @ ")}${chalk.hex("#ff7f50")(
        guild?.name
      )} / ${chalk.hex("#ff7f50")(player.guildId)}`
    );

    /////////// Cập nhật thiết lập nhạc //////////
    await client.UpdateMusic(player);
    /////////// Cập nhật thiết lập nhạc ///////////

    /////////// Cập nhật kênh trạng thái nhạc //////////
    await UpdateMusicStatusChannel(client, player);
    /////////// Cập nhật kênh trạng thái nhạc //////////

    const channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel;
    client.sentQueue.set(player.guildId, false);
    const autoreconnectService = new Mode247Builder(client, player);
    let data = await autoreconnectService.get(player.guildId);

    if (!channel) return;

    if (data !== null && data && data.twentyfourseven)
      await autoreconnectService.build247(player.guildId, true, data.voice);

    let guildModel = await client.db.language.get(`${channel.guild.id}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(
        `${channel.guild.id}`,
        client.config.bot.LANGUAGE
      );
    }

    const language = guildModel;

    const isSudoDestroy = player.data.get("sudo-destroy");

    const embed = new EmbedBuilder()
      .setColor(client.color_main)
      .setDescription(
        `${client.i18n.get(language, "events.player", "queue_end_desc")}`
      );

    if (!isSudoDestroy) {
      const setup = await client.db.setup.get(player.guildId);
      const msg = await channel.send({
        embeds: [embed],
        flags: MessageFlagsBitField.Flags.SuppressNotifications,
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
