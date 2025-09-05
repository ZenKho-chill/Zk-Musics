import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { FormatDuration } from "../../utilities/FormatDuration.js";
import { PageQueue } from "../../structures/PageQueue.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ZklinkPlayer, ZklinkTrack } from "../../Zklink/main.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

// Mã chính
export default class implements Command {
  public name = ["queue"];
  public description = "Hiển thị danh sách bài hát trong hàng đợi";
  public category = "Âm nhạc";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.Queue;
  public usage = "<số_trang>";
  public aliases = ["q"];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [
    {
      name: "page",
      description: "Số trang để hiển thị.",
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const value = handler.args[0];

    if (value && isNaN(+value))
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.music", "queue_number_invalid")}`
            )
            .setColor(client.color_main),
        ],
      });

    const player = client.Zklink.players.get(handler.guild!.id) as ZklinkPlayer;

    const source = player.queue.current?.source || "unknown";
    let src = client.config.PLAYER_SOURCENAME.UNKNOWN; // Mặc định là UNKNOWN nếu nguồn không xác định
    if (source === "youtube") {
      src = client.config.PLAYER_SOURCENAME.YOUTUBE;
    } else if (source === "spotify") {
      src = client.config.PLAYER_SOURCENAME.SPOTIFY;
    } else if (source === "tidal") {
      src = client.config.PLAYER_SOURCENAME.TIDAL;
    } else if (source === "soundcloud") {
      src = client.config.PLAYER_SOURCENAME.SOUNDCLOUD;
    } else if (source === "deezer") {
      src = client.config.PLAYER_SOURCENAME.DEEZER;
    } else if (source === "twitch") {
      src = client.config.PLAYER_SOURCENAME.TWITCH;
    } else if (source === "apple") {
      src = client.config.PLAYER_SOURCENAME.APPLE_MUSIC;
    } else if (source === "applemusic") {
      src = client.config.PLAYER_SOURCENAME.APPLE_MUSIC;
    } else if (source === "youtube_music") {
      src = client.config.PLAYER_SOURCENAME.YOUTUBE_MUSIC;
    } else if (source === "http") {
      src = client.config.PLAYER_SOURCENAME.HTTP;
    }

    const song = player.queue.current;
    const qduration = `${new FormatDuration().parse(song!.duration + player.queue.duration)}`;

    let pagesNum = Math.ceil(player.queue.length / 10);
    if (pagesNum === 0) pagesNum = 1;

    const songStrings: string[] = [];
    for (let i = 0; i < player.queue.length; i++) {
      const song = player.queue[i];
      songStrings.push(
        `**${i + 1}.** ${this.getTitle(
          client,
          song
        )} \`[${new FormatDuration().parse(song.duration)}]\``
      );
    }

    const pages: EmbedBuilder[] = [];
    for (let i = 0; i < pagesNum; i++) {
      const str = songStrings.slice(i * 10, i * 10 + 10).join("\n");

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${client.i18n.get(handler.language, "commands.music", "queue_title")}`,
        })
        .setThumbnail(
          // Dùng avatar bot nếu nguồn là soundcloud, nếu không dùng artworkUrl hoặc thumbnail mặc định
          source === "soundcloud"
            ? (client.user?.displayAvatarURL() as string)
            : (song?.artworkUrl ?? `https://img.youtube.com/vi/${song?.identifier}/hqdefault.jpg`)
        )
        .setColor(client.color_second)
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
            queue_lang: String(player.queue.length),
            duration: qduration,
          })}`,
        });
      pages.push(embed);
    }

    if (!value) {
      if (pages.length == pagesNum && player.queue.length > 10) {
        if (handler.message) {
          await new PageQueue(
            client,
            pages,
            60000,
            player.queue.length,
            handler.language
          ).prefixPage(handler.message, qduration);
        } else if (handler.interaction) {
          await new PageQueue(
            client,
            pages,
            60000,
            player.queue.length,
            handler.language
          ).slashPage(handler.interaction, qduration);
        } else return;
      } else return await handler.editReply({ embeds: [pages[0]] });
    } else {
      if (isNaN(+value))
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(handler.language, "commands.music", "queue_notnumber")}`
              )
              .setColor(client.color_main),
          ],
        });
      if (Number(value) > pagesNum)
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(handler.language, "commands.music", "queue_page_notfound", {
                  page: String(pagesNum),
                })}`
              )
              .setColor(client.color_main),
          ],
        });
      const pageNum = Number(value) == 0 ? 1 : Number(value) - 1;
      return handler.editReply({ embeds: [pages[pageNum]] });
    }
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
