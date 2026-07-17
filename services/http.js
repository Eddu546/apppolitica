const memoryCache = new Map();
const inFlightRequests = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  return query.toString();
};

const buildCachedResult = (cached, extra = {}) => ({
  data: cached.data,
  fetchedAt: cached.fetchedAt,
  fromCache: true,
  ...extra,
});

const fetchWithCache = async (url, options, parseResponse, acceptHeader) => {
  const {
    cacheTtlMs = 1000 * 60 * 10,
    retries = 2,
    timeoutMs = 12000,
    cacheKey = url,
    fetchOptions = {},
  } = options;

  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.storedAt < cacheTtlMs) {
    return buildCachedResult(cached, { cacheStatus: 'fresh' });
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const request = (async () => {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            Accept: acceptHeader,
            ...(fetchOptions.headers || {}),
          },
        });

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const data = await parseResponse(response);
        const fetchedAt = new Date().toISOString();

        memoryCache.set(cacheKey, {
          data,
          fetchedAt,
          storedAt: Date.now(),
        });

        return { data, fetchedAt, fromCache: false, cacheStatus: 'network' };
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          await sleep(400 * 2 ** attempt);
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    if (cached) {
      return buildCachedResult(cached, {
        cacheStatus: 'stale',
        stale: true,
        warning: lastError?.message || 'A fonte oficial não respondeu; exibindo a última consulta disponível.',
      });
    }

    return {
      data: null,
      fetchedAt: new Date().toISOString(),
      fromCache: false,
      cacheStatus: 'error',
      error: lastError?.message || 'Falha ao buscar dados',
    };
  })();

  inFlightRequests.set(cacheKey, request);
  try {
    return await request;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
};

export const cachedJsonFetch = (url, options = {}) =>
  fetchWithCache(url, options, (response) => response.json(), 'application/json');

export const cachedTextFetch = (url, options = {}) =>
  fetchWithCache(url, options, (response) => response.text(), 'text/html,text/plain,*/*');

export const clearMemoryCache = () => {
  memoryCache.clear();
  inFlightRequests.clear();
};
