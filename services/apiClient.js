// backend/services/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  timeout: 10000,
});

// Retry simples para 429 com delay exponencial
apiClient.interceptors.response.use(null, async error => {
  const { config, response } = error;

  if (!config || !response) return Promise.reject(error);

  if (response.status === 429) {
    // Retry máximo 3 vezes
    config.__retryCount = config.__retryCount || 0;
    if (config.__retryCount >= 3) return Promise.reject(error);

    config.__retryCount += 1;

    // Delay crescente: 1s, 2s, 4s
    const delay = 1000 * Math.pow(2, config.__retryCount - 1);

    await new Promise(resolve => setTimeout(resolve, delay));

    return apiClient(config);
  }

  return Promise.reject(error);
});

export default apiClient;
