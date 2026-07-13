import type { ParserRegistry } from './ParserRegistry.js';
import { LanguageParser } from './LanguageParser.js';

export class ParserFactory {
  constructor(private registry: ParserRegistry) {}

  createParser(lang: string): LanguageParser {
    const language = this.registry.getLanguage(lang);
    if (!language) {
      throw new Error(`Unsupported language: ${lang}`);
    }
    return new LanguageParser(language);
  }
}
