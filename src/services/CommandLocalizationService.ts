/**
 * Command Localization Service
 * Handles loading localized command descriptions and options
 */

import { Manager } from "../manager.js";
import { Command } from "../structures/Command.js";
import { SupportedLocale } from "../@types/Language.js";
import { LanguageHelper } from "../utilities/LanguageHelper.js";

export class CommandLocalizationService {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
  }

  /**
   * Localize command metadata
   */
  public localizeCommand(command: Command, locale: SupportedLocale = 'en'): Command {
    const lang = new LanguageHelper(this.client, locale);
    
    // Get command category in lowercase for language key
    const category = command.category.toLowerCase();
    
    try {
      // Try to get localized description
      const localizedDescription = lang.command(category, 'description');
      if (localizedDescription && !localizedDescription.includes('[Missing:')) {
        command.description = localizedDescription;
      }
    } catch (error) {
      // Keep original description if localization fails
    }

    // Localize options if present
    if (command.options && Array.isArray(command.options)) {
      command.options = this.localizeOptions(command.options, category, lang);
    }

    return command;
  }

  /**
   * Localize command options
   */
  private localizeOptions(options: any[], category: string, lang: LanguageHelper): any[] {
    return options.map(option => {
      const localizedOption = { ...option };

      try {
        // Try to get localized option description
        const optionDesc = lang.command(category, `options.${option.name}.description`);
        if (optionDesc && !optionDesc.includes('[Missing:')) {
          localizedOption.description = optionDesc;
        }
      } catch (error) {
        // Keep original description
      }

      // Localize choices if present
      if (option.choices && Array.isArray(option.choices)) {
        localizedOption.choices = this.localizeChoices(option.choices, category, option.name, lang);
      }

      return localizedOption;
    });
  }

  /**
   * Localize command option choices
   */
  private localizeChoices(choices: any[], category: string, optionName: string, lang: LanguageHelper): any[] {
    return choices.map(choice => {
      const localizedChoice = { ...choice };

      try {
        // Try to get localized choice name
        const choiceName = lang.command(category, `options.${optionName}.choices.${choice.value}`);
        if (choiceName && !choiceName.includes('[Missing:')) {
          localizedChoice.name = choiceName;
        }
      } catch (error) {
        // Keep original name
      }

      return localizedChoice;
    });
  }

  /**
   * Localize multiple commands
   */
  public localizeCommands(commands: Command[], locale: SupportedLocale = 'en'): Command[] {
    return commands.map(command => this.localizeCommand(command, locale));
  }

  /**
   * Get available locales for a command
   */
  public getAvailableLocales(command: Command): SupportedLocale[] {
    const availableLocales: SupportedLocale[] = [];
    const category = command.category.toLowerCase();
    
    const locales: SupportedLocale[] = ['en', 'vi'];
    
    for (const locale of locales) {
      const lang = new LanguageHelper(this.client, locale);
      if (lang.hasKey('commands', `${category}.description`)) {
        availableLocales.push(locale);
      }
    }

    return availableLocales;
  }
}