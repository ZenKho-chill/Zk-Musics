import { Manager } from "../../manager.js";
import { ZklinkNode } from "../../Zklink/main.js";
import { log } from "../../utilities/LoggerHelper.js";

// Global để track cleanup đã chạy cho node nào
const cleanupExecuted = new Set<string>();

export default class {
  execute(client: Manager, node: ZklinkNode, code: number, reason: Buffer) {
    const nodeId = node.options.name;
    
    // Chỉ cleanup một lần duy nhất cho mỗi disconnect session
    if (cleanupExecuted.has(nodeId)) {
      return;
    }
    
    cleanupExecuted.add(nodeId);
    
    // Cleanup players với error handling
    let cleanupCount = 0;
    client.Zklink.players.forEach(async (player, index) => {
      if (player.node.options.name == node.options.name) {
        try {
          await player.destroy();
          cleanupCount++;
        } catch (error) {
          log.error("Destroy player", `Lỗi tại player: ${player.guildId}`, error as Error);
        }
      }
    });
    
    log.info("Node disconnected cleanup", `Node: ${nodeId} | Cleanup ${cleanupCount} players`);
    
    // Clear cleanup flag sau 60 giây để cho phép cleanup cho disconnect session mới
    setTimeout(() => {
      cleanupExecuted.delete(nodeId);
    }, 60000);
  }
}
