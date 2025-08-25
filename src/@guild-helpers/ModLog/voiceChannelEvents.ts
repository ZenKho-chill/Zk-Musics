import { VoiceState, EmbedBuilder } from "discord.js";
import { isEventEnabled, getModLogChannel } from "../ModLogEventUtils.js";
import { Manager } from "../../manager.js";

export class VoiceChannelEventsHandler {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.init();
  }

  private init() {
    this.client.on("voiceStateUpdate", this.handleVoiceStateUpdate.bind(this));
  }

  // Tham gia / Rời / Chuyển kênh thoại
  private async handleVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState
  ) {
    const guild = oldState.guild || newState.guild;
    if (!guild) return;

    const event =
      oldState.channelId && !newState.channelId
        ? "voiceChannelLeave"
        : newState.channelId && !oldState.channelId
        ? "voiceChannelJoin"
        : oldState.channelId !== newState.channelId
        ? "voiceChannelSwitch"
        : null;

    if (event && (await isEventEnabled(guild.id, event, this.client.db))) {
      const channel = await getModLogChannel(guild.id, this.client);
      if (channel) {
        const member = newState.member || oldState.member;
        const targetChannel = newState.channel || oldState.channel;

        // Định nghĩa màu cho từng sự kiện
        const colors = {
          voiceChannelJoin: 0x00ff00, // Xanh lá
          voiceChannelLeave: 0xff0000, // Đỏ
          voiceChannelSwitch: 0x1e90ff, // Xanh dương
        };

        const embed = new EmbedBuilder()
          .setColor(colors[event as keyof typeof colors])
          .setAuthor({
            name: `${member?.user.username}`,
            iconURL: `${member?.user.displayAvatarURL()}`,
          })
          .setFooter({
            text: `${this.client.user?.username}`,
            iconURL: `${this.client.user?.displayAvatarURL()}`,
          })
          .setTimestamp();

        if (event === "voiceChannelSwitch") {
          const oldChannel = oldState.channel;
          embed
            .setDescription(
              `**<@${member?.user.id}>** đã bị di chuyển.\n\n > ${
                oldChannel ? `**<#${oldChannel.id}>**` : "Không rõ"
              } → ${targetChannel ? `**<#${targetChannel.id}>**` : "Không rõ"}`
            )
            .addFields({
              name: "Các ID",
              value: `
              > <@${member?.id}> (${member?.id})
              > ${
                oldChannel
                  ? `**<#${oldChannel.id}>** (${oldChannel.id})`
                  : "Không rõ"
              }
              > ${
                targetChannel
                  ? `**<#${targetChannel.id}>** (${targetChannel.id})`
                  : "Không rõ"
              }`,
            });
        } else {
          embed
            .setDescription(
              `${
                event === "voiceChannelJoin"
                  ? "📥 **Đã tham gia kênh thoại**"
                  : "📤 **Đã rời kênh thoại**"
              } ${targetChannel ? `**<#${targetChannel.id}>**` : "Không rõ"}`
            )
            .addFields({
              name: "Các ID",
              value: `
              > <@${member?.id}> (${member?.id})
              > ${
                targetChannel
                  ? `**<#${targetChannel.id}>** (${targetChannel.id})`
                  : "Không rõ"
              }`,
            });
        }

        await channel.send({ embeds: [embed] });
      }
    }

    // Tắt/Bật mic (tự thao tác)
    if (oldState.selfMute !== newState.selfMute) {
      const muteEvent = newState.selfMute ? "voiceSelfMute" : "voiceSelfUnmute";
      if (await isEventEnabled(guild.id, muteEvent, this.client.db)) {
        const channel = await getModLogChannel(guild.id, this.client);
        if (channel) {
          await channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0xffa500)
                .setTitle(
                  `🔇 ${newState.selfMute ? "Tự tắt mic" : "Tự bật mic"}`
                )
                .setDescription(`**Người dùng:** <@${newState.member?.id}>`)
                .setTimestamp(new Date()),
            ],
          });
        }
      }
    }

    // Bị server tắt/bật mic
    if (oldState.serverMute !== newState.serverMute) {
      const muteEvent = newState.serverMute
        ? "voiceServerMute"
        : "voiceServerUnmute";
      if (await isEventEnabled(guild.id, muteEvent, this.client.db)) {
        const channel = await getModLogChannel(guild.id, this.client);
        if (channel) {
          await channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff4500)
                .setTitle(
                  `🔇 ${
                    newState.serverMute ? "Bị server tắt mic" : "Server bật mic"
                  }`
                )
                .setDescription(`**Người dùng:** <@${newState.member?.id}>`)
                .setTimestamp(new Date()),
            ],
          });
        }
      }
    }

    // Tắt/Bật nghe (tự thao tác)
    if (oldState.selfDeaf !== newState.selfDeaf) {
      const deafEvent = newState.selfDeaf ? "voiceSelfDeaf" : "voiceSelfUndeaf";
      if (await isEventEnabled(guild.id, deafEvent, this.client.db)) {
        const channel = await getModLogChannel(guild.id, this.client);
        if (channel) {
          await channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff69b4)
                .setTitle(
                  `🔇 ${newState.selfDeaf ? "Tự tắt nghe" : "Tự bật nghe"}`
                )
                .setDescription(`**Người dùng:** <@${newState.member?.id}>`)
                .setTimestamp(new Date()),
            ],
          });
        }
      }
    }

    // Bị server tắt/bật nghe
    if (oldState.serverDeaf !== newState.serverDeaf) {
      const deafEvent = newState.serverDeaf
        ? "voiceServerDeaf"
        : "voiceServerUndeaf";
      if (await isEventEnabled(guild.id, deafEvent, this.client.db)) {
        const channel = await getModLogChannel(guild.id, this.client);
        if (channel) {
          await channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff69b4)
                .setTitle(
                  `🔇 ${
                    newState.serverDeaf
                      ? "Bị server tắt nghe"
                      : "Server bật nghe"
                  }`
                )
                .setDescription(`**Người dùng:** <@${newState.member?.id}>`)
                .setTimestamp(new Date()),
            ],
          });
        }
      }
    }

    // Bắt đầu/Ngừng phát trực tiếp
    if (oldState.streaming !== newState.streaming) {
      const streamEvent = newState.streaming
        ? "voiceStartStreaming"
        : "voiceStopStreaming";
      if (await isEventEnabled(guild.id, streamEvent, this.client.db)) {
        const channel = await getModLogChannel(guild.id, this.client);
        if (channel) {
          await channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x9400d3)
                .setTitle(
                  `🎥 ${
                    newState.streaming
                      ? "Bắt đầu phát trực tiếp"
                      : "Ngừng phát trực tiếp"
                  }`
                )
                .setDescription(`**Người dùng:** <@${newState.member?.id}>`)
                .setTimestamp(new Date()),
            ],
          });
        }
      }
    }
  }
}
