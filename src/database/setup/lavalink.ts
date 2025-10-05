import { Manager } from "../../manager.js";
import { AutoReconnect } from "../schema/AutoReconnect.js";
import { VoiceChannel } from "discord.js";
import { ZklinkLoopMode, ZklinkPlayer } from "../../Zklink/main.js";
// Log đã bị xóa - import Logger functions

export class AutoReconnectLavalinkService {
  client: Manager;
  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }

  async execute() {
    // Log đã bị xóa - Đang thiết lập dữ liệu cho lavalink
    // Log đã bị xóa - Auto ReConnect đang thu thập dữ liệu player 24/7
    const maindata = await this.client.db.autoreconnect.all();

    if (!maindata || maindata.length == 0) {
      // Log đã bị xóa - Auto ReConnect tìm thấy trong 0 server
      // Log đã bị xóa - Hoàn tất thiết lập dữ liệu cho lavalink
      return;
    }

    // Log đã bị xóa - Auto ReConnect tìm thấy trong server
    if (Object.keys(maindata).length === 0) return;

    let retry_interval = setInterval(async () => {
      if (this.client.lavalinkUsing.length == 0 || this.client.Zklink.nodes.size == 0)
        // Log đã bị xóa - Không có lavalink khả dụng
        return;

      clearInterval(retry_interval);

      // Log đã bị xóa - Lavalink khả dụng, xóa interval và tiếp tục thiết lập

      for await (const data of maindata) {
        setTimeout(async () => this.connectChannel(data));
      }

      // Log đã bị xóa - Đã kết nối lại với tất cả server
      // Log đã bị xóa - Hoàn tất thiết lập dữ liệu cho lavalink
    }, 3000);
  }

  async connectChannel(data: { id: string; value: AutoReconnect }) {
    const channel = await this.client.channels.fetch(data.value.text).catch(() => undefined);
    const guild = await this.client.guilds.fetch(data.value.guild).catch(() => undefined);
    const voice = (await this.client.channels
      .fetch(data.value.voice)
      .catch(() => undefined)) as VoiceChannel;
    if (!channel || !voice) {
      // Log đã bị xóa - Kênh voice/text cuối cùng không tìm thấy
      return this.client.db.autoreconnect.delete(data.value.guild);
    }

    if (!data.value.twentyfourseven && voice.members.filter((m) => !m.user.bot).size == 0) {
      // Log đã bị xóa - Guild có 0 thành viên trong kênh voice
      return this.client.db.autoreconnect.delete(data.value.guild);
    }

    const player = await this.client.Zklink.create({
      guildId: data.value.guild,
      voiceId: data.value.voice,
      textId: data.value.text,
      shardId: guild ? guild.shardId : 0,
      nodeName: (await this.client.Zklink.nodes.getLeastUsed()).options.name,
      deaf: true,
      mute: false,
      region: voice.rtcRegion ?? null,
      volume: this.client.config.bot.DEFAULT_VOLUME,
    });

    if (!this.client.config.features.AUTO_RESUME) {
      // Log đã bị xóa - Tự động resume bị tắt
      return;
    }

    if (data.value.current && data.value.current.length !== 0) {
      const search = await player.search(data.value.current, {
        requester: this.client.user,
      });
      if (!search.tracks.length) return;

      if (data.value.queue.length !== 0) await this.queueDataPush(data.value.queue, player);

      if (data.value.previous.length !== 0)
        await this.previousDataPush(data.value.previous, player);

      if (data.value.config.loop !== "none")
        player.setLoop(data.value.config.loop as ZklinkLoopMode);
      await player.play(search.tracks[0]);
    }
  }

  async queueDataPush(query: string[], player: ZklinkPlayer) {
    const SongAdd = [];
    let SongLoad = 0;

    for (const data of query) {
      const res = await player.search(data, {
        requester: this.client.user,
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
      if (SongLoad == query.length) {
        player.queue.add(SongAdd);
      }
    }
  }

  async previousDataPush(query: string[], player: ZklinkPlayer) {
    const SongAdd = [];
    let SongLoad = 0;

    for (const data of query) {
      const res = await player.search(data, {
        requester: this.client.user,
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
      if (SongLoad == query.length) {
        player.queue.previous.push(...SongAdd);
      }
    }
  }
}
