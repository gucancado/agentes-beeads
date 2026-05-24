export type ModelInfo = {
  id: string;
  provider: 'anthropic' | 'google';
  family: string;
  pricing: { in: number; out: number };  // USD / 1M tokens
};

export const MODELS: ModelInfo[] = [
  { id: 'claude-haiku-4-5',      provider: 'anthropic', family: 'Claude Haiku',  pricing: { in: 1.00, out: 5.00 } },
  { id: 'claude-sonnet-4-6',     provider: 'anthropic', family: 'Claude Sonnet', pricing: { in: 3.00, out: 15.0 } },
  { id: 'claude-opus-4-7',       provider: 'anthropic', family: 'Claude Opus',   pricing: { in: 15.0, out: 75.0 } },
  { id: 'gemini-2.5-flash',      provider: 'google',    family: 'Gemini Flash',  pricing: { in: 0.075, out: 0.30 } },
  { id: 'gemini-2.5-flash-lite', provider: 'google',    family: 'Gemini Flash Lite', pricing: { in: 0.10, out: 0.40 } },
  { id: 'gemini-2.5-pro',        provider: 'google',    family: 'Gemini Pro',    pricing: { in: 1.25, out: 5.00 } },
  { id: 'gemini-2.0-flash',      provider: 'google',    family: 'Gemini 2.0 Flash', pricing: { in: 0.10, out: 0.40 } },
  { id: 'gemini-2.0-flash-lite', provider: 'google',    family: 'Gemini 2.0 Flash Lite', pricing: { in: 0.075, out: 0.30 } },
];

export function findModel(id: string): ModelInfo | null {
  return MODELS.find((m) => m.id === id) ?? null;
}
