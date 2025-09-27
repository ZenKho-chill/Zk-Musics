/**
 * Language Helper Utility
 * Provides easy-to-use methods for accessing localized strings với cấu trúc client/server mới
 */

import { Manager } from "../manager.js";
import { SupportedLocale, LanguageSection, LanguageContext, BaseSectionName } from "../@types/Language.js";
import { I18nArgs } from "@hammerhq/localization";

export class LanguageHelper {
  private client: Manager;
  private locale: SupportedLocale;

  constructor(client: Manager, locale: SupportedLocale = 'en') {
    this.client = client;
    this.locale = locale;
  }

  /**
   * Get localized string với cấu trúc client/server mới
   */
  public get(context: LanguageContext, section: BaseSectionName, key: string, args?: I18nArgs): string {
    const fullSection = `${context}.${section}` as LanguageSection;
    return this.client.i18n.get(this.locale, fullSection, key, args);
  }

  /**
   * Get nested key using dot notation
   */
  public getNested(context: LanguageContext, section: BaseSectionName, keyPath: string, args?: I18nArgs): string {
    const fullSection = `${context}.${section}` as LanguageSection;
    return this.client.i18n.getNested(this.locale, fullSection, keyPath, args);
  }

  /**
   * Get client error message
   */
  public error(key: string, args?: I18nArgs): string {
    return this.get('client', 'errors', key, args);
  }

  /**
   * Get client UI message
   */
  public ui(key: string, args?: I18nArgs): string {
    return this.get('client', 'ui', key, args);
  }

  /**
   * Get server validation message
   */
  public validation(key: string, args?: I18nArgs): string {
    return this.get('server', 'validation', key, args);
  }

  /**
   * Get client message
   */
  public message(key: string, args?: I18nArgs): string {
    return this.get('client', 'messages', key, args);
  }

  /**
   * Get client command message
   */
  public command(category: string, key: string, args?: I18nArgs): string {
    return this.getNested('client', 'commands', `${category}.${key}`, args);
  }

  /**
   * Get server handler message
   */
  public handler(type: string, key: string, args?: I18nArgs): string {
    return this.getNested('server', 'handlers', `${type}.${key}`, args);
  }

  /**
   * Get server service message
   */
  public service(service: string, key: string, args?: I18nArgs): string {
    return this.getNested('server', 'services', `${service}.${key}`, args);
  }

  /**
   * Get server event message
   */
  public event(type: string, key: string, args?: I18nArgs): string {
    return this.getNested('server', 'events', `${type}.${key}`, args);
  }

  /**
   * Check if key exists với cấu trúc mới
   */
  public hasKey(context: LanguageContext, section: BaseSectionName, key: string): boolean {
    const fullSection = `${context}.${section}` as LanguageSection;
    return this.client.i18n.hasKey(this.locale, fullSection, key);
  }

  /**
   * Set locale
   */
  public setLocale(locale: SupportedLocale): void {
    this.locale = locale;
  }

  /**
   * Get current locale
   */
  public getLocale(): SupportedLocale {
    return this.locale;
  }

  /**
   * Create a new instance with different locale
   */
  public withLocale(locale: SupportedLocale): LanguageHelper {
    return new LanguageHelper(this.client, locale);
  }
}

/**
 * Create language helper instance
 */
export function createLanguageHelper(client: Manager, locale: SupportedLocale = 'en'): LanguageHelper {
  return new LanguageHelper(client, locale);
}

/**
 * Quick access to common error messages
 */
export const CommonErrors = {
  PERMISSION_DENIED: 'permission_denied',
  USER_NOT_AUTHORIZED: 'user_not_authorized', 
  FEATURE_DISABLED: 'feature_disabled',
  INVALID_INPUT: 'invalid_input',
  RATE_LIMITED: 'rate_limited',
  DATABASE_ERROR: 'database_error',
  LAVALINK_ERROR: 'lavalink_error',
  NETWORK_ERROR: 'network_error',
  TIMEOUT_ERROR: 'timeout_error',
  UNKNOWN_ERROR: 'unknown_error'
} as const;

/**
 * Quick access to common messages
 */
export const CommonMessages = {
  LOADING: 'loading',
  PROCESSING: 'processing', 
  SUCCESS: 'success',
  CANCELLED: 'cancelled',
  TIMEOUT: 'timeout',
  EMPTY_CONTENT: 'empty_content',
  CONFIRMATION_REQUIRED: 'confirmation_required',
  OPERATION_COMPLETED: 'operation_completed',
  OPERATION_FAILED: 'operation_failed',
  PLEASE_WAIT: 'please_wait'
} as const;