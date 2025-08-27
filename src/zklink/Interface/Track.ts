import { ZklinkPlayer } from "../Player/ZklinkPlayer.js";

export interface ResolveOptions {
  /** Có muốn ghi đè track hay không */
  overwrite?: boolean;
  /** Thuộc tính player của Zklink */
  player?: ZklinkPlayer;
  /** Tên của node */
  nodeName?: string;
}
