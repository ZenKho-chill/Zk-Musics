/**
 * Language Helper Utility
 * Provides easy-to-use methods for accessing localized strings
 */

import { Manager } from "../manager.js";
import { SupportedLocale, LanguageSection } from "../@types/Language.js";
import { I18nArgs } from "@hammerhq/localization";

export class LanguageHelper {
  private client: Manager;
  private locale: SupportedLocale;

  constructor(client: Manager, locale: SupportedLocale = 'en') {
    this.client = client;
    this.locale = locale;
  }

  /**
   * Get localized string
   */
  public get(section: LanguageSection, key: string, args?: I18nArgs): string {
    return this.client.i18n.get(this.locale, section, key, args);
  }

  /**
   * Get nested key using dot notation
   */
  public getNested(section: LanguageSection, keyPath: string, args?: I18nArgs): string {
    return this.client.i18n.getNested(this.locale, section, keyPath, args);
  }

  /**
   * Get error message
   */
  public error(key: string, args?: I18nArgs): string {
    return this.get('errors', key, args);
  }

  /**
   * Get UI message
   */
  public ui(key: string, args?: I18nArgs): string {
    return this.get('ui', key, args);
  }

  /**
   * Get validation message
   */
  public validation(key: string, args?: I18nArgs): string {
    return this.get('validation', key, args);
  }

  /**
   * Get common message
   */
  public message(key: string, args?: I18nArgs): string {
    return this.get('messages', key, args);
  }

  /**
   * Get command message
   */
  public command(category: string, key: string, args?: I18nArgs): string {
    return this.getNested('commands', `${category}.${key}`, args);
  }

  /**
   * Get handler message
   */
  public handler(type: string, key: string, args?: I18nArgs): string {
    return this.getNested('handlers', `${type}.${key}`, args);
  }

  /**
   * Get service message
   */
  public service(service: string, key: string, args?: I18nArgs): string {
    return this.getNested('services', `${service}.${key}`, args);
  }

  /**
   * Get event message
   */
  public event(type: string, key: string, args?: I18nArgs): string {
    return this.getNested('events', `${type}.${key}`, args);
  }

  /**
   * Check if key exists
   */
  public hasKey(section: LanguageSection, key: string): boolean {
    return this.client.i18n.hasKey(this.locale, section, key);
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