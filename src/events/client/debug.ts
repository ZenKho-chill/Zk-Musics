import { Manager } from "../../manager.js";
import { log } from "../../utilities/LoggerHelper.js";

// Global heartbeat stats để tránh static reference issues
const heartbeatStats = {
  samples: [] as number[],
  lastAverage: 0,
  lastLogTime: 0,
  sampleCount: 0
};

// Helper functions
function handleHeartbeat(debugInfo: string): void {
  const latencyMatch = debugInfo.match(/latency of (\d+)ms/);
  if (!latencyMatch) return;

  const currentLatency = parseInt(latencyMatch[1]);
  const now = Date.now();

  // Thêm sample mới
  heartbeatStats.samples.push(currentLatency);
  heartbeatStats.sampleCount++;

  // Giữ tối đa 10 samples gần nhất
  if (heartbeatStats.samples.length > 10) {
    heartbeatStats.samples.shift();
  }

  // Tính average từ samples hiện tại
  const currentAverage = Math.round(
    heartbeatStats.samples.reduce((sum, val) => sum + val, 0) / heartbeatStats.samples.length
  );

  // Kiểm tra điều kiện log
  const shouldLog = shouldLogHeartbeat(currentLatency, currentAverage, now);
  
  if (shouldLog.log) {
    log.debug(shouldLog.message, "", {
      hiện_tại: currentLatency,
      trung_bình: currentAverage,
      xu_hướng: getLatencyTrend()
    });
    
    heartbeatStats.lastAverage = currentAverage;
    heartbeatStats.lastLogTime = now;
  }
}

function shouldLogHeartbeat(current: number, average: number, now: number): { log: boolean, message: string } {
  // Log đầu tiên sau khi khởi động
  if (heartbeatStats.sampleCount <= 3) {
    return { 
      log: true, 
      message: `Khởi tạo kết nối - Latency: ${current}ms (Mẫu: ${heartbeatStats.sampleCount}/3)` 
    };
  }

  // Log nếu latency thay đổi > 50ms so với average
  const deviation = Math.abs(current - average);
  if (deviation > 50) {
    return { 
      log: true, 
      message: `Latency bất thường - Hiện tại: ${current}ms, TB: ${average}ms (Chênh lệch: +${deviation}ms)` 
    };
  }

  // Log nếu average thay đổi > 30ms so với lần log trước
  const averageChange = Math.abs(average - heartbeatStats.lastAverage);
  if (averageChange > 30 && heartbeatStats.lastAverage > 0) {
    return { 
      log: true, 
      message: `Latency trung bình thay đổi - Trước: ${heartbeatStats.lastAverage}ms, Hiện tại: ${average}ms (${averageChange > 0 ? '+' : ''}${averageChange}ms)` 
    };
  }

  // Log định kỳ mỗi 10 phút để báo cáo trạng thái
  const timeSinceLastLog = now - heartbeatStats.lastLogTime;
  if (timeSinceLastLog > 600000) { // 10 phút
    return { 
      log: true, 
      message: `Báo cáo định kỳ - Latency TB: ${average}ms (${getStabilityStatus()})` 
    };
  }

  return { log: false, message: "" };
}

function getLatencyTrend(): string {
  const samples = heartbeatStats.samples;
  if (samples.length < 3) return "chưa_đủ_dữ_liệu";
  
  const first = samples.slice(0, Math.floor(samples.length / 2));
  const last = samples.slice(Math.floor(samples.length / 2));
  
  const firstAvg = first.reduce((sum, val) => sum + val, 0) / first.length;
  const lastAvg = last.reduce((sum, val) => sum + val, 0) / last.length;
  
  const diff = lastAvg - firstAvg;
  if (Math.abs(diff) < 10) return "ổn_định";
  return diff > 0 ? "tăng" : "giảm";
}

function getStabilityStatus(): string {
  const samples = heartbeatStats.samples;
  if (samples.length < 5) return "ổn_định";
  
  const max = Math.max(...samples);
  const min = Math.min(...samples);
  const range = max - min;
  
  if (range < 20) return "rất_ổn_định";
  if (range < 50) return "ổn_định"; 
  if (range < 100) return "dao_động_nhẹ";
  return "dao_động_mạnh";
}

export default class {
  async execute(client: Manager, debugInfo: string) {
    // Xử lý heartbeat logs thông minh
    if (debugInfo.includes("Heartbeat acknowledged")) {
      handleHeartbeat(debugInfo);
      return;
    }
    
    // Log các debug events khác
    if (debugInfo.includes("Preparing to connect") ||
        debugInfo.includes("Destroying") ||
        debugInfo.includes("Cleaning up") ||
        debugInfo.includes("Session limit") ||
        debugInfo.includes("Ready") ||
        debugInfo.includes("Shard")) {
      log.debug(debugInfo);
    }
  }
}
