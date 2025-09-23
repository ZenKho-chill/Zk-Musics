import { I18n, I18nArgs, I18nOptions } from "@hammerhq/localization";

export class Localization extends I18n {
  constructor(options: I18nOptions) {
    super(options);
  }

  /**
   * Get localized string with improved fallback support and new structure
   * @param locale Target locale (e.g., 'vi', 'en')
   * @param section Section name (e.g., 'client.commands', 'server.services')
   * @param key Key path (supports nested keys with dot notation, e.g., 'music.play.description')
   * @param args Arguments for string interpolation
   */
  public get(locale: string, section: string, key: string, args?: I18nArgs | undefined): string {
    try {
      // Try to get the string from the requested locale
      const currentString = super.get(locale, section, key, args);
      
      // Check if the result is an error message
      const locateErr = `Locale '${locale}' not found.`;
      const sectionErr = `Section '${section}' not found in locale '${locale}'`;
      const keyErr = `Key '${key}' not found in section ${section} in locale '${locale}'`;
      
      if (currentString === locateErr || currentString === sectionErr || currentString === keyErr) {
        // Fallback to English
        const fallbackString = super.get("en", section, key, args);
        
        // If English also fails, try common section
        if (fallbackString === `Key '${key}' not found in section ${section} in locale 'en'`) {
          return this.getFromCommon(key, args) || `[Missing: ${section}.${key}]`;
        }
        
        return fallbackString;
      }
      
      return currentString;
    } catch (error) {
      // If everything fails, try common section or return a fallback
      return this.getFromCommon(key, args) || `[Error: ${section}.${key}]`;
    }
  }

  /**
   * Get string from client or server sections with improved fallback
   * @param locale Target locale
   * @param context 'client' or 'server'
   * @param section Section name within context
   * @param key Key to look for
   * @param args Arguments for string interpolation
   */
  public getByContext(locale: string, context: 'client' | 'server', section: string, key: string, args?: I18nArgs): string {
    // Try direct path first
    const directPath = `${context}.${section}`;
    try {
      const result = this.get(locale, directPath, key, args);
      if (!this.isErrorMessage(result)) {
        return result;
      }
    } catch {
      // Continue to fallback
    }

    // Try fallback in same context but different section
    const contextSections = this.getContextSections(context);
    for (const fallbackSection of contextSections) {
      if (fallbackSection === section) continue;
      
      try {
        const fallbackPath = `${context}.${fallbackSection}`;
        const result = this.get(locale, fallbackPath, key, args);
        if (!this.isErrorMessage(result)) {
          return result;
        }
      } catch {
        continue;
      }
    }

    // Try opposite context as last resort
    const oppositeContext = context === 'client' ? 'server' : 'client';
    const oppositeSections = this.getContextSections(oppositeContext);
    for (const oppositeSection of oppositeSections) {
      try {
        const oppositePath = `${oppositeContext}.${oppositeSection}`;
        const result = this.get(locale, oppositePath, key, args);
        if (!this.isErrorMessage(result)) {
          return result;
        }
      } catch {
        continue;
      }
    }

    return `[Missing: ${context}.${section}.${key}]`;
  }

  /**
   * Check if a result is an error message
   */
  private isErrorMessage(result: string): boolean {
    return result.includes('not found') || result.startsWith('[') || result.includes('Error:');
  }

  /**
   * Get available sections for a context
   */
  private getContextSections(context: 'client' | 'server'): string[] {
    if (context === 'client') {
      return ['commands', 'ui', 'messages', 'errors', 'user-facing'];
    } else {
      return ['services', 'events', 'handlers', 'internal', 'validation'];
    }
  }

  /**
   * Get string from common section (backward compatibility)
   * @param key Key to look for in common sections
   * @param args Arguments for string interpolation
   */
  private getFromCommon(key: string, args?: I18nArgs): string | null {
    // Try client sections first (more user-visible)
    const clientSections = ['client.errors', 'client.messages', 'client.ui'];
    
    for (const section of clientSections) {
      try {
        const result = super.get("en", section, key, args);
        if (!result.includes("not found")) {
          return result;
        }
      } catch {
        continue;
      }
    }
    
    // Try server sections as fallback
    const serverSections = ['server.validation', 'server.internal'];
    for (const section of serverSections) {
      try {
        const result = super.get("en", section, key, args);
        if (!result.includes("not found")) {
          return result;
        }
      } catch {
        continue;
      }
    }
    
    return null;
  }

  /**
   * Get nested key using dot notation
   * @param locale Target locale
   * @param section Section name
   * @param keyPath Nested key path (e.g., 'player_buttons.play_resumed')
   * @param args Arguments for string interpolation
   */
  public getNested(locale: string, section: string, keyPath: string, args?: I18nArgs): string {
    const keys = keyPath.split('.');
    let currentKey = keys[0];
    let remainingPath = keys.slice(1).join('.');
    
    if (remainingPath) {
      // This is a nested key, try to get the parent object first
      try {
        const parentObject = super.get(locale, section, currentKey);
        if (typeof parentObject === 'object' && parentObject !== null) {
          return this.getNestedFromObject(parentObject, remainingPath, args) || 
                 this.get(locale, section, keyPath, args);
        }
      } catch {
        // Fall back to regular get method
      }
    }
    
    return this.get(locale, section, keyPath, args);
  }

  /**
   * Extract nested value from object
   */
  private getNestedFromObject(obj: any, path: string, args?: I18nArgs): string | null {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    
    if (typeof current === 'string') {
      return this.interpolate(current, args);
    }
    
    return null;
  }

  /**
   * Simple string interpolation
   */
  private interpolate(template: string, args?: I18nArgs): string {
    if (!args) return template;
    
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return args[key]?.toString() || match;
    });
  }

  /**
   * Check if a key exists in the locale
   */
  public hasKey(locale: string, section: string, key: string): boolean {
    try {
      const result = super.get(locale, section, key);
      return !result.includes("not found");
    } catch {
      return false;
    }
  }

  /**
   * Get available locales
   */
  public getAvailableLocales(): string[] {
    // This would need to be implemented based on your file structure
    return ['en', 'vi'];
  }
}
