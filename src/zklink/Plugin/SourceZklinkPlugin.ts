import {
  ZklinkSearchOptions,
  ZklinkSearchResult,
} from "../Interface/Manager.js";
import { ZklinkPlugin } from "./ZklinkPlugin.js";

/** Lớp interface cho plugin resolver track, kế thừa để sử dụng */
export class SourceZklinkPlugin extends ZklinkPlugin {
  /**
   * Hàm sourceName để plugin đăng ký engine tìm kiếm.
   * Plugin sẽ khả dụng để tìm kiếm khi đặt nguồn làm mặc định.
   * @returns string
   */
  public sourceName(): string {
    throw new Error("Plugin nguồn phải implement sourceName() và trả về chuỗi");
  }

  /**
   * Hàm sourceIdentify để plugin đăng ký engine tìm kiếm.
   * Plugin sẽ khả dụng để tìm kiếm khi đặt nguồn làm mặc định.
   * @returns string
   */
  public sourceIdentify(): string {
    throw new Error(
      "Plugin nguồn phải implement sourceIdentify() và trả về chuỗi"
    );
  }

  /**
   * Hàm directSearchChecker kiểm tra xem query có chứa tham số directSearch hay không.
   * @returns boolean
   */
  public directSearchChecker(query: string): boolean {
    const directSearchRegex = /directSearch=(.*)/;
    const isDirectSearch = directSearchRegex.exec(query);
    return isDirectSearch == null;
  }

  /**
   * Hàm searchDirect cho phép plugin tìm kiếm trực tiếp mà không fallback.
   * Điều này giúp tránh chồng lấp trong hàm tìm kiếm.
   * @returns ZklinkSearchResult
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async searchDirect(
    query: string,
    options?: ZklinkSearchOptions
  ): Promise<ZklinkSearchResult> {
    throw new Error(
      "Plugin nguồn phải implement searchDirect() và trả về ZklinkSearchResult"
    );
  }
}
