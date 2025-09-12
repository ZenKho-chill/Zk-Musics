/**
 * Các sự kiện của Lavalink (enum)
 */
export enum LavalinkEventsEnum {
  Ready = "ready",
  Status = "stats",
  Event = "event",
  PlayerUpdate = "playerUpdate",
}

/**
 * Các sự kiện của player trong Lavalink (enum)
 */
export enum LavalinkPlayerEventsEnum {
  TrackStartEvent = "TrackStartEvent",
  TrackEndEvent = "TrackEndEvent",
  TrackExceptionEvent = "TrackExceptionEvent",
  TrackStuckEvent = "TrackStuckEvent",
  WebSocketClosedEvent = "WebSocketClosedEvent",
}

/**
 * Nguyên nhân kết thúc bài
 */
export type TrackEndReason = "finished" | "loadFailed" | "stopped" | "replaced" | "cleanup";

/**
 * Giao diện Exception
 */
export interface Exception {
  message: string;
  severity: Severity;
  cause: string;
}

/**
 * Mức độ nghiêm trọng của Exception
 */
export type Severity = "common" | "suspicious" | "fault";
