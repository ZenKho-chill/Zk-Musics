import { metadata } from "./metadata.js";
import Library from "./Libary/index.js";
import Plugin from "./Plugin/index.js";

// Xuất lớp chính (main class)
export * from "./Zklink.js";
// Xuất các lớp player
export * from "./Player/ZklinkPlayer.js";
export * from "./Player/ZklinkQueue.js";
export * from "./Player/ZklinkTrack.js";
// Xuất các lớp node
export * from "./Node/ZklinkNode.js";
export * from "./Node/ZklinkRest.js";
export * from "./Node/ZklinkPlayerEvents.js";
// Xuất các lớp manager
export * from "./Manager/ZklinkNodeManager.js";
export * from "./Manager/ZklinkPlayerManager.js";
//// Xuất lớp thư viện (library class)
export * from "./Libary/AbstractLibrary.js";
export { Library };
// Xuất các interface
export * from "./Interface/Connection.js";
export * from "./Interface/Constants.js";
export * from "./Interface/Manager.js";
export * from "./Interface/Node.js";
export * from "./Interface/Player.js";
export * from "./Interface/Rest.js";
export * from "./Interface/Track.js";
// Xuất plugin
export * from "./Plugin/ZklinkPlugin.js";
export * from "./Plugin/SourceZklinkPlugin.js";
export { Plugin };
// Xuất driver
export * from "./Drivers/AbstractDriver.js";
export * from "./Drivers/Lavalink3.js";
export * from "./Drivers/Lavalink4.js";
export * from "./Drivers/Nodelink2.js";
// Xuất các tiện ích (utilities)
export * from "./Utilities/ZklinkDatabase.js";
export * from "./Utilities/ZklinkWebsocket.js";
// Xuất metadata
export * from "./metadata.js";
export const version = metadata.version;