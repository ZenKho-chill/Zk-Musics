/**
 * Đại diện cho payload từ sự kiện serverUpdate
 */
export interface ServerUpdate {
  token: string;
  guild_id: string;
  endpoint: string;
}

/**
 * Đại diện cho payload một phần từ sự kiện stateUpdate
 */
export interface StateUpdatePartial {
  channel_id?: string;
  session_id?: string;
  self_deaf: boolean;
  self_mute: boolean;
}
