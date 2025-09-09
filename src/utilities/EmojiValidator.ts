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
        animated: animated === 'a',
        name,
        id
      };
    }
    
    return null;
  }
}
