import { Manager } from "../../manager.js";
import { log } from "../../utilities/LoggerHelper.js";

export default class {
  async execute(client: Manager, debugInfo: string) {
    // Chỉ log debug cho các thông tin quan trọng, không log tất cả
    if (debugInfo.includes("Heartbeat") || 
        debugInfo.includes("Preparing to connect") ||
        debugInfo.includes("Destroying") ||
        debugInfo.includes("Cleaning up")) {
      log.debug("Discord client debug", debugInfo);
    }
  }
}
