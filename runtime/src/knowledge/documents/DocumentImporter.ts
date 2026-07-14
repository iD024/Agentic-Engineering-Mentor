import * as fs from 'fs';
import * as path from 'path';
import * as pdfParseModule from 'pdf-parse';
import * as cheerio from 'cheerio';
import { KnowledgeDocument, DocumentType } from '../types.js';

const pdfParse = (pdfParseModule as any).default || pdfParseModule;

export class DocumentImporter {
  public async importDocument(filePath: string, metadata: Record<string, any> = {}): Promise<KnowledgeDocument> {
    const ext = path.extname(filePath).toLowerCase();
    const type = this.determineType(ext);
    
    if (!type) {
      throw new Error(`Unsupported document type for extension: ${ext}`);
    }

    const content = await this.readContent(filePath, type);
    const stats = fs.statSync(filePath);

    return {
      id: this.generateId(filePath, stats.mtimeMs),
      sourceUri: filePath,
      type,
      title: path.basename(filePath, ext),
      content,
      version: stats.mtimeMs.toString(),
      lastUpdated: stats.mtime,
      metadata
    };
  }

  private determineType(ext: string): DocumentType | null {
    switch (ext) {
      case '.pdf': return 'pdf';
      case '.md': return 'markdown';
      case '.txt': return 'txt';
      case '.html': return 'html';
      default: return null;
    }
  }

  private async readContent(filePath: string, type: DocumentType): Promise<string> {
    const buffer = fs.readFileSync(filePath);
    
    switch (type) {
      case 'pdf': {
        const data = await pdfParse(buffer);
        return data.text;
      }
      case 'html': {
        const text = buffer.toString('utf-8');
        const $ = cheerio.load(text);
        return $('body').text().replace(/\s+/g, ' ').trim();
      }
      case 'markdown':
      case 'txt':
        return buffer.toString('utf-8');
      default:
        throw new Error(`Cannot read content for type: ${type}`);
    }
  }

  private generateId(filePath: string, mtimeMs: number): string {
    // A deterministic hash based on file path and modification time
    return Buffer.from(`${filePath}_${mtimeMs}`).toString('base64');
  }
}
