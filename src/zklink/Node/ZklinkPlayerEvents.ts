import { ZklinkEvents, ZklinkLoopMode, ZklinkPlayerState } from "../Interface/Constants.js";
import { LavalinkEventsEnum } from "../Interface/LavalinkEvents.js";
import { Zklink } from "../Zklink.js";

export class ZklinkPlayerEvents {
  protected readonly methods: Record<string, (manager: Zklink, data: Record<string, any>) => void>;

  constructor() {
    this.methods = {
      TrackStartEvent: this.TrackStartEvent,
      TrackEndEvent: this.TrackEndEvent,
      TrackExceptionEvent: this.TrackExceptionEvent,
      TrackStuckEvent: this.TrackStuckEvent,
      WebSocketClosedEvent: this.WebSocketClosedEvent,
    };
  }

  public initial(data: Record<string, any>, manager: Zklink) {
    if (data.op == LavalinkEventsEnum.PlayerUpdate) return this.PlayerUpdate(manager, data);
    const _function = this.methods[data.type];
    if (_function !== undefined) _function(manager, data);
  }

  protected TrackStartEvent(manager: Zklink, data: Record<string, any>) {
    const player = manager.players.get(data.guildId);
    if (player) {
      player.playing = true;
      player.paused = false;
      // @ts-ignore
      manager.emit(ZklinkEvents.TrackStart, player, player.queue.current);
      // @ts-ignore
      manager.emit(
        ZklinkEvents.Debug,
        `[Zklink] / [Người phát @ ${data.guildId}] / [Sự kiện] / [Bắt đầu] | ` +
          JSON.stringify(data)
      );
    }
    return;
  }

  protected TrackEndEvent(manager: Zklink, data: Record<string, any>) {
    const player = manager.players.get(data.guildId);
    if (player) {
      // Sự kiện này phát reason 'STOPPED' khi bị huỷ, nên return để tránh phát trùng
      if (player.state === ZklinkPlayerState.DESTROYED)
        // @ts-ignore
        return manager.emit(
          ZklinkEvents.Debug,
          `[Zklink] / [Người phát @ ${data.guildId}] / [Sự kiện] / [Kết thúc] | Player ${player.guildId} đã bị huỷ do sự kiện kết thúc`
        );
      // @ts-ignore
      manager.emit(
        ZklinkEvents.Debug,
        `[Zklink] / [Người phát @ ${data.guildId}] / [Sự kiện] / [Kết thúc] | ` +
          `Bài: ${player.queue.length} ` +
          JSON.stringify(data)
      );

      player.playing = false;
      player.paused = true;

      if (data.reason === "replaced") {
        // @ts-ignore
        return manager.emit(ZklinkEvents.TrackEnd, player, player.queue.current);
      }
      if (["loadFailed", "cleanup"].includes(data.reason)) {
        if (player.queue.current) player.queue.previous.push(player.queue.current);
        if (!player.queue.length && !player.sudoDestroy)
          // @ts-ignore
          return manager.emit(ZklinkEvents.QueueEmpty, player);
        // @ts-ignore
        manager.emit(ZklinkEvents.QueueEmpty, player, player.queue.current);
        player.queue.current = null;
        return player.play();
      }

      if (player.loop == ZklinkLoopMode.SONG && player.queue.current)
        player.queue.unshift(player.queue.current);
      if (player.loop == ZklinkLoopMode.QUEUE && player.queue.current)
        player.queue.push(player.queue.current);

      if (player.queue.current) player.queue.previous.push(player.queue.current);
      const currentSong = player.queue.current;
      player.queue.current = null;

      if (player.queue.length) {
        // @ts-ignore
        manager.emit(ZklinkEvents.TrackEnd, player, currentSong);
      } else if (!player.queue.length && !player.sudoDestroy) {
        // @ts-ignore
        return manager.emit(ZklinkEvents.QueueEmpty, player);
      } else return;

      return player.play();
    }
    return;
  }

  protected TrackExceptionEvent(manager: Zklink, data: Record<string, any>) {
    const player = manager.players.get(data.guildId);
    if (player) {
      // @ts-ignore
      manager.emit(ZklinkEvents.PlayerException, player, data);
      // @ts-ignore
      manager.emit(
        ZklinkEvents.Debug,
        `[Zklink] / [Người phát @ ${data.guildId}] / [Sự kiện] / [Ngoại lệ] | ` +
          JSON.stringify(data)
      );
    }
    return;
  }

  protected TrackStuckEvent(manager: Zklink, data: Record<string, any>) {
    const player = manager.players.get(data.guildId);
    if (player) {
      // @ts-ignore
      manager.emit(ZklinkEvents.TrackStuck, player, data);
      // @ts-ignore
      manager.emit(
        ZklinkEvents.Debug,
        `[Zklink] / [Người phát @ ${data.guildId}] / [Sự kiện] / [Bị kẹt] | ` + JSON.stringify(data)
      );
    }
    return;
  }

  protected WebSocketClosedEvent(manager: Zklink, data: Record<string, any>) {
    const player = manager.players.get(data.guildId);
    if (player) {
      // @ts-ignore
      manager.emit(ZklinkEvents.PlayerWebsocketClosed, player, data);
      // @ts-ignore
      manager.emit(
        ZklinkEvents.Debug,
        `[Zklink] / [Người phát @ ${data.guildId}] / [Sự kiện] / [Websocket đóng] | ` +
          JSON.stringify(data)
      );
    }
    return;
  }

  protected PlayerUpdate(manager: Zklink, data: Record<string, any>) {
    const player = manager.players.get(data.guildId);
    if (player) {
      player.position = Number(data.state.position);
      // @ts-ignore
      manager.emit(
        ZklinkEvents.Debug,
        `[Zklink] / [Người phát @ ${data.guildId}] / [Sự kiện] / [Cập nhật] | ` +
          JSON.stringify(data)
      );
      // @ts-ignore
      manager.emit(ZklinkEvents.PlayerUpdate, player, data);
    }
    return;
  }
}
