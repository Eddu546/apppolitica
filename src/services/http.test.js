import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cachedJsonFetch, clearMemoryCache } from '@/services/http';

const jsonResponse = (data) => ({
  ok: true,
  status: 200,
  json: async () => data,
});

describe('cached HTTP client', () => {
  beforeEach(() => {
    clearMemoryCache();
    vi.restoreAllMocks();
  });

  it('deduplicates simultaneous requests for the same source', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ dados: [1] }));
    vi.stubGlobal('fetch', fetchMock);

    const [first, second] = await Promise.all([
      cachedJsonFetch('/same-source'),
      cachedJsonFetch('/same-source'),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.data).toEqual({ dados: [1] });
    expect(second.data).toEqual({ dados: [1] });
  });

  it('returns traceable stale data when a later refresh fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ dados: ['oficial'] }))
      .mockRejectedValueOnce(new Error('indisponível'));
    vi.stubGlobal('fetch', fetchMock);

    await cachedJsonFetch('/unstable-source', { cacheTtlMs: 0, retries: 0 });
    const stale = await cachedJsonFetch('/unstable-source', { cacheTtlMs: 0, retries: 0 });

    expect(stale.data).toEqual({ dados: ['oficial'] });
    expect(stale.stale).toBe(true);
    expect(stale.cacheStatus).toBe('stale');
  });
});
