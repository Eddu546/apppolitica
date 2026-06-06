const memoryCache = new Map();

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

export const cachedJsonFetch = async (url, options = {}) => {
  const {
    cacheTtlMs = 1000 * 60 * 10,
    retries = 2,
    timeoutMs = 12000,
    cacheKey = url,
    fetchOptions = {},
  } = options;

  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.storedAt < cacheTtlMs) {
    return { data: cached.data, fetchedAt: cached.fetchedAt, fromCache: true };
  }

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(fetchOptions.headers || {}),
        },
      });

      clearTimeout(timeout);

      if (response.status === 429 || response.status >= 500) {
        throw new Error(`Status ${response.status}`);
      }

      if (!response.ok) {
        return {
          data: null,
          fetchedAt: new Date().toISOString(),
          fromCache: false,
          error: `Status ${response.status}`,
        };
      }

      const data = await response.json();
      const fetchedAt = new Date().toISOString();

      memoryCache.set(cacheKey, {
        data,
        fetchedAt,
        storedAt: Date.now(),
      });

      return { data, fetchedAt, fromCache: false };
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;

      if (attempt < retries) {
        await sleep(400 * (attempt + 1));
      }
    }
  }

  return {
    data: null,
    fetchedAt: new Date().toISOString(),
    fromCache: false,
    error: lastError?.message || 'Falha ao buscar dados',
  };
};

export const clearMemoryCache = () => {
  memoryCache.clear();
};
