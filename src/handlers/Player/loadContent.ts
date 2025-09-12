import { Manager } from "../../manager.js";
import { EmbedBuilder, Message, GuildMember, TextChannel } from "discord.js";
import { ConvertTime } from "../../utilities/ConvertTime.js";
import { GlobalInteraction } from "../../@types/Interaction.js";
// Các lệnh nút
import { ButtonPrevious } from "./ButtonCommands/Previous.js";
import { ButtonSkip } from "./ButtonCommands/Skip.js";
import { ButtonStop } from "./ButtonCommands/Stop.js";
import { ButtonLoop } from "./ButtonCommands/Loop.js";
import { ButtonPause } from "./ButtonCommands/Pause.js";
import { RateLimitManager } from "@sapphire/ratelimits";
import { ZklinkTrack } from "../../Zklink/main.js";
const rateLimitManager = new RateLimitManager(2000);

/**
 * @param {Client} client - client của bot
 */

export class PlayerContentLoader {
  client: Manager;
  constructor(client: Manager) {
    this.client = client;
    this.register();
  }

  register() {
    try {
      this.client.on("interactionCreate", this.interaction.bind(null, this.client));
      this.client.on("messageCreate", this.message.bind(null, this.client));
    } catch (err) {
      this.client.logger.error(PlayerContentLoader.name, err);
    }
  }

