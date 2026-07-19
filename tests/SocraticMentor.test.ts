import { generateHint } from '../src/SocraticMentor';
import { GoogleGenAI } from '@google/genai';

jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: jest.fn().mockResolvedValue({ text: 'Mock hint generated' })
        }
      };
    })
  };
});

describe('SocraticMentor', () => {
    it('should generate a hint based on objective, constraint and level', async () => {
        process.env.GEMINI_API_KEY = 'test';
        const hint = await generateHint('Fix Syntax', 'Missing bracket', 'Inquiry');
        expect(hint).toBe('Mock hint generated');
    });
});
