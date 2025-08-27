import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  CommandInteraction,
  AutocompleteInteraction,
} from "discord.js";
import { ConvertTime } from "../../utilities/ConvertTime.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import {
  AutocompleteInteractionChoices,
  GlobalInteraction,
} from "../../@types/Interaction.js";
import { ZklinkSearchResultType, ZklinkTrack } from "../../zklink/main.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

const TrackAdd: ZklinkTrack[] = [];

export default class implements Command {
  public name = ["pl", "add"];
  public description = "Thêm bài hát vào danh sách phát";
  public category = "Danh sách phát";
  public accessableby = data.COMMANDS_ACCESS.PLAYLIST.Add;
  public usage = "<id_playlist> <url_hoặc_tên>";
  public aliases = [];
  public lavalink = true;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [
    {
      name: "id",
      description: "ID của danh sách phát",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "search",
      description: "Link hoặc tên bài hát",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const value = handler.args[0] ? handler.args[0] : null;

    if (value == null || !value)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.playlist",
                "pl_add_invalid"
              )}`
            )
            .setColor(client.color_main),
        ],
      });

    const input = handler.args[1];

    const Inputed = input;

    if (!input)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.playlist",
                "pl_add_match"
              )}`
            )
            .setColor(client.color_main),
        ],
      });

    const isYouTubeLink = (input: string): boolean => {
      const youtubeRegex =
        /(?:https?:\/\/)?(?:www\.)?(?:youtube|youtu)\.(?:com|be)\/(?:[^ ]+)/i;
      return youtubeRegex.test(input);
    };

    if (isYouTubeLink(input) && !client.config.features.YOUTUBE_LINK) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.music",
                "youtube_disabled",
                {
                  user: handler.user!.displayName || handler.user!.tag,
                  botname: client.user!.username || client.user!.displayName,
                  serversupport: String(client.config.bot.SERVER_SUPPORT_URL),
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    const engines = client.config.features.PLAY_COMMAND_ENGINE;
    const randomEngine = engines[Math.floor(Math.random() * engines.length)];

    const result = await client.zklink.search(input, {
      engine: randomEngine,
      requester: handler.user,
    });

    const tracks = result.tracks;

    if (!result.tracks.length)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.playlist",
                "pl_add_match"
              )}`
            )
            .setColor(client.color_main),
        ],
      });
    if (result.type === "PLAYLIST")
      for (let track of tracks) TrackAdd.push(track);
    else TrackAdd.push(tracks[0]);

    const Duration = new ConvertTime().parse(tracks[0].duration as number);
    const TotalDuration = tracks.reduce(
      (acc, cur) => acc + (cur.duration || 0),
      tracks[0].duration ?? 0
    );

    if (result.type === "PLAYLIST") {
      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(
            handler.language,
            "commands.playlist",
            "pl_add_playlist",
            {
              title: this.getTitle(client, result.type, tracks, Inputed),
              duration: new ConvertTime().parse(TotalDuration),
              track: String(tracks.length),
              user: String(handler.user),
              author: String(tracks[0].author),
              serversupport: String(client.config.bot.SERVER_SUPPORT_URL),
            }
          )}`
        )
        .setColor(client.color_main);
      handler.editReply({ content: " ", embeds: [embed] });
    } else if (result.type === "TRACK") {
      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(
            handler.language,
            "commands.playlist",
            "pl_add_track",
            {
              title: this.getTitle(client, result.type, tracks),
              duration: Duration,
              user: String(handler.user),
              author: String(tracks[0].author),
              serversupport: String(client.config.bot.SERVER_SUPPORT_URL),
            }
          )}`
        )
        .setColor(client.color_main);
      handler.editReply({ content: " ", embeds: [embed] });
    } else if (result.type === "SEARCH") {
      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(
            handler.language,
            "commands.playlist",
            "pl_add_search",
            {
              title: this.getTitle(client, result.type, tracks),
              duration: Duration,
              user: String(handler.user),
              author: String(tracks[0].author),
              serversupport: String(client.config.bot.SERVER_SUPPORT_URL),
            }
          )}`
        )
        .setColor(client.color_main);
      handler.editReply({ content: " ", embeds: [embed] });
    } else {
      // Liên kết danh sách phát không hợp lệ.
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.playlist",
                "pl_add_match"
              )}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    const playlist = await client.db.playlist.get(value);

    if (!playlist)
      return handler.followUp({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.playlist",
                "pl_add_invalid"
              )}`
            )
            .setColor(client.color_main),
        ],
      });

    if (playlist.owner !== handler.user?.id) {
      handler.followUp({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.playlist",
                "pl_add_owner"
              )}`
            )
            .setColor(client.color_main),
        ],
      });
      TrackAdd.length = 0;
      return;
    }
    const LimitTrack = playlist.tracks!.length + TrackAdd.length;

    if (LimitTrack > client.config.features.LIMIT_TRACK) {
      handler.followUp({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.playlist",
                "pl_add_limit_track",
                {
                  limit: String(client.config.features.LIMIT_TRACK),
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });
      TrackAdd.length = 0;
      return;
    }

    TrackAdd.forEach(async (track) => {
      await client.db.playlist.push(`${value}.tracks`, {
        title: track.title,
        uri: track.uri,
        length: track.duration,
        thumbnail: track.artworkUrl,
        author: track.author,
        requester: track.requester, // Trường hợp để đẩy (push)
      });
    });

    const embed = new EmbedBuilder()
      .setDescription(
        `${client.i18n.get(
          handler.language,
          "commands.playlist",
          "pl_add_added",
          {
            count: String(TrackAdd.length),
            playlist: value,
          }
        )}`
      )
      .setColor(client.color_main);

    handler.followUp({ content: " ", embeds: [embed] });
    TrackAdd.length = 0;
  }

  getTitle(
    client: Manager,
    type: ZklinkSearchResultType,
    tracks: ZklinkTrack[],
    value?: string
  ): string {
    const truncate = (str: string, maxLength: number): string =>
      str.length > maxLength ? str.substring(0, maxLength - 3) + "..." : str;
    const title = truncate(tracks[0].title, 25);
    const author = truncate(tracks[0].author, 15);
    const supportUrl = client.config.bot.SERVER_SUPPORT_URL;

    if (client.config.features.HIDE_LINK) {
      if (type === "PLAYLIST") {
        return "`DANH SÁCH PHÁT`";
      }
      return `\`${title}\` bởi \`${author}\``;
    } else if (client.config.features.REPLACE_LINK) {
      if (type === "PLAYLIST") {
        return `[DANH SÁCH PHÁT](${supportUrl})`;
      } else {
        return `[\`${title}\`](${supportUrl}) bởi \`${author}\``;
      }
    } else {
      if (type === "PLAYLIST") {
        return `[DANH SÁCH PHÁT](${value})`;
      } else {
        return `[\`${title}\`](${tracks[0].uri}) bởi \`${author}\``;
      }
    }
  }

  // Hàm autocomplete
  public async autocomplete(
    client: Manager,
    interaction: GlobalInteraction,
    language: string
  ) {
    let choice: AutocompleteInteractionChoices[] = [];
    const url = String(
      (interaction as CommandInteraction).options.get("search")!.value
    );

    const Random =
      client.config.features.AUTOCOMPLETE_SEARCH[
        Math.floor(
          Math.random() * client.config.features.AUTOCOMPLETE_SEARCH.length
        )
      ];

    const match = client.REGEX.some((match) => {
      return match.test(url) == true;
    });

    if (match == true) {
      choice.push({ name: url, value: url });
      await (interaction as AutocompleteInteraction)
        .respond(choice)
        .catch(() => {});
      return;
    }

    if (client.lavalinkUsing.length == 0) {
      choice.push({
        name: `${client.i18n.get(
          language,
          "commands.playlist",
          "pl_error_no_node"
        )}`,
        value: `${client.i18n.get(
          language,
          "commands.playlist",
          "pl_error_no_node"
        )}`,
      });
      return;
    }
    const engines = client.config.features.PLAY_COMMAND_ENGINE;
    const randomEngine = engines[Math.floor(Math.random() * engines.length)];
    const searchRes = await client.zklink.search(url || Random, {
      engine: randomEngine,
    });

    if (searchRes.tracks.length == 0 || !searchRes.tracks) {
      return choice.push({
        name: "Lỗi: không tìm thấy bài hát phù hợp",
        value: url,
      });
    }

    for (let i = 0; i < 10; i++) {
      const x = searchRes.tracks[i];
      choice.push({
        name: x && x.title ? x.title : "Tên bài hát không xác định",
        value: x && x.uri ? x.uri : url,
      });
    }

    await (interaction as AutocompleteInteraction)
      .respond(choice)
      .catch(() => {});
  }
}
