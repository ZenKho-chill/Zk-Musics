import { EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

// Mã chính
export default class implements Command {
  public name = ["join"];
  public description = "Khiến bot tham gia kênh thoại.";
  public category = "Music";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.Join;
  public usage = "";
  public aliases = ["j"];
  public lavalink = true;
  public options = [];
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const { channel } = handler.member!.voice;
    if (!channel)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.music", "join_no_in_voice")}`
            )
            .setColor(client.color_main),
        ],
      });

    let player = client.Zklink.players.get(handler.guild!.id);

    if (!player)
      player = await client.Zklink.create({
        guildId: handler.guild!.id,
        voiceId: handler.member!.voice.channel!.id,
        textId: handler.channel!.id,
        shardId: handler.guild?.shardId ?? 0,
        deaf: true,
        mute: false,
        region: handler.member!.voice.channel!.rtcRegion ?? undefined,
        volume: client.config.bot.DEFAULT_VOLUME ?? 100,
      });
    else if (player && !this.checkSameVoice(client, handler, handler.language)) {
      return;
    }

    player.textId = handler.channel!.id;

    const embed = new EmbedBuilder()
      .setDescription(
        `${client.i18n.get(handler.language, "commands.music", "join_msg", {
          channel: String(channel),
        })}`
      )
      .setColor(client.color_main);

    handler.editReply({ content: " ", embeds: [embed] });
  }

  checkSameVoice(client: Manager, handler: CommandHandler, language: string) {
    if (handler.member!.voice.channel !== handler.guild!.members.me!.voice.channel) {
      handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.music", "join_no_same_voice")}`
            )
            .setColor(client.color_main),
        ],
      });
      return false;
    } else if (handler.member!.voice.channel === handler.guild!.members.me!.voice.channel) {
      handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.music", "join_already", {
                channel: String(handler.member!.voice.channel),
              })}`
            )
            .setColor(client.color_main),
        ],
      });
      return false;
    }

    return true;
  }
}
