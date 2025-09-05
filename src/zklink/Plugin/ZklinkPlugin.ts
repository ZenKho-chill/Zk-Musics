import { ZklinkPluginType } from "../Interface/Constants.js";
import { Zklink } from "../Zklink.js";

/** Lớp interface cho plugin Zklink khác, kế thừa để sử dụng */
export class ZklinkPlugin {
  /** Hàm trả về tên plugin (bắt buộc implement) */
  public name(): string {
    throw new Error("Plugin phải implement name() và trả về tên plugin");
  }

  /** Hàm trả về loại plugin (bắt buộc implement) */
  public type(): ZklinkPluginType {
    throw new Error(
      'Plugin phải implement type() và trả về "sourceResolver" hoặc "default"'
    );
  }

  /** Hàm load để kích hoạt plugin (bắt buộc implement) */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public load(manager: Zklink): void {
    throw new Error("Plugin phải implement load()");
  }

  /** Hàm unload để dừng plugin (bắt buộc implement) */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public unload(manager: Zklink): void {
    throw new Error("Plugin phải implement unload()");
  }
}
