/**
 * Language system type definitions
 */

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

/**
 * Language section categories
 */
export type LanguageSection = 
  | 'commands'
  | 'events' 
  | 'handlers'
  | 'services'
  | 'errors'
  | 'messages'
  | 'ui'
  | 'validation';

/**
 * Supported locales
 */
export type SupportedLocale = 'en' | 'vi';

/**
 * Language key paths for type safety
 */
export interface LanguageKeys {
  // Common keys
  common: {
    errors: {
      permission_denied: string;
      user_not_authorized: string;
      feature_disabled: string;
      invalid_input: string;
      rate_limited: string;
      database_error: string;
      lavalink_error: string;
      network_error: string;
      timeout_error: string;
      unknown_error: string;
    };
    messages: {
      loading: string;
      processing: string;
      success: string;
      cancelled: string;
      timeout: string;
      empty_content: string;
      confirmation_required: string;
      operation_completed: string;
      operation_failed: string;
      please_wait: string;
    };
    ui: {
      buttons: {
        play: string;
        pause: string;
        stop: string;
        skip: string;
        previous: string;
        shuffle: string;
        loop: string;
        volume_up: string;
        volume_down: string;
        queue: string;
        autoplay: string;
      };
      labels: {
        name: string;
        description: string;
        duration: string;
        artist: string;
        album: string;
        position: string;
        volume: string;
        queue_length: string;
      };
      states: {
        enabled: string;
        disabled: string;
        playing: string;
        paused: string;
        stopped: string;
        loading: string;
      };
    };
    validation: {
      invalid_url: string;
      invalid_command: string;
      missing_parameter: string;
      invalid_parameter: string;
      parameter_too_long: string;
      parameter_too_short: string;
      invalid_number: string;
      number_out_of_range: string;
      invalid_choice: string;
    };
  };
  
  // Handler keys
  handlers: {
    buttons: {
      unauthorized_user: string;
      button_disabled: string;
      player_buttons: {
        play_resumed: string;
        play_paused: string;
        track_skipped: string;
        track_previous: string;
        playback_stopped: string;
        queue_shuffled: string;
        volume_changed: string;
        loop_disabled: string;
        loop_track: string;
        loop_queue: string;
        autoplay_enabled: string;
        autoplay_disabled: string;
      };
    };
    menus: {
      unauthorized_user: string;
      menu_disabled: string;
      dropdown_unauthorized: string;
      selection_invalid: string;
      playlist_menus: {
        track_added: string;
        track_removed: string;
        playlist_created: string;
        playlist_deleted: string;
        playlist_not_found: string;
        playlist_empty: string;
      };
    };
  };
}

/**
 * Language interpolation arguments
 */
export interface LanguageArgs {
  [key: string]: string | number | boolean;
}

/**
 * Language helper utility types
 */
export type LanguageKeyPath<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends object
        ? `${string & K}.${LanguageKeyPath<T[K]>}`
        : string & K;
    }[keyof T]
  : never;

/**
 * Extract nested property type
 */
export type GetNestedType<T, K extends string> = K extends `${infer P}.${infer Rest}`
  ? P extends keyof T
    ? GetNestedType<T[P], Rest>
    : never
  : K extends keyof T
  ? T[K]
  : never;

/**
 * Language manager interface
 */
export interface ILanguageManager {
  get(locale: SupportedLocale, section: LanguageSection, key: string, args?: LanguageArgs): string;
  getNested(locale: SupportedLocale, section: LanguageSection, keyPath: string, args?: LanguageArgs): string;
  hasKey(locale: SupportedLocale, section: LanguageSection, key: string): boolean;
  getAvailableLocales(): SupportedLocale[];
}