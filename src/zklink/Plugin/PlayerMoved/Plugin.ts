import { ZklinkEvents, ZklinkPluginType } from "../../Interface/Constants.js";
import { Zklink } from "../../Zklink.js";
import { ZklinkPlugin as Plugin } from "../ZklinkPlugin.js";

export class ZklinkPlugin extends Plugin {
  private Zklink: Zklink | null = null;

  /**
   * Khởi tạo plugin.
   * @param client Discord.Client
   */
  constructor(public client: any) {
    super();
  }

  /**
   * Loại plugin
   * @returns ZklinkPluginType
   */
  public type(): ZklinkPluginType {
    return ZklinkPluginType.Default;
  }

  /**
   * Tải plugin.
   * @param Zklink Zklink
   */
  public load(Zklink: Zklink): void {
    this.Zklink = Zklink;
    this.client.on("voiceStateUpdate", this.onVoiceStateUpdate.bind(this));
  }

  /**
   * Tên plugin
   * @returns string
   */
  public name(): string {
    return "Zklink-playerMoved";
  }

  /**
   * Gỡ tải plugin.
   */
  public unload(): void {
    this.client.removeListener(
      "voiceStateUpdate",
      this.onVoiceStateUpdate.bind(this)
    );
    this.Zklink = null;
  }

  private onVoiceStateUpdate(oldState: any, newState: any): void {
    if (!this.Zklink || oldState.id !== this.client.user.id) return;

    const newChannelId = newState.channelID || newState.channelId;
    const oldChannelId = oldState.channelID || oldState.channelId;
    const guildId = newState.guild.id;

    const player = this.Zklink.players.get(guildId);
    if (!player) return;

    let state = "UNKNOWN";
    if (!oldChannelId && newChannelId) state = "JOINED";
    else if (oldChannelId && !newChannelId) state = "LEFT";
    else if (oldChannelId && newChannelId && oldChannelId !== newChannelId)
      state = "MOVED";

    if (state === "UNKNOWN") return;
    // @ts-ignore
    this.Zklink.emit(ZklinkEvents.PlayerMoved, player, state, {
      oldChannelId,
      newChannelId,
    });
  }
}
