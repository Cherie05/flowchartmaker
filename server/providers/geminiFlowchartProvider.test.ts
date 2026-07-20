import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../middleware/errorHandler';

const { createInteraction, createClient } = vi.hoisted(() => ({
  createInteraction: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    constructor(options: unknown) {
      createClient(options);
    }
    interactions = { create: createInteraction };
  },
}));

import { createGeminiFlowchartProvider } from './geminiFlowchartProvider';

const validDiagram = {
  schemaVersion: '1.0',
  title: 'Simple workflow',
  summary: 'A simple process.',
  assumptions: [],
  nodes: [
    { key: 'start', kind: 'start', label: 'Start', description: '' },
    { key: 'end', kind: 'end', label: 'End', description: '' },
  ],
  edges: [{ key: 'edge', from: 'start', to: 'end', label: '' }],
};

describe('Gemini flowchart provider', () => {
  beforeEach(() => {
    createInteraction.mockReset();
    createClient.mockReset();
  });

  it('uses Interactions structured output without storing provider data', async () => {
    createInteraction.mockResolvedValue({ output_text: JSON.stringify(validDiagram) });
    const provider = createGeminiFlowchartProvider({ apiKey: 'secret', model: 'gemini-3.1-flash-lite', timeoutMs: 30_000 });
    await expect(provider.generate('Create a workflow')).resolves.toEqual(validDiagram);
    expect(createClient).toHaveBeenCalledWith({ apiKey: 'secret' });
    expect(createInteraction).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-3.1-flash-lite',
      store: false,
      response_format: expect.objectContaining({ mime_type: 'application/json', schema: expect.any(Object) }),
    }), expect.objectContaining({ timeout_ms: 30_000 }));
  });

  it.each([
    ['malformed JSON', { output_text: 'not-json' }],
    ['invalid structured response', { output_text: JSON.stringify({ ...validDiagram, nodes: [] }) }],
    ['missing output', {}],
  ])('rejects %s without a mock fallback', async (_name, result) => {
    createInteraction.mockResolvedValue(result);
    const provider = createGeminiFlowchartProvider({ apiKey: 'secret', model: 'model', timeoutMs: 30_000 });
    await expect(provider.generate('Create a workflow')).rejects.toMatchObject({ code: 'INVALID_AI_RESPONSE' });
  });

  it('normalizes timeouts and provider errors', async () => {
    const provider = createGeminiFlowchartProvider({ apiKey: 'secret', model: 'model', timeoutMs: 30_000 });
    createInteraction.mockRejectedValueOnce(new Error('request timeout'));
    await expect(provider.generate('Create a workflow')).rejects.toMatchObject({ code: 'AI_TIMEOUT' });
    createInteraction.mockRejectedValueOnce(new Error('sensitive provider detail'));
    await expect(provider.generate('Create a workflow')).rejects.toEqual(
      new ApiError(502, 'AI_PROVIDER_ERROR', 'Gemini could not complete the AI workflow right now.'),
    );
  });
});
