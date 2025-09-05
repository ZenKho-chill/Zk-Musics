import { EmbedBuilder, ApplicationCommandOptionType, Message } from "discord.js";
import { ConvertTime } from "../../utilities/ConvertTime.js";
import { Manager } from "../../manager.js";
import { Playlist } from "../../database/schema/Playlist.js";
import { ZklinkTrack } from "../../Zklink/main.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;
let playlist: Playlist | null;

export default class implements Command {
  public name = ["pl", "play"];
  public description = "Nhập danh sách phát vào hàng đợi và phát";
  public category = "Playlist";
  public accessableby = data.COMMANDS_ACCESS.PLAYLIST.Import;
  public usage = "<id_playlist>";
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
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const value = handler.args[0] ? handler.args[0] : null;

    let player = client.Zklink.players.get(handler.guild!.id);

    if (value == null)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.playlist", "pl_import_invalid")}`
            )
            .setColor(client.color_main),
        ],
      });

    if (value) {
      playlist = await client.db.playlist.get(`${value}`);
    }

    if (!playlist)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.playlist", "pl_import_invalid")}`
            )
            .setColor(client.color_main),
        ],
      });

    if (playlist.private && playlist.owner !== handler.user?.id) {
      handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.playlist", "pl_import_private")}`
            )
            .setColor(client.color_main),
        ],
      });
      return;
    }

    const { channel } = handler.member!.voice;
    if (!channel)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.playlist", "pl_import_voice")}`
            )
            .setColor(client.color_main),
        ],
      });
    const SongAdd: ZklinkTrack[] = [];
    let SongLoad = 0;

    const totalDuration = new ConvertTime().parse(
      playlist.tracks!.reduce((acc, cur) => acc + cur.length!, 0)
    );

    if (playlist.tracks?.length == 0)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.playlist", "pl_import_empty")}`
            )
            .setColor(client.color_main),
        ],
      });

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

    player.textId = handler.channel!.id;

    for (let i = 0; i < playlist.tracks!.length; i++) {
      const res = await player.search(playlist.tracks![i].uri, {
        requester: handler.user,
      });
      if (res.type == "TRACK") {
        SongAdd.push(res.tracks[0]);
        SongLoad++;
      } else if (res.type == "PLAYLIST") {
        for (let t = 0; t < res.tracks.length; t++) {
          SongAdd.push(res.tracks[t]);
          SongLoad++;
        }
      } else if (res.type == "SEARCH") {
        SongAdd.push(res.tracks[0]);
        SongLoad++;
      }
      if (SongLoad == playlist.tracks!.length) {
        player.queue.add(SongAdd);
        const embed = new EmbedBuilder()
          .setThumbnail(client.user!.displayAvatarURL({ size: 512 }))
          .setDescription(
            `${client.i18n.get(handler.language, "commands.playlist", "pl_import_imported_desc", {
              name: playlist.name,
              tracks: String(playlist.tracks!.length),
              duration: totalDuration,
              user: String(handler.user),
            })}`
          )
          .setFooter({
            text: `${client.i18n.get(
              handler.language,
              "commands.playlist",
              "pl_import_imported_footer",
              {
                name: playlist.name,
                tracks: String(playlist.tracks!.length),
                duration: totalDuration,
              }
            )}`,
          })
          .setColor(client.color_second);

        handler.editReply({ content: " ", embeds: [embed] });
        if (!player.playing) {
          player.play();
        }
      }
    }
  }
}
