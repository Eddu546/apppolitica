const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const getSupabaseRestUrl = () => String(SUPABASE_URL || '')
  .replace(/\/+$/, '')
  .replace(/\/rest\/v1$/, '');

const getPublicHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
});

const sanitizeMunicipalityCodes = (codes = []) => [...new Set(
  codes
    .map((code) => String(code || '').replace(/\D/g, ''))
    .filter((code) => code.length === 7)
)].slice(0, 50);

export const fetchMunicipalHealthContext = async ({ municipalityCodes = [], year } = {}) => {
  const codes = sanitizeMunicipalityCodes(municipalityCodes);
  const sourceUrl = 'https://basedosdados.org/dataset/354d6d98-bc09-4e22-a58a-e4eac3a5283c';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { status: 'unconfigured', data: [], sourceUrl };
  }
  if (!codes.length) {
    return { status: 'unavailable', data: [], sourceUrl, reason: 'municipality-code-missing' };
  }

  const params = new URLSearchParams();
  params.set('select', '*');
  params.set('cod_municipio', `in.(${codes.join(',')})`);
  if (year) params.set('ano_mes', `like.${year}%`);
  params.set('order', 'ano_mes.desc');
  params.set('limit', '300');

  try {
    const response = await fetch(`${getSupabaseRestUrl()}/rest/v1/cnes_municipio_resumos?${params.toString()}`, {
      headers: getPublicHeaders(),
    });
    if (!response.ok) {
      return {
        status: response.status === 404 ? 'unconfigured' : 'error',
        data: [],
        sourceUrl,
      };
    }

    const rows = await response.json();
    const latestByMunicipality = new Map();
    rows.forEach((row) => {
      if (!latestByMunicipality.has(row.cod_municipio)) {
        latestByMunicipality.set(row.cod_municipio, row);
      }
    });

    const data = [...latestByMunicipality.values()];
    return {
      status: data.length ? 'available' : 'unavailable',
      data,
      sourceUrl,
      fetchedAt: new Date().toISOString(),
      calculationMethod: 'Último resumo mensal disponível no Supabase para cada código IBGE de município encontrado nas emendas.',
    };
  } catch {
    return { status: 'error', data: [], sourceUrl };
  }
};

export { sanitizeMunicipalityCodes };

