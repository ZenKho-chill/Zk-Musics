import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Mode247Builder } from "../../services/Mode247Builder.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["247"];
  public description = "Bật/Tắt chế độ 24/7 trong kênh thoại";
  public category = "Settings";
  public accessableby = data.COMMANDS_ACCESS.SETTINGS.TwentyFourSeven;
  public usage = "<enable> hoặc <disable>";
  public aliases = [];
  public lavalink = true;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [
    {
      name: "type",
      description: "Chọn bật hoặc tắt",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "Bật",
          value: "enable",
        },
        {
          name: "Tắt",
          value: "disable",
        },
      ],
    },
  ];
  public playerCheck = false;

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.SilentDeferReply();

    let player = client.zklink.players.get(handler.guild!.id);

    const value = handler.args[0];

    const reconnectBuilder = new Mode247Builder(client, player);

    const data = await reconnectBuilder.execute(handler.guild?.id!);

    if (value === "disable") {
      if (!data.twentyfourseven) {
        const offAl = new EmbedBuilder()
          .setDescription(
            `${client.i18n.get(
              handler.language,
              "commands.settings",
              "247_already",
              {
                mode: handler.modeLang.disable,
              }
            )}`
          )
          .setColor(client.color_main);
        return handler.editReply({ content: " ", embeds: [offAl] });
      }

      await client.db.autoreconnect.delete(`${handler.guild!.id}`);
      player ? player.data.set("sudo-destroy", true) : true;
      if (player && player.voiceId && !handler.member!.voice.channel) {
        player.destroy();
      }

      const on = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "commands.settings", "247_off")}`
        )
        .setColor(client.color_main);
      handler.editReply({ content: " ", embeds: [on] });
    } else if (value === "enable") {
      const { channel } = handler.member!.voice;
      if (!channel) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(
                  handler.language,
                  "commands.settings",
                  "247_no_in_voice"
                )}`
              )
              .setColor(client.color_main),
          ],
        });
      }

      if (data.twentyfourseven) {
        const onAl = new EmbedBuilder()
          .setDescription(
            `${client.i18n.get(
              handler.language,
              "commands.settings",
              "247_already",
              {
                mode: handler.modeLang.enable,
              }
            )}`
          )
          .setColor(client.color_main);
        return handler.editReply({ content: " ", embeds: [onAl] });
      }

      if (!player) {
        player = await client.zklink.create({
          guildId: handler.guild!.id,
          voiceId: handler.member!.voice.channel!.id,
          textId: String(handler.channel?.id),
          shardId: handler.guild?.shardId ?? 0,
          deaf: true,
          mute: false,
          region: handler.member!.voice.channel!.rtcRegion ?? null,
          volume: client.config.bot.DEFAULT_VOLUME ?? 80,
        });
      }

      await client.db.autoreconnect.set(
        `${handler.guild!.id}.twentyfourseven`,
        true
      );
      new Mode247Builder(client, player).playerBuild(player?.guildId, true);

      const on = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "commands.settings", "247_on")}`
        )
        .setColor(client.color_main);
      handler.editReply({ content: " ", embeds: [on] });
    } else {
      const onsome = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(
            handler.language,
            "commands.settings",
            "247_arg_error",
            {
              text: "**enable** hoặc **disable**",
            }
          )}`
        )
        .setColor(client.color_main);
      handler.editReply({ content: " ", embeds: [onsome] });
    }
  }
}
