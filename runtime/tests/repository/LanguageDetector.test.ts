import { describe, it, expect } from 'vitest';
import { LanguageDetector } from '../../src/repository/LanguageDetector.js';

describe('LanguageDetector', () => {
  it('should detect typescript', () => {
    expect(LanguageDetector.detect('index.ts')).toBe('typescript');
    expect(LanguageDetector.detect('index.tsx')).toBe('typescript');
  });
  
  it('should detect javascript', () => {
    expect(LanguageDetector.detect('index.js')).toBe('javascript');
  });
  
  it('should return null for unknown', () => {
    expect(LanguageDetector.detect('index.xyz')).toBeNull();
  });
});
