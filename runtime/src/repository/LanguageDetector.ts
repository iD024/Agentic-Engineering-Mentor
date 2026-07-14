import path from 'node:path';

export class LanguageDetector {
  static detect(filePath: string): string | null {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.ts': case '.tsx': return 'typescript';
      case '.js': case '.jsx': case '.mjs': case '.cjs': return 'javascript';
      case '.py': return 'python';
      case '.c': case '.h': return 'c';
      case '.cpp': case '.hpp': return 'cpp';
      case '.rs': return 'rust';
      default: return null;
    }
  }
}
