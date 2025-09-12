import util from "node:util";
import {
  ZklinkEvents,
  ZklinkFilterData,
  ZklinkFilterMode,
  ZklinkPlayerState,
} from "../Interface/Constants.js";
import {
  Band,
  ChannelMix,
  Distortion,
  FilterOptions,
  Freq,
  Karaoke,
  LowPass,
  Rotation,
  Timescale,
} from "../Interface/Player.js";
import { ZklinkPlayer } from "./ZklinkPlayer.js";

export class ZklinkFilter {
  constructor(protected player: ZklinkPlayer) {}

  /**
   * Đặt một filter có sẵn trong Zklink
   * @param filter Tên filter
   * @returns ZklinkPlayer
   */
  public async set(filter: ZklinkFilterMode): Promise<ZklinkPlayer> {
    this.checkDestroyed();

    const filterData = ZklinkFilterData[filter];

    if (!filterData) {
      this.debug(`Filter ${filter} không có trong danh sách filter có sẵn của Zklink`);
      return this.player;
    }

    await this.player.send({
      guildId: this.player.guildId,
      playerOptions: {
        filters: filterData,
      },
    });

    this.debug(
      filter !== "clear"
        ? `Filter ${filter} đã được đặt thành công.`
        : "Tất cả filter đã được đặt lại về vị trí mặc định thành công."
    );

    return this.player;
  }

  /**
   * Xoá (reset) tất cả filter
   * @returns ZklinkPlayer
   */
  public async clear(): Promise<ZklinkPlayer> {
    this.checkDestroyed();

    await this.player.send({
      guildId: this.player.guildId,
      playerOptions: {
        filters: {},
      },
    });

    this.debug("Tất cả filter đã được đặt lại về vị trí mặc định thành công.");

    return this.player;
  }

  /**
   * Đặt âm lượng cho filter của player
   * @param volume Mục tiêu âm lượng 0.0-5.0
   */
  public async setVolume(volume: number): Promise<ZklinkPlayer> {
    return this.setRaw({ volume });
  }

  /**
   * Thay đổi thiết lập equalizer áp dụng cho track đang phát
   * @param equalizer Mảng các đối tượng theo kiểu Band để định nghĩa âm lượng ở các tần số khác nhau
   */
  public setEqualizer(equalizer: Band[]): Promise<ZklinkPlayer> {
    return this.setRaw({ equalizer });
  }

  /**
   * Thay đổi thiết lập karaoke áp dụng cho track đang phát
   * @param karaoke Đối tượng theo kiểu Karaoke để định nghĩa vùng tần số cần tắt
   */
  public setKaraoke(karaoke?: Karaoke): Promise<ZklinkPlayer> {
    return this.setRaw({ karaoke: karaoke || null });
  }

  /**
   * Thay đổi thiết lập timescale áp dụng cho track đang phát
   * @param timescale Đối tượng theo kiểu Timescale để điều chỉnh tốc độ/thời gian phát
   */
  public setTimescale(timescale?: Timescale): Promise<ZklinkPlayer> {
    return this.setRaw({ timescale: timescale || null });
  }

  /**
   * Thay đổi thiết lập tremolo áp dụng cho track đang phát
   * @param tremolo Đối tượng theo kiểu Freq để định nghĩa dao động âm lượng
   */
  public setTremolo(tremolo?: Freq): Promise<ZklinkPlayer> {
    return this.setRaw({ tremolo: tremolo || null });
  }

  /**
   * Thay đổi thiết lập vibrato áp dụng cho track đang phát
   * @param vibrato Đối tượng theo kiểu Freq để định nghĩa dao động cao độ
   */
  public setVibrato(vibrato?: Freq): Promise<ZklinkPlayer> {
    return this.setRaw({ vibrato: vibrato || null });
  }

  /**
   * Thay đổi thiết lập rotation áp dụng cho track đang phát
   * @param rotation Đối tượng theo kiểu Rotation để định nghĩa tần suất âm thanh xoay quanh người nghe
   */
  public setRotation(rotation?: Rotation): Promise<ZklinkPlayer> {
    return this.setRaw({ rotation: rotation || null });
  }

  /**
   * Thay đổi thiết lập distortion áp dụng cho track đang phát
   * @param distortion Đối tượng theo kiểu Distortion để định nghĩa độ méo âm thanh
   * @returns Phiên bản player hiện tại
   */
  public setDistortion(distortion?: Distortion): Promise<ZklinkPlayer> {
    return this.setRaw({ distortion: distortion || null });
  }

  /**
   * Thay đổi thiết lập channel mix áp dụng cho track đang phát
   * @param channelMix Đối tượng theo kiểu ChannelMix để điều chỉnh ảnh hưởng giữa kênh trái và phải
   */
  public setChannelMix(channelMix?: ChannelMix): Promise<ZklinkPlayer> {
    return this.setRaw({ channelMix: channelMix || null });
  }

  /**
   * Thay đổi thiết lập low pass áp dụng cho track đang phát
   * @param lowPass Đối tượng theo kiểu LowPass để định nghĩa mức giảm tần số cao
   */
  public setLowPass(lowPass?: LowPass): Promise<ZklinkPlayer> {
    return this.setRaw({ lowPass: lowPass || null });
  }

  /**
   * Đặt một filter tuỳ chỉnh
   * @param filter Đối tượng filter
   * @returns ZklinkPlayer
   */
  public async setRaw(filter: FilterOptions): Promise<ZklinkPlayer> {
    this.checkDestroyed();
    await this.player.send({
      guildId: this.player.guildId,
      playerOptions: {
        filters: filter,
      },
    });

    this.debug("Đã đặt filter tuỳ chỉnh thành công. Dữ liệu: " + util.inspect(filter));

    return this.player;
  }

  protected debug(logs: string) {
    // @ts-ignore
    this.player.manager.emit(
      ZklinkEvents.Debug,
      `[Zklink] / [Người phát @ ${this.player.guildId}] / [Bộ lọc] | ${logs}`
    );
  }

  protected checkDestroyed(): void {
    if (this.player.state === ZklinkPlayerState.DESTROYED) throw new Error("Player đã bị huỷ");
  }
}
