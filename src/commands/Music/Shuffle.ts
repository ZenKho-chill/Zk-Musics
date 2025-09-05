import { EmbedBuilder, User } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { FormatDuration } from "../../utilities/FormatDuration.js";
import { PageQueue } from "../../structures/PageQueue.js";
import { ZklinkPlayer, ZklinkTrack } from "../../Zklink/main.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

// Mã chính
export default class implements Command {
  public name = ["shuffle"];
  public description = "Trộn ngẫu nhiên bài trong hàng đợi";
  public category = "Âm nhạc";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.Shuffle;
  public usage = "";
  public aliases = [];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const player = client.Zklink.players.get(handler.guild!.id) as ZklinkPlayer;
    const currentTrack = player.queue.current;

    if (!currentTrack) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.music", "no_songs_playing", {
                user: handler.user!.displayName || handler.user!.tag,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    const newQueue = await player.queue.shuffle();

    const song = newQueue.current;

    const qduration = `${new FormatDuration().parse(song!.duration + player.queue.duration)}`;
    const thumbnail =
      song!.artworkUrl ?? `https://img.youtube.com/vi/${song!.identifier}/hqdefault.jpg`;

    let pagesNum = Math.ceil(newQueue.length / 10);
    if (pagesNum === 0) pagesNum = 1;

    const songStrings: string[] = [];
    for (let i = 0; i < newQueue.length; i++) {
      const song = newQueue[i];
      songStrings.push(
        `**${i + 1}.** ${this.getTitle(
          client,
          song
        )} \`[${new FormatDuration().parse(song.duration)}]\`
                    `
      );
    }

    const pages: EmbedBuilder[] = [];
    for (let i = 0; i < pagesNum; i++) {
      const str = songStrings.slice(i * 10, i * 10 + 10).join("");

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${client.i18n.get(handler.language, "commands.music", "shuffle_title")}`,
        })
        .setThumbnail(thumbnail)
        .setColor(client.color_main)
        .setDescription(
          `${client.i18n.get(handler.language, "commands.music", "queue_description", {
            title: this.getTitle(client, song!),
            request: String(song!.requester),
            duration: new FormatDuration().parse(song!.duration),
            rest: str == "" ? "  `KHÔNG KHẢ DỤNG`" : "\n" + str,
          })}`
        )
        .setFooter({
          text: `${client.i18n.get(handler.language, "commands.music", "queue_footer", {
            page: String(i + 1),
            pages: String(pagesNum),
            queue_lang: String(newQueue.length),
            duration: qduration,
          })}`,
        });

      pages.push(embed);
    }

    client.wsl.get(handler.guild!.id)?.send({
      op: "playerQueueShuffle",
      guild: handler.guild!.id,
      queue: player.queue.map((track) => {
        const requesterQueue = track.requester as User;
        return {
          title: track.title,
          uri: track.uri,
          length: track.duration,
          thumbnail: track.artworkUrl,
          author: track.author,
          requester: requesterQueue
            ? {
                id: requesterQueue.id,
                username: requesterQueue.username,
                globalName: requesterQueue.globalName,
                defaultAvatarURL: requesterQueue.defaultAvatarURL ?? null,
              }
            : null,
        };
      }),
    });

    if (pages.length == pagesNum && newQueue.length > 10) {
      if (handler.message) {
        await new PageQueue(client, pages, 60000, newQueue.length, handler.language).prefixPage(
          handler.message,
          qduration
        );
      } else if (handler.interaction) {
        await new PageQueue(client, pages, 60000, newQueue.length, handler.language).slashPage(
          handler.interaction,
          qduration
        );
      } else return;
    } else return handler.editReply({ embeds: [pages[0]] });
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
