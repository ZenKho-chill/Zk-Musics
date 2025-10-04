import { LavalinkHeaderService } from "../services/LavalinkHeaderService.js";
import { Headers } from "../@types/Lavalink.js";

/**
 * Utility helper để tạo Lavalink headers dễ dàng
 * Sử dụng singleton service để tự động hóa User-Id
 */
export class LavalinkHeaderHelper {
  /**
   * Tạo headers chuẩn cho Lavalink với User-Id tự động
   * @param authorization - Password/token xác thực
   * @param customUserId - Tùy chọn: Custom User-Id thay vì auto-detect
   * @returns Headers object hoàn chỉnh
   */
  static createHeaders(authorization: string, customUserId?: string): Headers {
    const service = LavalinkHeaderService.getInstance();
    return service.createHeaders(authorization, customUserId);
  }

  /**
   * Tạo headers với thông tin debug chi tiết
   * @param authorization - Password/token xác thực  
   * @param customUserId - Tùy chọn: Custom User-Id
   * @returns Object chứa headers và debug info
   */
  static createHeadersWithDebug(authorization: string, customUserId?: string) {
    const service = LavalinkHeaderService.getInstance();
    return service.createHeadersWithDebug(authorization, customUserId);
  }

  /**
   * Lấy User-Id hiện tại của bot
   * @returns User-Id string hoặc undefined
   */
  static getCurrentUserId(): string | undefined {
    const service = LavalinkHeaderService.getInstance();
    return service.getCurrentUserId();
  }

  /**
   * Kiểm tra xem bot đã sẵn sàng chưa
   * @returns true nếu có thể lấy được User-Id
   */
  static isReady(): boolean {
    const service = LavalinkHeaderService.getInstance();
    return service.isReady();
  }

  /**
   * Tạo headers WSS cho WebSocket connection
   * @param authorization - Password/token xác thực
   * @param customUserId - Tùy chọn: Custom User-Id
   * @returns Headers object cho WebSocket
   */
  static createWSHeaders(authorization: string, customUserId?: string) {
    const headers = this.createHeaders(authorization, customUserId);
    
    // Convert để dùng cho WebSocket headers
    return {
      'Authorization': headers.Authorization,
      'User-Id': headers['User-Id'],
      'Client-Name': headers['Client-Name'],
      'User-Agent': headers['User-Agent'],
      'Resume-Key': headers['Resume-Key'],
    };
  }
}