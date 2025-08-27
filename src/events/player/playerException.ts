import { Manager } from "../../manager.js";
import { EmbedBuilder, TextChannel, MessageFlags } from "discord.js";
import util from "node:util";
import { Mode247Builder } from "../../services/Mode247Builder.js";
import { CleanUpMessage } from "../../services/CleanUpMessage.js";
import { ZklinkPlayer } from "../../zklink/main.js";
import { UpdateMusicStatusChannel } from "../../utilities/UpdateStatusChannel.js";
export default class {
  async execute(
    client: Manager,
    player: ZklinkPlayer,
    message: string,
    data: Record<string, any>
  ) {
    client.logger.info(
      "PlayerException",
      `Player gặp ngoại lệ ${util.inspect(message)}`
    );

    /////////// Cập nhật thiết lập nhạc ///////////
    await client.UpdateMusic(player);
    /////////// Cập nhật thiết lập nhạc ///////////

    /////////// Cập nhật kênh trạng thái nhạc //////////
    await UpdateMusicStatusChannel(client, player);
    /////////// Cập nhật kênh trạng thái nhạc //////////

    const fetch_channel = await client.channels
      .fetch(player.textId)
      .catch(() => undefined);
    const text_channel = fetch_channel as TextChannel | undefined;

    const guild = fetch_channel.guild;
    let guildModel = await client.db.language.get(`${guild.id}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(
        `${guild.id}`,
        client.config.bot.LANGUAGE
      );
    }
    const language = guildModel;

    const embed = new EmbedBuilder()
      .setColor(client.color_main)
      .setDescription(
        `${client.i18n.get(language, "events.player", "player_get_exception")}`
      );
    if (text_channel) {
      const msg = await text_channel.send({
        embeds: [embed],
        flags: MessageFlags.SuppressNotifications,
      });
      setTimeout(async () => {
        try {
          await msg.delete();
        } catch (error) {
          client.logger.info(
            "PlayerException",
            `Đã xóa tin nhắn trước đó tại @ ${msg.guild!.name} / ${
              player.guildId
            }`
          );
        }
      }, client.config.features.DELETE_MSG_TIMEOUT);
    }

    const data247 = await new Mode247Builder(client, player).get(
      player.guildId
    );
    const channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel;
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