  async interaction(client: Manager, interaction: GlobalInteraction): Promise<void> {
    if (!interaction.guild || interaction.user.bot) return;
    if (!interaction.isButton()) return;
    const { customId, member } = interaction;
    let voiceMember = await interaction.guild.members
      .fetch((member as GuildMember)!.id)
      .catch(() => undefined);
    let channel = voiceMember!.voice.channel;

    let player = client.Zklink.players.get(interaction.guild.id);
    if (!player) return;

    const playChannel = await client.channels.fetch(player.textId).catch(() => undefined);
    if (!playChannel) return;

    let guildModel = await client.db.language.get(`${player.guildId}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(`${player.guildId}`, client.config.bot.LANGUAGE);
    }

    const language = guildModel;

    switch (customId) {
      case "sprevious":
        new ButtonPrevious(client, interaction, channel, language, player);
        break;
      case "sskip":
        new ButtonSkip(client, interaction, channel, language, player);
        break;
      case "sstop":
        new ButtonStop(client, interaction, channel, language, player);
        break;
      case "sloop":
        new ButtonLoop(client, interaction, language, player);
        break;
      case "spause":
        new ButtonPause(client, interaction, channel, language, player);
        break;
      default:
        break;
    }
  }

  async message(client: Manager, message: Message): Promise<any> {
    if (!message.guild || !message.guild.available || !message.channel.isTextBased()) return;
    let database = await client.db.setup.get(`${message.guild?.id}`);
    let player = client.Zklink.players.get(`${message.guild?.id}`);

    if (!database) {
      // Xóa mục khỏi cơ sở dữ liệu nếu nó không tồn tại
      await client.db.setup.delete(`${message.guild?.id}`).catch(() => {});
      return;
    }

    if (!database!.enable) return;

    let channel = (await message.guild.channels
      .fetch(database!.channel)
      .catch(() => undefined)) as TextChannel;
    if (!channel) return;

    if (database!.channel != message.channel.id) return;

    let guildModel = await client.db.language.get(`${message.guild.id}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(`${message.guild.id}`, client.config.bot.LANGUAGE);
    }

    const language = guildModel;
    if (message.id !== database.playmsg) {
      if (!message || !message.channel) {
        return;
      }
      const preInterval = setInterval(async () => {
        const fetchedMessage = await message.channel.messages
          .fetch({ limit: 50 })
          .catch(() => undefined);
        if (!fetchedMessage) {
          clearInterval(preInterval);
          return;
        }
        const final = fetchedMessage.filter((msg) => msg.id !== database?.playmsg);
        if (final.size > 0) (message.channel as TextChannel).bulkDelete(final).catch(() => {});
        else clearInterval(preInterval);
      }, client.config.features.DELETE_MSG_TIMEOUT);
    }

    if (message.author.bot) return;

    const song = message.cleanContent;
    if (!song) return;

    const ratelimit = rateLimitManager.acquire(message.author.id);

    if (ratelimit.limited) return;

    ratelimit.consume();

    let voiceChannel = await message.member!.voice.channel;
    if (!voiceChannel)
      return (message.channel as TextChannel).send({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(language, "button.setup.music", "no_in_voice")}`)
            .setColor(client.color_main),
        ],
      });

    let msg = await message.channel.messages.fetch(database!.playmsg).catch(() => undefined);

    const emotes = (str: string) => str.match(/<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu);

    if (emotes(song) !== null) {
      msg?.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(language, "button.setup.music", "play_emoji")}`)
            .setColor(client.color_main),
        ],
      });
      return;
    }

    const isYouTubeLink = (value: string): boolean => {
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube|youtu)\.(?:com|be)\/(?:[^ ]+)/i;
      return youtubeRegex.test(value);
    };

    if (isYouTubeLink(song) && !client.config.features.YOUTUBE_LINK) {
      return msg?.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(language, "commands.music", "youtube_disabled", {
                user: message.author!.displayName || message.author!.tag,
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
        guildId: message.guild.id,
        voiceId: message.member!.voice.channel!.id,
        textId: message.channel.id,
        shardId: message.guild.shardId,
        nodeName: (await client.Zklink.nodes.getLeastUsed()).options.name,
        deaf: true,
        mute: false,
        region: message.member!.voice.channel!.rtcRegion ?? null,
        volume: client.config.bot.DEFAULT_VOLUME ?? 100,
      });
    else {
      if (message.member!.voice.channel !== message.guild!.members.me!.voice.channel) {
        msg?.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${client.i18n.get(language, "button.setup.music", "no_same_voice")}`)
              .setColor(client.color_main),
          ],
        });
        return;
      }
    }

    const engines = client.config.features.PLAY_COMMAND_ENGINE;
    const randomEngine = engines[Math.floor(Math.random() * engines.length)];

    const result = await player.search(song, {
      engine: randomEngine,
      requester: message.author,
    });
    const tracks = result.tracks;

    if (!result.tracks.length) {
      msg?.edit({
        content: `${`${client.i18n.get(language, "button.setup.music", "setup_content")}`}`,
      });
      return;
    }

    if (result.type === "PLAYLIST") for (let track of tracks) player.queue.add(track);
    else if (player.playing && result.type === "SEARCH") player.queue.add(tracks[0]);
    else if (player.playing && result.type !== "SEARCH")
      for (let track of tracks) player.queue.add(track);
    else player.queue.add(tracks[0]);

    const TotalDuration = player.queue.duration;

    if (result.type === "PLAYLIST") {
      if (!player.playing) player.play();
      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(language, "button.setup.music", "play_playlist", {
            title: getTitle(result.tracks),
            duration: new ConvertTime().parse(TotalDuration),
            songs: `${result.tracks.length}`,
            request: `${result.tracks[0].requester}`,
          })}`
        )
        .setColor(client.color_main);
      msg?.reply({ content: " ", embeds: [embed] });
    } else if (result.type === "TRACK") {
      if (!player.playing) player.play();
      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(language, "button.setup.music", "play_track", {
            title: getTitle(result.tracks),
            duration: new ConvertTime().parse(result.tracks[0].duration as number),
            request: `${result.tracks[0].requester}`,
          })}`
        )
        .setColor(client.color_main);
      msg?.reply({ content: " ", embeds: [embed] });
    } else if (result.type === "SEARCH") {
      if (!player.playing) player.play();
      const embed = new EmbedBuilder().setColor(client.color_main).setDescription(
        `${client.i18n.get(language, "button.setup.music", "play_result", {
          title: getTitle(result.tracks),
          duration: new ConvertTime().parse(result.tracks[0].duration as number),
          request: `${result.tracks[0].requester}`,
        })}`
      );
      msg?.reply({ content: " ", embeds: [embed] });
    }

    function getTitle(tracks: ZklinkTrack[]): string {
      if (client.config.features.HIDE_LINK) return `${tracks[0].title} bởi ${tracks[0].author}`;
      else {
        return `[${tracks[0].title} bởi ${tracks[0].author}](${client.config.bot.SERVER_SUPPORT_URL})`;
      }
    }

    await client.UpdateQueueMsg(player);
  }
}
