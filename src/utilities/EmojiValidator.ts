/**
 * Utility để validate emoji trước khi sử dụng trong Discord components
 */
export class EmojiValidator {
  /**
   * Kiểm tra xem emoji string có hợp lệ không
   * @param emoji - Emoji string (có thể là unicode hoặc custom emoji)
   * @returns true nếu hợp lệ
   */
  static isValidEmoji(emoji: string): boolean {
    if (!emoji || emoji.trim() === "") return false;

    // Kiểm tra unicode emoji (ví dụ: 🎵, 🎶)
    const unicodeEmojiRegex = /^[\p{Emoji}]$/u;
    if (unicodeEmojiRegex.test(emoji)) return true;

    // Kiểm tra custom emoji format: <:name:id> hoặc <a:name:id>
    const customEmojiRegex = /^<(a?):([^:]+):(\d+)>$/;
    const match = emoji.match(customEmojiRegex);

    if (match) {
      const [, animated, name, id] = match;
      // Kiểm tra name không rỗng và id là số hợp lệ
      return name.length > 0 && id.length > 0 && /^\d+$/.test(id);
    }

    return false;
  }

  /**
   * Safely set emoji cho Button hoặc SelectMenu
   * @param emoji - Emoji string
   * @param fallback - Fallback emoji nếu original không hợp lệ
   * @returns emoji string hợp lệ hoặc fallback
   */
  static safeEmoji(emoji: string, fallback: string = "❓"): string {
    if (!emoji) return fallback;
    return this.isValidEmoji(emoji) ? emoji : fallback;
  }

  /**
   * Get emoji object for Discord.js Button/SelectMenu components
   * @param emoji - Emoji string
   * @param fallback - Fallback emoji nếu original không hợp lệ
   * @returns emoji object cho Discord.js hoặc fallback
   */
  static getEmojiForComponent(
    emoji: string,
    fallback: string = "❓"
  ): string | { id: string; name: string; animated?: boolean } | null {
    if (!emoji) return fallback;

    if (!this.isValidEmoji(emoji)) return fallback;

    // Nếu là unicode emoji, trả về string
    const unicodeEmojiRegex = /^[\p{Emoji}]$/u;
    if (unicodeEmojiRegex.test(emoji)) return emoji;

    // Nếu là custom emoji, parse thành object
    const customEmoji = this.parseCustomEmoji(emoji);
    if (customEmoji) {
      // Chỉ return object với id và name, không có animated nếu là false
      const result: { id: string; name: string; animated?: boolean } = {
        id: customEmoji.id,
        name: customEmoji.name,
      };

      // Chỉ thêm animated nếu true
      if (customEmoji.animated) {
        result.animated = true;
      }

      return result;
    }

    return fallback;
  }

  /**
   * Parse custom emoji thành object
   * @param emoji - Custom emoji string
   * @returns object với animated, name, id hoặc null nếu không hợp lệ
   */
  static parseCustomEmoji(emoji: string): { animated: boolean; name: string; id: string } | null {
    const customEmojiRegex = /^<(a?):([^:]+):(\d+)>$/;
    const match = emoji.match(customEmojiRegex);

    if (match) {
      const [, animated, name, id] = match;
      return {
        animated: animated === "a",
        name,
        id,
      };
    }
    return null;
  }
}
