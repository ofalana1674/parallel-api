import Anthropic from '@anthropic-ai/sdk';
import { CRISIS_TAG_IDS, CRISIS_PHRASES } from '../lib/crisis.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export function hasCrisisTag(tagIds: string[]): boolean {
  return tagIds.some(id => CRISIS_TAG_IDS.has(id));
}

export function scanMessage(text: string): { isCrisis: boolean; matchedPhrase: string | null } {
  const lower = text.toLowerCase();
  for (const phrase of CRISIS_PHRASES) {
    if (lower.includes(phrase)) return { isCrisis: true, matchedPhrase: phrase };
  }
  return { isCrisis: false, matchedPhrase: null };
}

export async function claudeCrisisScan(text: string): Promise<{ isCrisis: boolean; confidence: 'low' | 'medium' | 'high' }> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      messages: [{ role: 'user', content: `Does this message express suicidal ideation, self-harm intent, or immediate safety crisis? Reply with JSON only: {"crisis": boolean, "confidence": "low"|"medium"|"high"}\n\nMessage: "${text}"` }],
    });
    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
    return JSON.parse(raw);
  } catch {
    return { isCrisis: false, confidence: 'low' };
  }
}
