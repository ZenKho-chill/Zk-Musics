import { Manager } from "../manager.js";
import { Headers, createLavalinkHeaders } from "../@types/Lavalink.js";

/**
 * Service quản lý việc tự động tạo headers cho Lavalink
 * Loại bỏ hardcode User-Id và tự động lấy từ bot client
 */
export class LavalinkHeaderService {
  private static instance: LavalinkHeaderService;
  private manager?: Manager;

  private constructor() {}

  /**
   * Lấy instance singleton của service
   */
  public static getInstance(): LavalinkHeaderService {
    if (!LavalinkHeaderService.instance) {
      LavalinkHeaderService.instance = new LavalinkHeaderService();
    }
    return LavalinkHeaderService.instance;
  }

  /**
   * Khởi tạo service với Manager instance
   */
  public initialize(manager: Manager): void {
    this.manager = manager;
  }

  /**
   * Tự động tạo headers với User-Id được lấy từ bot client
   * @param authorization - Password/token xác thực cho Lavalink
   * @param customUserId - Tùy chọn: Custom User-Id thay vì auto-detect
   * @returns Headers object hoàn chỉnh
   */
  public createHeaders(authorization: string, customUserId?: string): Headers {
    if (!this.manager) {
      throw new Error("LavalinkHeaderService chưa được khởi tạo với Manager instance");
    }

    // Ưu tiên: customUserId -> Zklink.id -> client.user.id -> fallback
    const userId = customUserId || 
                   this.manager.Zklink?.id || 
                   this.manager.user?.id || 
                   "unknown";

    return createLavalinkHeaders(authorization, userId);
  }

  /**
   * Lấy User-Id hiện tại của bot
   * @returns User-Id string hoặc undefined nếu chưa sẵn sàng
   */
  public getCurrentUserId(): string | undefined {
    if (!this.manager) return undefined;
    
    return this.manager.Zklink?.id || this.manager.user?.id;
  }

  /**
   * Kiểm tra xem bot đã sẵn sàng và có User-Id chưa
   * @returns true nếu User-Id có sẵn
   */
  public isReady(): boolean {
    return !!this.getCurrentUserId();
  }

  /**
   * Tạo headers với thông tin debug
   * @param authorization - Password/token xác thực
   * @param customUserId - Tùy chọn: Custom User-Id
   * @returns Object chứa headers và thông tin debug
   */
  public createHeadersWithDebug(authorization: string, customUserId?: string): {
    headers: Headers;
    debug: {
      userId: string;
      source: 'custom' | 'zklink' | 'client' | 'fallback';
      isReady: boolean;
    };
  } {
    if (!this.manager) {
      throw new Error("LavalinkHeaderService chưa được khởi tạo với Manager instance");
    }

    let userId: string;
    let source: 'custom' | 'zklink' | 'client' | 'fallback';

    if (customUserId) {
      userId = customUserId;
      source = 'custom';
    } else if (this.manager.Zklink?.id) {
      userId = this.manager.Zklink.id;
      source = 'zklink';
    } else if (this.manager.user?.id) {
      userId = this.manager.user.id;
      source = 'client';
    } else {
      userId = 'unknown';
      source = 'fallback';
    }

    const headers = createLavalinkHeaders(authorization, userId);

    return {
      headers,
      debug: {
        userId,
        source,
        isReady: this.isReady(),
      },
    };
  }
}