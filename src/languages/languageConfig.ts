/**
 * Cấu hình ngôn ngữ cho bot với cấu trúc client/server mới
 * File này chứa danh sách các ngôn ngữ được hỗ trợ và tên hiển thị của chúng
 * 
 * Cấu trúc mới:
 * - languages/en/client/ - Giao diện người dùng (commands, errors, messages, ui)
 * - languages/en/server/ - Hệ thống nội bộ (events, handlers, services, validation)
 * - languages/vi/client/ - Tương tự cho tiếng Việt
 * - languages/vi/server/ - Tương tự cho tiếng Việt
 */

import { ConfigData } from "../services/ConfigData.js";

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

/**
 * Danh sách các ngôn ngữ được bot hỗ trợ
 * Thêm ngôn ngữ mới vào đây khi cần mở rộng
 */
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: "vi",
    name: "Tiếng Việt",
    nativeName: "Vietnamese",
    flag: "🇻🇳"
  },
  {
    code: "en", 
    name: "Tiếng Anh",
    nativeName: "English",
    flag: "🇺🇸"
  }
];

/**
 * Lấy thông tin ngôn ngữ theo mã
 */
export function getLanguageInfo(code: string): LanguageInfo | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Lấy tên hiển thị của ngôn ngữ
 */
export function getLanguageDisplayName(code: string): string {
  const lang = getLanguageInfo(code);
  if (!lang) return code;
  
  return `${lang.name} (${lang.nativeName})${lang.flag ? ' ' + lang.flag : ''}`;
}

/**
 * Lấy danh sách tất cả mã ngôn ngữ
 */
export function getLanguageCodes(): string[] {
  return SUPPORTED_LANGUAGES.map(lang => lang.code);
}

/**
 * Kiểm tra xem ngôn ngữ có được hỗ trợ hay không
 */
export function isLanguageSupported(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}

/**
 * Lấy ngôn ngữ mặc định của bot từ config
 */
export function getDefaultLanguage(): string {
  const config = new ConfigData().data;
  return config.bot.LANGUAGE || "en"; // Fallback về "vi" nếu config không có
}

/**
 * Chuyển đổi Discord locale thành mã ngôn ngữ được hỗ trợ
 * @param discordLocale Discord locale (ví dụ: "vi", "en-US", "ja", etc.)
 * @returns Mã ngôn ngữ được hỗ trợ hoặc ngôn ngữ mặc định
 */
export function mapDiscordLocaleToSupportedLanguage(discordLocale: string): string {
  if (!discordLocale) return getDefaultLanguage();
  
  // Chuyển về lowercase để so sánh
  const locale = discordLocale.toLowerCase();
  
  // Mapping các Discord locale thành ngôn ngữ được hỗ trợ
  const localeMapping: { [key: string]: string } = {
    // Tiếng Việt
    "vi": "vi",
    
    // Tiếng Anh (tất cả variants)
    "en": "en",
    "en-us": "en",
    "en-gb": "en", 
    "en-au": "en",
    "en-ca": "en",
    
    // Các ngôn ngữ khác sẽ fallback về default
  };
  
  // Kiểm tra exact match trước
  if (localeMapping[locale]) {
    return localeMapping[locale];
  }
  
  // Kiểm tra theo language code (phần trước dấu -)
  const languageCode = locale.split('-')[0];
  if (localeMapping[languageCode]) {
    return localeMapping[languageCode];
  }
  
  // Fallback về ngôn ngữ mặc định
  return getDefaultLanguage();
}

/**
 * Các context được hỗ trợ trong cấu trúc mới
 */
export const SUPPORTED_CONTEXTS = ['client', 'server'] as const;

/**
 * Các section được hỗ trợ cho từng context
 */
export const CONTEXT_SECTIONS = {
  client: ['commands', 'errors', 'messages', 'ui', 'user-facing'],
  server: ['events', 'handlers', 'services', 'internal', 'validation']
} as const;

/**
 * Kiểm tra context có hợp lệ không
 */
export function isValidContext(context: string): context is 'client' | 'server' {
  return SUPPORTED_CONTEXTS.includes(context as any);
}

/**
 * Kiểm tra section có hợp lệ cho context không
 */
export function isValidSectionForContext(context: 'client' | 'server', section: string): boolean {
  const validSections = CONTEXT_SECTIONS[context] as readonly string[];
  return validSections.includes(section);
}

/**
 * Lấy đường dẫn file language đầy đủ
 */
export function getLanguageFilePath(locale: string, context: 'client' | 'server', section: string): string {
  return `languages/${locale}/${context}/${section}`;
}