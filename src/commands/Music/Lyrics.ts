import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import Genius from "genius-lyrics";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

// Mã chính
export default class implements Command {
  public name = ["lyrics"];
  public description = "Hiển thị lời bài hát.";
  public category = "Music";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.Lyrics;
  public usage = "";
  public aliases = [];
  public lavalink = true;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "search",
      description: "Tên bài hát",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const geniusClient = new Genius.Client(client.config.utilities.LyricsGenius.ApiKey);

    let query = handler.args.join(" ");

    if (!client.config.utilities.LyricsGenius.Enable) {
      await handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.music", "lyrics_disable", {
                user: String(handler.user?.displayName || handler.user?.tag),
                botname: client.user!.username || client.user!.displayName,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
      return;
    }

    if (!query) {
      const player = client.Zklink.players.get(String(handler.guild?.id));
      if (player && player.queue.current) {
        query = player.queue.current.title;
      } else {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(handler.language, "commands.music", "lyrics_noquery", {
                  user: handler.user?.username ?? "Unknown User",
                  botname: client.user!.username,
                })}`
              )
              .setColor(client.color_main),
          ],
        });
      }
    }

    try {
      const searches = await geniusClient.songs.search(query);
      if (searches.length === 0) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(handler.language, "commands.music", "lyrics_notfound", {
                  user: handler.user?.username ?? "Unknown User",
                  botname: client.user!.username,
                })}`
              )
              .setColor(client.color_main),
          ],
        });
      }

      const song = searches[0];
      const lyrics = await song.lyrics();

      if (!lyrics || lyrics.length === 0) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(handler.language, "commands.music", "lyrics_notfound", {
                  user: handler.user?.username ?? "Unknown User",
                  botname: client.user!.username,
                })}`
              )
              .setColor(client.color_main),
          ],
        });
      }

      const embed = new EmbedBuilder().setColor(client.color_second).setTitle(
        `${client.i18n.get(handler.language, "commands.music", "lyrics_title", {
          song: song.title,
        })}`
      );

      if (lyrics.length > 4096) {
        embed.setDescription(
          `${client.i18n.get(handler.language, "commands.music", "lyrics_toolong", {
            url: song.url,
          })}`
        );
      } else {
        embed.setDescription(lyrics);
      }

      return handler.editReply({ embeds: [embed] });
    } catch (error) {
      client.logger.error("Lỗi LyricsCommand:", error);
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.music", "lyrics_error", {
                user: handler.user?.username ?? "Unknown User",
                botname: client.user!.username,
                error: error.message,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    }
  }
}
