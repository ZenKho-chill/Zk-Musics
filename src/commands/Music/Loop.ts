import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Mode247Builder } from "../../services/Mode247Builder.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import {
  ZklinkLoopMode,
  ZklinkPlayer,
  ZklinkTrack,
} from "../../zklink/main.js";
import { FormatDuration } from "../../utilities/FormatDuration.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["loop"];
  public description = "Lặp bài trong hàng chờ (tất cả/hiện tại)!";
  public category = "Music";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.Loop;
  public usage = "<mode>";
  public aliases = [];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [
    {
      name: "type",
      description: "Loại vòng lặp",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "Bài",
          value: "song",
        },
        {
          name: "Hàng chờ",
          value: "queue",
        },
        {
          name: "Không",
          value: "none",
        },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const player = client.zklink.players.get(
      handler.guild!.id
    ) as ZklinkPlayer;
    const currentTrack = player.queue.current;

    if (!currentTrack) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.music",
                "no_songs_playing",
                {
                  user: handler.user!.displayName || handler.user!.tag,
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    const mode_array = ["song", "queue", "none"];

    const mode = handler.args[0];

    if (!mode_array.includes(mode))
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.music",
                "loop_invalid",
                {
                  mode: this.changeBold(mode_array).join(", "),
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });

    if (
      (mode == "song" && player.loop == ZklinkLoopMode.SONG) ||
      mode == player.loop
    )
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.music",
                "loop_already",
                {
                  mode: mode,
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });

    if (mode == "song") {
      player.setLoop(ZklinkLoopMode.SONG);
      if (client.config.features.AUTO_RESUME)
        this.setLoop247(client, player, ZklinkLoopMode.SONG);

      const looped = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(
            handler.language,
            "commands.music",
            "loop_current",
            {
              user: handler.user!.displayName || handler.user!.tag,
              title: this.getTitle(client, currentTrack),
            }
          )}`
        )
        .setColor(client.color_main);
      handler.editReply({ content: " ", embeds: [looped] });
    } else if (mode == "queue") {
      player.setLoop(ZklinkLoopMode.QUEUE);
      if (client.config.features.AUTO_RESUME)
        this.setLoop247(client, player, ZklinkLoopMode.QUEUE);

      const looped_queue = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "commands.music", "loop_all", {
            user: handler.user!.displayName || handler.user!.tag,
          })}`
        )
        .setColor(client.color_main);
      handler.editReply({ content: " ", embeds: [looped_queue] });
    } else if (mode === "none") {
      player.setLoop(ZklinkLoopMode.NONE);
      if (client.config.features.AUTO_RESUME)
        this.setLoop247(client, player, ZklinkLoopMode.NONE);

      const looped = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "commands.music", "unloop_all")}`
        )
        .setColor(client.color_main);
      handler.editReply({ content: " ", embeds: [looped] });
    }

    client.wsl.get(handler.guild!.id)?.send({
      op: "playerLoop",
      guild: handler.guild!.id,
      mode: mode,
    });
  }

  async setLoop247(client: Manager, player: ZklinkPlayer, loop: string) {
    const data = await new Mode247Builder(client, player).execute(
      player.guildId
    );
    if (data) {
      await client.db.autoreconnect.set(`${player.guildId}.config.loop`, loop);
    }
  }

  changeBold(arrayMode: string[]) {
    const res = [];
    for (const data of arrayMode) {
      res.push(`**${data}**`);
    }
    return res;
  }

  getTitle(client: Manager, tracks: ZklinkTrack): string {
    const truncate = (str: string, maxLength: number): string =>
      str.length > maxLength ? str.substring(0, maxLength - 3) + "..." : str;
    const title = truncate(tracks.title, 25);
    const author = truncate(tracks.author, 15);
    const supportUrl = client.config.bot.SERVER_SUPPORT_URL;

    if (new FormatDuration().parse(tracks.duration) === "Live Stream") {
      return `${author}`;
    }

    if (client.config.features.HIDE_LINK) {
      return `\`${title}\` bởi \`${author}\``;
    } else if (client.config.features.REPLACE_LINK) {
      return `[\`${title}\`](${supportUrl}) bởi \`${author}\``;
    } else {
      return `[\`${title}\`](${tracks.uri || supportUrl}) bởi \`${author}\``;
    }
  }
}
