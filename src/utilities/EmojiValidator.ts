/**
 * Utility để validate emoji trước khi sử dụng trong Discord components
 */
export class EmojiValidator {
  /**
   * Test xem bot có thể sử dụng emoji không bằng cách thử tạo một message tạm
   * @param client - Discord client instance
   * @param emoji - Emoji string để test
   * @returns Promise<boolean> - true nếu có quyền truy cập
   */
  static async canAccessEmoji(client: any, emoji: string): Promise<boolean> {
    try {
      if (!emoji || emoji.trim() === "") return false;

      // Unicode emoji luôn available
      const unicodeEmojiRegex = /^[\p{Emoji}]$/u;
      if (unicodeEmojiRegex.test(emoji)) return true;

      // Parse custom emoji
      const customEmojiRegex = /^<(a?):([^:]+):(\d+)>$/;
      const match = emoji.match(customEmojiRegex);
      
      if (!match) return false;
      
      const [, animated, name, id] = match;
      
      // Kiểm tra emoji có trong cache của bot không
      const emojiFromCache = client.emojis.cache.get(id);
      if (emojiFromCache) return true;

      // Nếu không có trong cache, có thể là emoji từ server khác
      // Bot chỉ có thể dùng emoji từ server mà nó có mặt
      return false;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Safely get emoji cho Button với kiểm tra quyền truy cập
   * @param client - Discord client instance
   * @param emoji - Emoji string
   * @param fallback - Fallback emoji
   * @returns Promise<emoji object hoặc fallback hoặc null để bỏ emoji>
   */
  static async safeEmojiForButton(
    client: any,
    emoji: string,
    fallback: string = "❓",
    removeIfNoAccess: boolean = false
  ): Promise<string | { id: string; name: string; animated?: boolean } | null> {
    try {
      if (!emoji || emoji.trim() === "") {
        return removeIfNoAccess ? null : fallback;
      }

      // Kiểm tra quyền truy cập
      const canAccess = await this.canAccessEmoji(client, emoji);
      
      if (!canAccess) {
        // Nếu không có quyền truy cập và yêu cầu xóa emoji
        if (removeIfNoAccess) return null;
        // Nếu không thì dùng fallback
        return fallback;
      }

      // Nếu có quyền truy cập, parse emoji
      const unicodeEmojiRegex = /^[\p{Emoji}]$/u;
      if (unicodeEmojiRegex.test(emoji)) return emoji;

      // Parse custom emoji
      const customEmojiRegex = /^<(a?):([^:]+):(\d+)>$/;
      const match = emoji.match(customEmojiRegex);

      if (match) {
        const [, animated, name, id] = match;
        
        const result: { id: string; name: string; animated?: boolean } = {
          id: id,
          name: name,
        };

        if (animated === "a") {
          result.animated = true;
        }

        return result;
      }

      return removeIfNoAccess ? null : fallback;
    } catch (error) {
      return removeIfNoAccess ? null : fallback;
    }
  }

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
   * Safely get custom emoji for Button components với extra validation
   * @param emoji - Custom emoji string
   * @param fallback - Fallback unicode emoji
   * @returns emoji object hoặc fallback an toàn
   */
  static safeCustomEmojiForButton(
    emoji: string,
    fallback: string = "❓"
  ): string | { id: string; name: string; animated?: boolean } {
    try {
      if (!emoji || emoji.trim() === "") return fallback;

      // Nếu là unicode emoji, trả về ngay
      const unicodeEmojiRegex = /^[\p{Emoji}]$/u;
      if (unicodeEmojiRegex.test(emoji)) return emoji;

      // Parse custom emoji
      const customEmojiRegex = /^<(a?):([^:]+):(\d+)>$/;
      const match = emoji.match(customEmojiRegex);

      if (match) {
        const [, animated, name, id] = match;
        
        // Validation nghiêm ngặt hơn
        if (!name || name.length === 0 || name.length > 32) return fallback;
        if (!id || !/^\d{17,20}$/.test(id)) return fallback; // Discord snowflake ID format
        
        const result: { id: string; name: string; animated?: boolean } = {
          id: id,
          name: name,
        };

        if (animated === "a") {
          result.animated = true;
        }

        return result;
      }

      // Nếu không match format nào, return fallback
      return fallback;
    } catch (error) {
      // Nếu có lỗi gì, luôn return fallback
      return fallback;
    }
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
