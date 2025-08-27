import {
  PermissionsBitField,
  EmbedBuilder,
  VoiceState,
  GuildMember,
  Role,
  TextChannel,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  MessageFlags,
} from "discord.js";
import { Manager } from "../../manager.js";
import { Mode247Builder } from "../../services/Mode247Builder.js";
import { ZkslinkPlayerState } from "../../zklink/main.js";

export default class {
  async execute(client: Manager, oldState: VoiceState, newState: VoiceState) {
    if (!client.isDatabaseConnected)
      return client.logger.warn(
        "DatabaseService",
        "Cơ sở dữ liệu chưa kết nối nên sự kiện này tạm thời sẽ không chạy. Vui lòng thử lại sau!"
      );

    const player = client.zklink?.players.get(newState.guild.id);
    if (!player) return;

    const is247 = await client.db.autoreconnect.get(`${newState.guild.id}`);

    if (
      newState.channelId == null &&
      newState.member?.user.id === client.user?.id
    ) {
      player.data.set("sudo-destroy", true);
      player.state !== ZkslinkPlayerState.DESTROYED ? player.destroy() : true;
    }

    if (oldState.member?.user.bot || newState.member?.user.bot) return;

    let data = await new Mode247Builder(client).get(newState.guild.id);

    const setup = await client.db.setup.get(newState.guild.id);

    let guildModel = await client.db.language.get(`${newState.guild.id}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(
        `${newState.guild.id}`,
        client.config.bot.LANGUAGE
      );
    }
    const language = guildModel;

    if (data && data.twentyfourseven) return;

    const isInVoice = await newState.guild.members
      .fetch(client.user!.id)
      .catch(() => undefined);

    if (!isInVoice || !isInVoice.voice.channelId) {
      player.data.set("sudo-destroy", true);
      player.state !== ZkslinkPlayerState.DESTROYED ? player.destroy() : true;
    }

    if (
      newState.channelId &&
      String(newState.channel!.type) == "GUILD_STAGE_VOICE" &&
      newState.guild.members.me!.voice.suppress &&
      (newState.guild.members.me!.permissions.has(
        PermissionsBitField.Flags.Connect
      ) ||
        (newState.channel &&
          newState.channel
            .permissionsFor(newState.guild.members.me as GuildMember | Role)
            .has(PermissionsBitField.Flags.Speak)))
    )
      newState.guild.members.me!.voice.setSuppressed(false);

    if (oldState.id === client.user!.id) return;
    const isInOldVoice = await oldState.guild.members
      .fetch(client.user!.id)
      .catch(() => undefined);
    if (!isInOldVoice || !isInOldVoice.voice.channelId) return;

    const vcRoom = oldState.guild.members.me!.voice.channel!.id;

    const leaveEmbed = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel;

    if (
      newState.guild.members.me!.voice?.channel &&
      newState.guild.members.me!.voice.channel.members.filter(
        (m) => !m.user.bot
      ).size !== 0
    ) {
      if (oldState.channelId) return;
      if (oldState.channelId === newState.channelId) return;
      if (
        newState.guild.members.me!.voice.channel.members.filter(
          (m) => !m.user.bot
        ).size > 2
      )
        return;
      // Tiếp tục phát nhạc

      const leaveTimeout = client.leaveDelay.get(newState.guild.id);
      if (leaveTimeout) {
        clearTimeout(leaveTimeout);
        client.leaveDelay.delete(newState.guild.id);
      }

      const currentPause = player.paused;

      player.paused == false ? true : player.setPause(false);
      if (currentPause !== false && player.track !== null) {
        const msg = leaveEmbed
          ? await leaveEmbed.send({
              embeds: [
                new EmbedBuilder()
                  .setDescription(
                    `${client.i18n.get(
                      language,
                      "events.player",
                      "leave_resume"
                    )}`
                  )
                  .setColor(client.color_main),
              ],
            })
          : null;
        setTimeout(
          async () =>
            (!setup || setup == null || setup.channel !== player.textId) && msg
              ? msg.delete().catch(() => null)
              : true,
          client.config.features.DELETE_MSG_TIMEOUT
        );
      }
    }

    if (
      isInOldVoice &&
      isInOldVoice.voice.channelId === oldState.channelId &&
      oldState.guild.members.me!.voice?.channel &&
      oldState.guild.members.me!.voice.channel.members.filter(
        (m) => !m.user.bot
      ).size === 0
    ) {
      // Tạm dừng phát nhạc
      const currentPause = player.paused;
      player.paused == true ? true : player.setPause(true);

      if (currentPause !== true && player.track !== null) {
        const msg = await leaveEmbed.send({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(language, "events.player", "leave_pause")}`
              )
              .setColor(client.color_main),
          ],
        });
        setTimeout(async () => {
          const isChannelAvalible = await client.channels
            .fetch(msg.channelId)
            .catch(() => undefined);
          if (!isChannelAvalible) return;
          !setup || setup == null || setup.channel !== player.textId
            ? msg.delete().catch(() => null)
            : true;
        }, client.config.features.DELETE_MSG_TIMEOUT);
      }

      // Hẹn giờ rời phòng (delay leave timeout)
      let leaveDelayTimeout = setTimeout(async () => {
        const vcMembers =
          oldState.guild.members.me!.voice.channel?.members.filter(
            (m) => !m.user.bot
          ).size;
        if (!vcMembers || vcMembers === 1) {
          const newPlayer = client.zklink?.players.get(newState.guild.id);
          player.data.set("sudo-destroy", true);
          if (newPlayer)
            player.stop(is247 && is247.twentyfourseven ? false : true);
          const TimeoutEmbed = new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(language, "events.player", "player_end", {
                leave: vcRoom,
              })}`
            )
            .setColor(client.color_main);
          const leavebutton = new ActionRowBuilder<ButtonBuilder>();
          if (
            client.config.bot.VOTE_URL &&
            client.config.MENU_HELP_EMOJI.E_VOTE
          ) {
            leavebutton.addComponents(
              new ButtonBuilder()
                .setLabel(
                  client.i18n.get(
                    language,
                    "interaction",
                    "topgg_unvote_button"
                  )
                )
                .setEmoji(client.config.MENU_HELP_EMOJI.E_VOTE)
                .setStyle(ButtonStyle.Link)
                .setURL(client.config.bot.VOTE_URL)
            );
          }
          if (
            client.config.bot.PREMIUM_URL &&
            client.config.MENU_HELP_EMOJI.E_PREMIUM
          ) {
            leavebutton.addComponents(
              new ButtonBuilder()
                .setLabel(
                  client.i18n.get(language, "interaction", "premium_button")
                )
                .setEmoji(client.config.MENU_HELP_EMOJI.E_PREMIUM)
                .setStyle(ButtonStyle.Link)
                .setURL(client.config.bot.PREMIUM_URL)
            );
          }
          try {
            if (leaveEmbed) {
              const msg =
                newPlayer && leaveEmbed
                  ? await leaveEmbed.send({
                      flags: MessageFlags.SuppressNotifications,
                      embeds: [TimeoutEmbed],
                      components: leavebutton.components.length
                        ? [leavebutton]
                        : [],
                    })
                  : undefined;
              setTimeout(
                async () =>
                  msg &&
                  (!setup || setup == null || setup.channel !== player.textId)
                    ? msg.delete().catch(() => null)
                    : undefined,
                client.config.features.DELETE_MSG_TIMEOUT
              );
            }
          } catch (error) {
            client.logger.error("VoiceStateUpdateError", error);
          }
        }
        clearTimeout(leaveDelayTimeout);
        client.leaveDelay.delete(newState.guild.id);
      }, client.config.features.LEAVE_TIMEOUT);
      client.leaveDelay.set(newState.guild.id, leaveDelayTimeout);
    }
  }
}
