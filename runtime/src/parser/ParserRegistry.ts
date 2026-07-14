import type Parser from 'web-tree-sitter';

export class ParserRegistry {
  private languages = new Map<string, any>();

  register(lang: string, language: any) {
    this.languages.set(lang, language);
  }

  getLanguage(lang: string): any {
    return this.languages.get(lang);
  }
}
