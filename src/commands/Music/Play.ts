import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { ConvertTime } from "../../utilities/ConvertTime.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { AutocompleteInteractionChoices, GlobalInteraction } from "../../@types/Interaction.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ZklinkSearchResultType, ZklinkTrack } from "../../Zklink/main.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["play"];
  public description = "Phát bài hát từ bất kỳ nguồn nào";
  public category = "Music";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.Play;
  public usage = "<tên_hoặc_url>";
  public aliases = ["p", "pl", "pp"];
  public lavalink = true;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "search",
      description: "Liên kết hoặc tên bài hát",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    /////////////////////////////// Kiểm tra vai trò Premium bắt đầu ////////////////////////////////
    const PremiumGuildID = client.config.PremiumRole.GuildID;
    const PremiumRoleID = client.config.PremiumRole.RoleID;
    const supportGuild = await client.guilds.fetch(PremiumGuildID).catch(() => null);
    const supportMember = supportGuild
      ? await supportGuild.members.fetch(String(handler.user?.id)).catch(() => null)
      : null;
    const isPremiumRole = supportMember ? supportMember.roles.cache.has(PremiumRoleID) : false;
    /////////////////////////////// Kiểm tra vai trò Premium kết thúc ////////////////////////////////
    const User = await client.db.premium.get(handler.user?.id ?? "");
    const Guild = await client.db.preGuild.get(String(handler.guild?.id));
    const isPremiumUser = User && User.isPremium;
    const isPremiumGuild = Guild && Guild.isPremium;
    const isOwner = handler.user?.id == client.owner;
    const isAdmin = client.config.bot.ADMIN.includes(handler.user?.id ?? "");
    const userPerm = {
      owner: isOwner,
      admin: isOwner || isAdmin,
      PremiumRole: isOwner || isAdmin || isPremiumRole,
      UserPremium: isOwner || isAdmin || isPremiumUser,
      GuildPremium: isOwner || isAdmin || isPremiumGuild,
      Premium: isOwner || isAdmin || isPremiumUser || isPremiumGuild || isPremiumRole,
    };

    let player = client.Zklink.players.get(handler.guild!.id);

    const value = handler.args.join(" ");

    if (!value)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands", "music.play_arg", {
                user: handler.user!.displayName || handler.user!.tag,
                botname: client.user!.username || client.user!.displayName,
              })}`
            )
            .setColor(client.color_main),
        ],
      });

    const { channel } = handler.member!.voice;
    if (!channel)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands", "music.play_no_in_voice", {
                user: handler.user!.displayName || handler.user!.tag,
                botname: client.user!.username || client.user!.displayName,
              })}`
            )
            .setColor(client.color_main),
        ],
      });

    const emotes = (str: string) => str.match(/<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu);

    if (emotes(value) !== null)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands", "music.play_emoji", {
                user: handler.user!.displayName || handler.user!.tag,
                botname: client.user!.username || client.user!.displayName,
              })}`
            )
            .setColor(client.color_main),
        ],
      });

    const isYouTubeLink = (value: string): boolean => {
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube|youtu)\.(?:com|be)\/(?:[^ ]+)/i;
      return youtubeRegex.test(value);
    };
    if (isYouTubeLink(value) && !client.config.features.YOUTUBE_LINK) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands", "music.youtube_disabled", {
                user: handler.user!.displayName || handler.user!.tag,
                botname: client.user!.username || client.user!.displayName,
                serversupport: String(client.config.bot.SERVER_SUPPORT_URL),
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    if (!player)
      player = await client.Zklink.create({
        guildId: handler.guild!.id,
        voiceId: handler.member!.voice.channel!.id,
        textId: handler.channel!.id,
        shardId: handler.guild?.shardId ?? 0,
        nodeName: (await client.Zklink.nodes.getLeastUsed()).options.name,
        deaf: true,
        mute: false,
        region: handler.member!.voice.channel!.rtcRegion ?? undefined,
        volume: client.config.bot.DEFAULT_VOLUME ?? 100,
      });
    else if (player && !this.checkSameVoice(client, handler, handler.language)) {
      return;
    }

    player.textId = handler.channel!.id;

    const engines = client.config.features.PLAY_COMMAND_ENGINE;
    const randomEngine = engines[Math.floor(Math.random() * engines.length)];

    const result = await player.search(value, {
      engine: randomEngine,
      requester: handler.user,
    });
    const tracks = result.tracks;

    if (handler.message) await handler.message.delete().catch(() => null);

    if (!result.tracks.length)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands", "music.play_match", {
                user: handler.user!.displayName || handler.user!.tag,
                botname: client.user!.username || client.user!.displayName,
              })}`
            )
            .setColor(client.color_main),
        ],
      });

    // Kiểm tra độ dài hàng đợi và quyền của người dùng
    if (player.queue.length >= client.config.features.MAX_QUEUE && !userPerm.Premium)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands", "music.play_queue_max", {
                limitqueue: String(client.config.features.MAX_QUEUE),
                premium: client.config.bot.PREMIUM_URL,
                user: handler.user!.displayName || handler.user!.tag,
                botname: client.user!.username || client.user!.displayName,
              })}`
            )
            .setColor(client.color_main),
        ],
      });

    if (
      result.type === "PLAYLIST" &&
      tracks.length > client.config.features.MAX_QUEUE &&
      !userPerm.Premium
    )
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands", "music.play_playlist_max", {
                limitqueue: String(client.config.features.MAX_QUEUE),
                premium: client.config.bot.PREMIUM_URL,
                user: handler.user!.displayName || handler.user!.tag,
                botname: client.user!.username || client.user!.displayName,
              })}`
            )
            .setColor(client.color_main),
        ],
      });

    if (result.type === "PLAYLIST") for (let track of tracks) player.queue.add(track);
    else if (player.playing && result.type === "SEARCH") player.queue.add(tracks[0]);
    else if (player.playing && result.type !== "SEARCH")
      for (let track of tracks) player.queue.add(track);
    else player.queue.add(tracks[0]);

    const TotalDuration = player.queue.duration;

    const embed = new EmbedBuilder().setColor(client.color_second);
    if (tracks[0]?.uri && tracks[0].uri.includes("soundcloud")) {
      embed.setThumbnail(client.user?.displayAvatarURL({ extension: "png" }) ?? null);
    } else if (tracks[0]?.artworkUrl) {
      embed.setThumbnail(tracks[0].artworkUrl);
    }

    if (result.type === "TRACK") {
      embed.setDescription(
        `${client.i18n.get(handler.language, "client.commands", "music.play_track", {
          title: this.getTitle(client, result.type, tracks),
          duration: new ConvertTime().parse(tracks[0].duration as number),
          request: String(tracks[0].requester),
          serversupport: String(client.config.bot.SERVER_SUPPORT_URL),
          author: tracks[0]?.author || handler.guild!.name,
          url: String(tracks[0].uri || client.config.bot.SERVER_SUPPORT_URL),
          user: handler.user!.displayName || handler.user!.tag,
        })}`
      );

      handler.editReply({ content: " ", embeds: [embed] });
      if (!player.playing) player.play();
    } else if (result.type === "PLAYLIST") {
      embed.setDescription(
        `${client.i18n.get(handler.language, "client.commands", "music.play_playlist", {
          title: this.getTitle(client, result.type, tracks, value),
          duration: new ConvertTime().parse(TotalDuration),
          songs: String(tracks.length),
          request: String(tracks[0].requester),
          serversupport: String(client.config.bot.SERVER_SUPPORT_URL),
          author: tracks[0]?.author || handler.guild!.name,
          url: String(tracks[0].uri || client.config.bot.SERVER_SUPPORT_URL),
          user: handler.user!.displayName || handler.user!.tag,
        })}`
      );

      handler.editReply({ content: " ", embeds: [embed] });
      if (!player.playing) player.play();
    } else if (result.type === "SEARCH") {
      embed.setDescription(
        `${client.i18n.get(handler.language, "client.commands", "music.play_result", {
          title: this.getTitle(client, result.type, tracks),
          duration: new ConvertTime().parse(tracks[0].duration as number),
          request: String(tracks[0].requester),
          serversupport: String(client.config.bot.SERVER_SUPPORT_URL),
          author: tracks[0]?.author || handler.guild!.name,
          url: String(tracks[0].uri || client.config.bot.SERVER_SUPPORT_URL),
          user: handler.user!.displayName || handler.user!.tag,
        })}`
      );

      handler.editReply({ content: " ", embeds: [embed] });
      if (!player.playing) player.play();
    }
  }

  checkSameVoice(client: Manager, handler: CommandHandler, language: string) {
    if (handler.member!.voice.channel !== handler.guild!.members.me!.voice.channel) {
      handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands", "music.play_no_same_voice")}`
            )
            .setColor(client.color_main),
        ],
      });
      return false;
    }

    return true;
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
  async autocomplete(client: Manager, interaction: GlobalInteraction, language: string) {
    let choice: AutocompleteInteractionChoices[] = [];
    const url = String((interaction as any).options.get("search")!.value);

    const Random =
      client.config.features.AUTOCOMPLETE_SEARCH[
        Math.floor(Math.random() * client.config.features.AUTOCOMPLETE_SEARCH.length)
      ];

    const match = client.REGEX.some((match) => {
      return match.test(url) == true;
    });

    if (match == true) {
      choice.push({ name: url, value: url });
      await (interaction as AutocompleteInteraction).respond(choice).catch(() => {});
      return;
    }

    if (client.lavalinkUsing.length == 0) {
      choice.push({
        name: `${client.i18n.get(language, "client.commands.music.play", "no_node")}`,
        value: `${client.i18n.get(language, "client.commands.music.play", "no_node")}`,
      });
      return;
    }
    const engines = client.config.features.PLAY_COMMAND_ENGINE;
    const randomEngine = engines[Math.floor(Math.random() * engines.length)];
    const searchRes = await client.Zklink.search(url || Random, {
      engine: randomEngine,
    });

    if (searchRes.tracks.length == 0 || !searchRes.tracks) {
      return choice.push({ name: "Lỗi: không có bài hát phù hợp", value: url });
    }

    for (let i = 0; i < 10; i++) {
      const x = searchRes.tracks[i];
      choice.push({
        name: x && x.title ? x.title : "Tên bài hát không xác định",
        value: x && x.uri ? x.uri : url,
      });
    }

    await (interaction as AutocompleteInteraction).respond(choice).catch(() => {});
  }
}
