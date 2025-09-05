export class ZklinkDatabase<G = unknown> {
  protected cache: Record<string, G> = {};

  /**
   * Lấy dữ liệu từ cơ sở dữ liệu
   * @param key khóa của dữ liệu
   * @returns D hoặc undefined nếu không tìm thấy
   */
  get<D = G>(key: string): D | undefined {
    return (this.cache[key] as unknown as D) ?? undefined;
  }

  /**
   * Xóa dữ liệu khỏi cơ sở dữ liệu và trả về dữ liệu đã xóa
   * @param key khóa của dữ liệu
   * @returns D dữ liệu đã bị xóa hoặc undefined nếu không tồn tại
   */
  delete<D = G>(key: string): D | undefined {
    const data = (this.cache[key] as unknown as D) ?? undefined;
    delete this.cache[key];
    return data;
  }

  /**
   * Xóa tất cả dữ liệu trong cơ sở dữ liệu
   */
  clear(): void {
    this.cache = {};
  }

  /**
   * Thiết lập/ghi dữ liệu vào cơ sở dữ liệu
   * @param key khóa bạn muốn thiết lập
   * @param data dữ liệu cho khóa đó
   * @returns D dữ liệu vừa được ghi
   */
  set<D = G>(key: string, data: D): D | undefined {
    this.cache[key] = data as unknown as G;
    return data;
  }

  /**
   * Lấy số lượng phần tử hiện có trong cơ sở dữ liệu
   * @returns number
   */
  get size(): number {
    return Object.keys(this.cache).length;
  }

  /**
   * Lấy tất cả giá trị hiện có trong cơ sở dữ liệu
   * @returns G[]
   */
  get values(): G[] {
    return Object.values(this.cache);
  }

  /**
   * Lấy tất cả cặp [khóa, giá trị] hiện có trong cơ sở dữ liệu
   * @returns [string, G][]
   */
  get full(): [string, G][] {
    const finalRes: [string, G][] = [];
    const keys = Object.keys(this.cache);
    const values = Object.values(this.cache);
    for (let i = 0; i < keys.length; i++) {
      finalRes.push([keys[i], values[i]]);
    }
    return finalRes;
  }
  forEach(callback: (value: G, key: string) => unknown): void {
    for (const data of this.full) {
      callback(data[1], data[0]);
    }
  }
}
