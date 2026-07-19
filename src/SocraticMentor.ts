import { GoogleGenAI } from '@google/genai';

export async function generateHint(objective: string, constraint: string, level: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
        return `[Fallback] Hint for ${level}: Please review ${constraint}`;
    }

    const ai = new GoogleGenAI({});
    const prompt = `Objective: ${objective}\nFailed Constraint: ${constraint}\nEscalation Level: ${level}\nProvide a hint.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: "You are a Socratic Mentor. You must generate a short text hint based ONLY on the Escalation Level. It is strictly forbidden from outputting actual functional application code. Keep it brief."
        }
    });

    return response.text || "Hint generation failed.";
}
