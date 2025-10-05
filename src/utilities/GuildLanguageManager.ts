import { Manager } from "../manager.js";
import { Guild } from "discord.js";
import { mapDiscordLocaleToSupportedLanguage, getLanguageDisplayName, getDefaultLanguage } from "../languages/languageConfig.js";


/**
 * Utility class để quản lý ngôn ngữ guild
 */
export class GuildLanguageManager {
  
  /**
   * Tự động phát hiện và thiết lập ngôn ngữ cho guild
   * @param client Manager instance
   * @param guild Guild object
   * @param forceUpdate Có bắt buộc cập nhật ngay cả khi đã có ngôn ngữ
   * @returns Ngôn ngữ đã được thiết lập
   */
  static async setupGuildLanguage(
    client: Manager, 
    guild: Guild, 
    forceUpdate: boolean = false
  ): Promise<string> {
    try {
      // Kiểm tra xem guild đã có ngôn ngữ được set chưa
      const existingLanguage = await client.db.language.get(guild.id);
      if (existingLanguage && !forceUpdate) {
        // Log đã bị xóa - Guild đã có ngôn ngữ
        return existingLanguage;
      }

      // Lấy preferred_locale từ guild
      const guildLocale = guild.preferredLocale;
      const detectedLanguage = mapDiscordLocaleToSupportedLanguage(guildLocale);
      
      // Lưu ngôn ngữ vào database
      await client.db.language.set(guild.id, detectedLanguage);
      
      const action = existingLanguage ? "cập nhật" : "thiết lập";
      // Log đã bị xóa - Đã thiết lập/cập nhật ngôn ngữ cho guild
      
      return detectedLanguage;
      
    } catch (error) {
      // Log đã bị xóa - Lỗi khi thiết lập ngôn ngữ cho guild
      
      // Fallback về ngôn ngữ mặc định từ config
      const fallbackLanguage = getDefaultLanguage();
      await client.db.language.set(guild.id, fallbackLanguage);
      return fallbackLanguage;
    }
  }

  /**
   * Lấy ngôn ngữ hiện tại của guild
   * @param client Manager instance  
   * @param guildId Guild ID
   * @returns Mã ngôn ngữ
   */
  static async getGuildLanguage(client: Manager, guildId: string): Promise<string> {
    try {
      const language = await client.db.language.get(guildId);
      return language || getDefaultLanguage();
    } catch (error) {
      // Log đã bị xóa - Lỗi khi lấy ngôn ngữ guild
      return getDefaultLanguage();
    }
  }

  /**
   * Cập nhật ngôn ngữ cho guild
   * @param client Manager instance
   * @param guildId Guild ID
   * @param languageCode Mã ngôn ngữ mới
   * @returns Có thành công hay không
   */
  static async updateGuildLanguage(
    client: Manager, 
    guildId: string, 
    languageCode: string
  ): Promise<boolean> {
    try {
      await client.db.language.set(guildId, languageCode);
      // Log đã bị xóa - Đã cập nhật ngôn ngữ guild
      return true;
    } catch (error) {
      // Log đã bị xóa - Lỗi khi cập nhật ngôn ngữ guild
      return false;
    }
  }
}