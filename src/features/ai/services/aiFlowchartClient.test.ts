import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAiAvailability, resetAiAvailabilityCacheForTests } from './aiFlowchartClient';

afterEach(() => {
  resetAiAvailabilityCacheForTests();
  vi.unstubAllGlobals();
});

describe('AI availability client', () => {
  it('uses the relative health endpoint once and reports configured Gemini', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 'ok',
      ai: { configured: true, provider: 'gemini', model: 'configured-model' },
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getAiAvailability()).resolves.toEqual({
      configured: true,
      provider: 'gemini',
      model: 'configured-model',
    });
    await getAiAvailability();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/health');
  });

  it('reports unavailable without throwing when the server is absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network unavailable')));
    await expect(getAiAvailability()).resolves.toEqual({
      configured: false,
      reason: 'server-unavailable',
    });
  });
});
