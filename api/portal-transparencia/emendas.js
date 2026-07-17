const API_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados/emendas';

const send = (response, status, payload) => {
  response.status(status).json(payload);
};

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    send(response, 405, { error: 'method-not-allowed' });
    return;
  }

  const apiKey = process.env.PORTAL_TRANSPARENCIA_API_KEY;
  if (!apiKey) {
    send(response, 503, { configured: false, error: 'missing-server-api-key' });
    return;
  }

  if (String(request.query.health || '') === '1') {
    response.setHeader('Cache-Control', 'no-store');
    send(response, 200, {
      configured: true,
      sourceName: 'Portal da Transparência - Controladoria-Geral da União',
    });
    return;
  }

  const year = Number(request.query.year);
  const name = String(request.query.name || '').trim().slice(0, 100);
  const page = Math.max(1, Math.min(50, Number(request.query.page) || 1));
  const currentYear = new Date().getFullYear();

  if (!Number.isInteger(year) || year < 2014 || year > currentYear + 1 || name.length < 2) {
    send(response, 400, { error: 'invalid-parameters' });
    return;
  }

  const url = new URL(API_URL);
  url.searchParams.set('ano', String(year));
  url.searchParams.set('nomeAutor', name);
  url.searchParams.set('pagina', String(page));

  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'chave-api-dados': apiKey,
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!upstream.ok) {
      const details = await upstream.text();
      send(response, upstream.status, {
        configured: true,
        error: 'upstream-error',
        details: details.slice(0, 300),
      });
      return;
    }

    const data = await upstream.json();
    response.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    send(response, 200, {
      configured: true,
      data: Array.isArray(data) ? data : [],
      sourceName: 'Portal da Transparência - Controladoria-Geral da União',
      sourceUrl: 'https://portaldatransparencia.gov.br/emendas/consulta',
      fetchedAt: new Date().toISOString(),
      page,
    });
  } catch (error) {
    send(response, 502, {
      configured: true,
      error: error?.name === 'TimeoutError' ? 'upstream-timeout' : 'upstream-unavailable',
    });
  }
}
