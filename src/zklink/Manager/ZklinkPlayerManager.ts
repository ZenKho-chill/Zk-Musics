import { ZklinkEvents, ZklinkPlayerState, VoiceState } from "../Interface/Constants.js";
import { VoiceChannelOptions } from "../Interface/Player.js";
import { ZklinkPlayer } from "../Player/ZklinkPlayer.js";
import { Zklink } from "../Zklink.js";
import { ZklinkPlugin } from "../Plugin/VoiceReceiver/Plugin.js";
import { ZklinkDatabase } from "../Utilities/ZklinkDatabase.js";

export class ZklinkPlayerManager extends ZklinkDatabase<ZklinkPlayer> {
  /** Quản lý Zklink */
  public manager: Zklink;

  /**
   * Lớp chính để quản lý các player lavalink
   * @param manager Zklink manager
   */
  constructor(manager: Zklink) {
    super();
    this.manager = manager;
  }

  /**
   * Tạo một player
   * @returns ZklinkPlayer
   * @internal
   */
  async create(options: VoiceChannelOptions): Promise<ZklinkPlayer> {
    const createdPlayer = this.get(options.guildId);
    if (createdPlayer) return createdPlayer;
    const getCustomNode = this.manager.nodes.get(String(options.nodeName ? options.nodeName : ""));
    const node = getCustomNode ? getCustomNode : await this.manager.nodes.getLeastUsed();
    if (!node) throw new Error("Không tìm thấy node nào để kết nối");
    const customPlayer =
      this.manager.ZklinkOptions.options!.structures &&
      this.manager.ZklinkOptions.options!.structures.player;
    let player = customPlayer
      ? new customPlayer(this.manager, options, node)
      : new ZklinkPlayer(this.manager, options, node);
    this.set(player.guildId, player);
    try {
      player = await player.connect();
    } catch (err) {
      this.delete(player.guildId);
      throw err;
    }
    const onUpdate = (state: VoiceState) => {
      if (state !== VoiceState.SESSION_READY) return;
      player.sendServerUpdate();
    };
    await player.sendServerUpdate();
    // @ts-ignore
    player.on("connectionUpdate", onUpdate);
    player.state = ZklinkPlayerState.CONNECTED;
    this.debug("Đã tạo Player tại " + options.guildId);
    // @ts-ignore
    this.manager.emit(ZklinkEvents.PlayerCreate, player);
    const voiceReceiver = this.manager.plugins.get("Zklink-voiceReceiver") as ZklinkPlugin;
    if (voiceReceiver && node.driver.id.includes("nodelink")) voiceReceiver.open(node, options);
    return player;
  }

  /**
   * Hủy một player
   * @returns Player đã bị hủy / ngắt kết nối hoặc undefined nếu không có
   * @internal
   */
  public async destroy(guildId: string = ""): Promise<void> {
    const player = this.get(guildId);
    if (player) await player.destroy();
  }

  protected debug(logs: string) {
    // @ts-ignore
    this.manager.emit(ZklinkEvents.Debug, `[Zklink] / [Quản lý Player] | ${logs}`);
  }
}
