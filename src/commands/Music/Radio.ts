import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  AutocompleteInteraction,
} from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { RadioStationArray } from "../../utilities/RadioStations.js";
import { ConvertTime } from "../../utilities/ConvertTime.js";
import { ZklinkLoopMode } from "../../Zklink/Interface/Constants.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

// Mã chính
export default class implements Command {
  public name = ["radio"];
  public description = "Phát đài radio từ danh sách có sẵn";
  public category = "Âm nhạc";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.Radio;
  public usage = "<số_radio>";
  public aliases = [];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "station",
      description: "Chọn đài radio từ danh sách có sẵn",
      type: ApplicationCommandOptionType.String,
      required: false,
      autocomplete: true,
    },
  ];

  public async autocomplete(client: Manager, interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const radioArrayList = RadioStationArray();
    
    // Tạo choices với format "category | name"
    const choices = radioArrayList
      .map(radio => ({
        name: `${radio.category} | ${radio.name}`,
        value: `${radio.category}|${radio.name}`
      }))
      .filter(choice => 
        choice.name.toLowerCase().includes(focusedValue)
      )
      .slice(0, 25); // Discord giới hạn 25 choices

    await interaction.respond(choices);
  }

  public async execute(client: Manager, handler: CommandHandler) {
    let player = client.Zklink.players.get(handler.guild!.id);
    const radioArrayList = RadioStationArray();

    await handler.deferReply();

    const stationArg = handler.args[0];
    if (!stationArg) return this.sendHelp(client, handler);

    // Tìm radio station theo format "category|name"
    let radioData;
    if (stationArg.includes("|")) {
      const [category, name] = stationArg.split("|");
      radioData = radioArrayList.find(r => r.category === category && r.name === name);
    } else {
      // Fallback: tìm theo số cũ nếu user nhập số
      const getNum = Number(stationArg);
      if (getNum && getNum > 0) {
        radioData = radioArrayList[getNum - 1];
      }
    }
    
    if (!radioData) return this.sendHelp(client, handler);

    const { channel } = handler.member!.voice;
    if (!channel)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.radio", "radio_no_voice")}`
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
        deaf: true,
        mute: false,
        region: handler.member!.voice.channel!.rtcRegion ?? undefined,
        volume: client.config.bot.DEFAULT_VOLUME,
      });
    else if (player && !this.checkSameVoice(client, handler, handler.language)) {
      return;
    }

    player.textId = handler.channel!.id;

    // Thử tìm kiếm với URL radio
    const result = await player.search(radioData.link, {
      requester: handler.user,
    });

    if (!result.tracks.length)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.radio", "radio_match", {
                serversupport: String(client.config.bot.SERVER_SUPPORT_URL),
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    // Logic đặc biệt cho radio: luôn thay thế thay vì add vào queue
    if (player.playing) {
      // Nếu đang phát, clear queue và set track mới làm current
      player.queue.clear();
      player.queue.add(result.tracks[0]);
      player.skip(); // Skip bài hiện tại để chuyển sang đài mới
    } else {
      // Nếu không phát, add bình thường
      if (result.type === "PLAYLIST") {
        for (let track of result.tracks) player.queue.add(track);
      } else {
        player.queue.add(result.tracks[0]);
      }
      player.play();
    }

    // Tắt các tính năng không phù hợp với radio stream
    player.data.set("autoplay", false);  // Tắt autoplay
    player.setLoop(ZklinkLoopMode.NONE);  // Tắt loop
    player.data.set("radio_mode", true);  // Đánh dấu đang ở radio mode
    // Note: Shuffle không cần tắt vì radio chỉ có 1 track
    
    // Clear queue để chỉ có radio stream, nhưng không xóa track hiện tại
    setTimeout(() => {
      // Chỉ clear queue nếu có nhiều hơn 1 track
      if (player.queue.length > 1) {
        const currentTrack = player.queue.current;
        player.queue.clear();
        // Track hiện tại sẽ tự động tiếp tục phát
      }
    }, 100);

    if (handler.message) await handler.message.delete().catch(() => null);
    const embed = new EmbedBuilder().setColor(client.color_main).setDescription(
      `${client.i18n.get(handler.language, "commands.radio", "radio_play_track", {
        title: radioData.name || handler.guild!.name,
        duration: new ConvertTime().parse(result.tracks[0].duration as number),
        request: String(result.tracks[0].requester),
        user: String(handler.user!.displayName || handler.user!.tag),
        url: String(result.tracks[0].uri),
        serversupport: String(client.config.bot.SERVER_SUPPORT_URL),
      })}`
    );

    handler.editReply({ content: " ", embeds: [embed] });
  }

  protected async sendHelp(client: Manager, handler: CommandHandler) {
    const radioArrayList = RadioStationArray();
    
    // Nhóm theo category
    const categories = {};
    radioArrayList.forEach(radio => {
      if (!categories[radio.category]) {
        categories[radio.category] = [];
      }
      categories[radio.category].push(radio);
    });

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Danh sách đài radio",
        iconURL: handler.user?.displayAvatarURL(),
      })
      .setColor(client.color_main)
      .setDescription("Sử dụng autocomplete để tìm và chọn đài radio bạn muốn nghe!");

    // Thêm fields cho mỗi category
    Object.keys(categories).forEach(category => {
      const stations = categories[category];
      const stationList = stations.map(s => `• ${s.name}`).join('\n');
      embed.addFields({
        name: `📻 ${category}`,
        value: stationList,
        inline: true
      });
    });

    await handler.editReply({ embeds: [embed] });
  }



  checkSameVoice(client: Manager, handler: CommandHandler, language: string) {
    if (handler.member!.voice.channel !== handler.guild!.members.me!.voice.channel) {
      handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.radio", "radio_no_same_voice")}`
            )
            .setColor(client.color_main),
        ],
      });
      return false;
    }

    return true;
  }
}
