import {
  formatCurrency,
  getTopSupplier,
  groupExpensesByMonth,
} from '@/lib/legislative-logic';
import { applyPartyCorrectionToSummary, getCorrectedPartyForCamaraId } from '@/lib/party-corrections';
import { getAllDeputadosList, getDeputadoDespesas } from '@/services/camara';
import { SENSITIVE_CEAP_CATEGORIES, classifySensitiveCeapType } from '@/services/benefits';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isAnnualSummaryDatabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const getSupabaseRestUrl = () => {
  if (!SUPABASE_URL) return '';
  return SUPABASE_URL
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/, '');
};

const getStoredSession = () => {
  try {
    return JSON.parse(localStorage.getItem('fiscaliza_admin_session') || 'null');
  } catch {
    return null;
  }
};

const getAccessToken = () => getStoredSession()?.access_token;

const decodeJwtPayload = (token) => {
  if (!token) return {};

  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
};

export const getLoggedAdminEmail = () =>
  getStoredSession()?.user?.email || decodeJwtPayload(getAccessToken()).email || '';

const getPublicHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
});

const getAuthHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${getAccessToken() || SUPABASE_ANON_KEY}`,
});

const getDeputyIdentity = (deputado) => {
  const status = deputado?.ultimoStatus || deputado || {};
  return {
    id: String(status.id || deputado?.id || ''),
    nome: status.nomeEleitoral || status.nome || deputado?.nome || 'Deputado sem nome',
    partido: getCorrectedPartyForCamaraId(
      status.id || deputado?.id,
      status.siglaPartido || deputado?.siglaPartido || ''
    ),
    uf: status.siglaUf || deputado?.siglaUf || '',
  };
};

const parseMoney = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildCategoryBreakdown = (despesas = []) => {
  const grouped = despesas.reduce((acc, curr) => {
    const tipo = curr.tipoDespesa || 'Outras despesas';
    const valor = parseMoney(curr.valorLiquido);
    if (valor <= 0) return acc;

    acc[tipo] = {
      name: tipo,
      value: Number(((acc[tipo]?.value || 0) + valor).toFixed(2)),
      count: (acc[tipo]?.count || 0) + 1,
    };
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => b.value - a.value);
};

export const buildDeputyAnnualExpenseSummary = ({ deputado, despesas = [], ano }) => {
  const identity = getDeputyIdentity(deputado);
  const total = despesas.reduce((acc, item) => acc + parseMoney(item.valorLiquido), 0);
  const monthly = groupExpensesByMonth(despesas);
  const months = Math.max(monthly.length, 1);
  const topSupplier = getTopSupplier(despesas);
  const hasOfficialResponse = Boolean(despesas.__meta?.fetchedAt);

  return {
    ano: String(ano),
    deputado_id: identity.id,
    nome: identity.nome,
    partido: identity.partido,
    uf: identity.uf,
    total_gasto: Number(total.toFixed(2)),
    quantidade_despesas: despesas.length,
    media_mensal: Number((total / months).toFixed(2)),
    maior_fornecedor: topSupplier?.name || null,
    maior_fornecedor_valor: topSupplier ? Number(topSupplier.value.toFixed(2)) : null,
    categorias: buildCategoryBreakdown(despesas),
    status: hasOfficialResponse ? 'available' : 'partial',
    source_name: 'Camara dos Deputados - Dados Abertos',
    source_url: `https://dadosabertos.camara.leg.br/api/v2/deputados/${identity.id}/despesas?ano=${ano}`,
    fetched_at: despesas.__meta?.fetchedAt || new Date().toISOString(),
    calculation_method: 'Resumo anual calculado pelo FISCALIZA a partir da soma dos valores liquidos das despesas CEAP retornadas pela API da Camara.',
    confidence_level: hasOfficialResponse ? 'high' : 'medium',
  };
};

export const parseSummaryCategories = (summary) => {
  if (Array.isArray(summary?.categorias)) return summary.categorias;

  if (typeof summary?.categorias === 'string') {
    try {
      const parsed = JSON.parse(summary.categorias);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

export const getSensitiveCategoryAmountFromSummary = (summary, categoryId) =>
  parseSummaryCategories(summary).reduce((acc, category) => {
    const sensitiveCategory = classifySensitiveCeapType(category.name || category.tipoDespesa || '');
    if (sensitiveCategory?.id !== categoryId) return acc;

    return acc + Number(category.value || category.amount || 0);
  }, 0);

export const getSensitiveCategoryCountFromSummary = (summary, categoryId) => {
  let hasKnownCount = false;
  const count = parseSummaryCategories(summary).reduce((acc, category) => {
    const sensitiveCategory = classifySensitiveCeapType(category.name || category.tipoDespesa || '');
    if (sensitiveCategory?.id !== categoryId) return acc;

    if (category.count === undefined || category.count === null) return acc;
    hasKnownCount = true;
    return acc + Number(category.count || 0);
  }, 0);

  return hasKnownCount ? count : null;
};

export const decorateSummariesWithSensitiveCategory = (summaries = [], categoryId = 'total') =>
  summaries.map((summary) => {
    const categoryValue = categoryId === 'total'
      ? Number(summary.total_gasto || 0)
      : getSensitiveCategoryAmountFromSummary(summary, categoryId);
    const categoryCount = categoryId === 'total'
      ? Number(summary.quantidade_despesas || 0)
      : getSensitiveCategoryCountFromSummary(summary, categoryId);
    const total = Number(summary.total_gasto || 0);

    return {
      ...summary,
      ranking_value: Number(categoryValue.toFixed(2)),
      ranking_count: categoryCount,
      ranking_share: total > 0 ? categoryValue / total : 0,
    };
  });

const CATEGORY_ATTENTION_RULES = {
  rented_vehicle: { mediumShare: 0.1, highShare: 0.2, mediumAmount: 10000, highAmount: 30000 },
  fuel: { mediumShare: 0.15, highShare: 0.25, mediumAmount: 10000, highAmount: 30000 },
  airfare: { mediumShare: 0.25, highShare: 0.4, mediumAmount: 15000, highAmount: 50000 },
  lodging: { mediumShare: 0.12, highShare: 0.22, mediumAmount: 8000, highAmount: 25000 },
  meal: { mediumShare: 0.08, highShare: 0.16, mediumAmount: 5000, highAmount: 15000 },
  disclosure: { mediumShare: 0.45, highShare: 0.65, mediumAmount: 30000, highAmount: 100000 },
  consulting: { mediumShare: 0.2, highShare: 0.4, mediumAmount: 20000, highAmount: 80000 },
};

const getSensitiveCategoryAttentionLevel = ({ categoryId, amount, share }) => {
  const rule = CATEGORY_ATTENTION_RULES[categoryId];
  if (!rule || amount <= 0) return null;

  if (share >= rule.highShare && amount >= rule.highAmount) return 'high';
  if (share >= rule.mediumShare && amount >= rule.mediumAmount) return 'medium';
  return null;
};

const ATTENTION_POINT_TYPE_WEIGHT = {
  above_average_spending: 6,
  sensitive_category_share: 5,
  supplier_concentration: 4,
  unusually_low_spending: 3,
  possible_partial_mandate: 2,
  missing_expense_data: 1,
};

const getExpenseRecordCount = (summary) => {
  if (summary.quantidade_despesas === undefined || summary.quantidade_despesas === null) return null;
  const parsed = Number(summary.quantidade_despesas);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildLowOrMissingExpensePoint = ({ summary, baseAverage, hasNationalBase }) => {
  const total = Number(summary.total_gasto || 0);
  const recordCount = getExpenseRecordCount(summary);
  if (recordCount === null) return null;

  const basePayload = {
    deputyId: summary.deputado_id,
    deputyName: summary.nome,
    party: summary.partido,
    state: summary.uf,
    year: summary.ano,
    amount: total,
    total,
    average: hasNationalBase ? baseAverage : null,
    recordCount,
    sourceName: summary.source_name,
    sourceUrl: summary.source_url,
    fetchedAt: summary.fetched_at,
  };

  if (total === 0 && recordCount === 0) {
    return {
      ...basePayload,
      id: `${summary.ano}-${summary.deputado_id}-missing-expenses`,
      type: 'missing_expense_data',
      level: 'medium',
      title: 'Ausência de despesas no resumo',
      explanation:
        'Nenhuma despesa CEAP apareceu no resumo anual sincronizado. Isso não prova automaticamente que não houve custo do mandato; pode indicar não uso da cota, mandato parcial, licença, suplência ou limitação da fonte consultada.',
      calculationMethod:
        'O FISCALIZA encontrou total_gasto igual a zero e quantidade_despesas igual a zero no resumo anual sincronizado.',
    };
  }

  if (!hasNationalBase || baseAverage <= 0) return null;

  if (recordCount <= 5 && total <= baseAverage * 0.25) {
    return {
      ...basePayload,
      id: `${summary.ano}-${summary.deputado_id}-possible-partial-mandate`,
      type: 'possible_partial_mandate',
      level: 'medium',
      title: 'Possível mandato parcial ou poucos registros',
      explanation:
        `Foram encontrados apenas ${recordCount} registro(s) de despesa e o total ficou bem abaixo da média da base. Isso merece checagem de posse, licença, suplência ou uso reduzido da CEAP; não é conclusão sobre conduta.`,
      calculationMethod:
        'Quantidade de despesas menor ou igual a 5 e total anual abaixo de 25% da média nacional da base sincronizada.',
    };
  }

  if (total > 0 && total < baseAverage * 0.12) {
    return {
      ...basePayload,
      id: `${summary.ano}-${summary.deputado_id}-low-spending`,
      type: 'unusually_low_spending',
      level: 'medium',
      title: 'Gasto muito abaixo da média',
      explanation:
        `O total gasto representa ${(total / baseAverage * 100).toFixed(1)}% da média da base sincronizada. Isso pode ser uso baixo da cota, mandato parcial ou dado incompleto; merece análise da fonte oficial.`,
      calculationMethod:
        'Total anual do parlamentar dividido pela média nacional dos deputados sincronizados. O ponto aparece quando fica abaixo de 12% da média.',
    };
  }

  return null;
};

export const buildSensitiveCategoryAttentionPoints = (summaries = []) =>
  summaries.flatMap((summary) => {
    const total = Number(summary.total_gasto || 0);
    if (!summary?.deputado_id || total <= 0) return [];

    return SENSITIVE_CEAP_CATEGORIES.flatMap((category) => {
      const amount = getSensitiveCategoryAmountFromSummary(summary, category.id);
      const count = getSensitiveCategoryCountFromSummary(summary, category.id);
      const share = total > 0 ? amount / total : 0;
      const level = getSensitiveCategoryAttentionLevel({ categoryId: category.id, amount, share });

      if (!level) return [];

      return [{
        id: `${summary.ano}-${summary.deputado_id}-category-${category.id}`,
        type: 'sensitive_category_share',
        categoryId: category.id,
        categoryLabel: category.label,
        level,
        title: 'Categoria sensível com peso alto',
        deputyId: summary.deputado_id,
        deputyName: summary.nome,
        party: summary.partido,
        state: summary.uf,
        year: summary.ano,
        value: share,
        amount,
        total,
        recordCount: count,
        sourceName: summary.source_name,
        sourceUrl: summary.source_url,
        fetchedAt: summary.fetched_at,
        explanation:
          `${category.label} somou ${formatCurrency(amount)}, equivalente a ${(share * 100).toFixed(1)}% das despesas CEAP registradas no ano. Isso não indica irregularidade sozinho; serve para orientar leitura de notas, fornecedores e contexto.`,
        calculationMethod:
          `Valor da categoria "${category.label}" dividido pelo total anual de despesas CEAP do parlamentar. O agrupamento usa o campo tipoDespesa retornado pela Camara.`,
      }];
    });
  });

const readResponseMessage = async (response, fallback) => {
  const text = await response.text();
  if (!text) return fallback;

  try {
    const json = JSON.parse(text);
    return json.message || json.error_description || json.error || text;
  } catch {
    return text;
  }
};

export const explainAnnualSummaryError = (message = '', email = getLoggedAdminEmail()) => {
  const normalized = String(message).toLowerCase();
  const emailHint = email ? ` E-mail logado: ${email}.` : '';

  if (normalized.includes('jwt') || normalized.includes('expired') || normalized.includes('invalid token')) {
    return 'Sessao admin expirada. Clique em Sair, entre de novo no /admin e tente novamente.';
  }

  if (normalized.includes('relation') && normalized.includes('does not exist')) {
    return 'A tabela deputado_ano_resumos ainda nao existe. Rode novamente o arquivo supabase/schema.sql no SQL Editor do Supabase.';
  }

  if (normalized.includes('permission denied') || normalized.includes('row-level security') || normalized.includes('violates row-level security')) {
    return `Permissao bloqueada pelo Supabase.${emailHint} Confirme que esse e-mail esta exatamente igual em public.admin_users.`;
  }

  if (normalized.includes('unique') || normalized.includes('on conflict')) {
    return 'A chave unica (ano, deputado_id) nao existe na tabela. Rode novamente o schema.sql atualizado.';
  }

  return message || 'Falha desconhecida ao salvar no Supabase.';
};

export const testAnnualSummaryWriteAccess = async () => {
  if (!isAnnualSummaryDatabaseConfigured) {
    throw new Error('Supabase nao configurado no .env.local.');
  }

  if (!getAccessToken()) {
    throw new Error('Sessao admin ausente. Entre novamente no painel /admin.');
  }

  const adminEmail = getLoggedAdminEmail();
  if (!adminEmail) {
    throw new Error('Nao consegui identificar o e-mail da sessao admin. Clique em Sair, entre novamente e tente de novo.');
  }

  const adminParams = new URLSearchParams();
  adminParams.set('select', 'email');
  adminParams.set('email', `eq.${adminEmail}`);

  const adminResponse = await fetch(`${getSupabaseRestUrl()}/rest/v1/admin_users?${adminParams.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!adminResponse.ok) {
    const message = await readResponseMessage(adminResponse, 'Falha ao verificar admin_users.');
    throw new Error(explainAnnualSummaryError(message, adminEmail));
  }

  const adminRows = await adminResponse.json();
  if (!adminRows.length) {
    throw new Error(
      `O e-mail logado (${adminEmail}) nao foi encontrado em public.admin_users. Insira exatamente esse e-mail no SQL Editor, saia do /admin e entre de novo.`
    );
  }

  const testId = `preflight-${Date.now()}`;
  const payload = {
    ano: 'preflight',
    deputado_id: testId,
    nome: 'Teste de permissao FISCALIZA',
    partido: 'TESTE',
    uf: 'BR',
    total_gasto: 0,
    quantidade_despesas: 0,
    media_mensal: 0,
    maior_fornecedor: null,
    maior_fornecedor_valor: null,
    categorias: [],
    status: 'partial',
    source_name: 'FISCALIZA - teste de permissao',
    source_url: 'https://dadosabertos.camara.leg.br/',
    fetched_at: new Date().toISOString(),
    calculation_method: 'Registro temporario para testar permissao de escrita no Supabase.',
    confidence_level: 'low',
    updated_at: new Date().toISOString(),
  };

  const insertResponse = await fetch(
    `${getSupabaseRestUrl()}/rest/v1/deputado_ano_resumos?on_conflict=ano,deputado_id`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!insertResponse.ok) {
    const message = await readResponseMessage(insertResponse, 'Falha no teste de escrita.');
    throw new Error(explainAnnualSummaryError(message, adminEmail));
  }

  await fetch(`${getSupabaseRestUrl()}/rest/v1/deputado_ano_resumos?ano=eq.preflight&deputado_id=eq.${testId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
      Prefer: 'return=minimal',
    },
  }).catch(() => null);

  return { ok: true };
};

export const upsertDeputyYearSummary = async (summary) => {
  if (!isAnnualSummaryDatabaseConfigured) {
    return { ok: false, reason: 'missing-config' };
  }

  const response = await fetch(
    `${getSupabaseRestUrl()}/rest/v1/deputado_ano_resumos?on_conflict=ano,deputado_id`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        ...summary,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!response.ok) {
    const message = await readResponseMessage(response, 'Falha ao salvar resumo anual');
    throw new Error(explainAnnualSummaryError(message));
  }

  return { ok: true };
};

export const fetchDeputyYearSummaries = async (ano) => {
  if (!isAnnualSummaryDatabaseConfigured) {
    return { ok: false, reason: 'missing-config', data: [] };
  }

  const params = new URLSearchParams();
  params.set('select', '*');
  params.set('ano', `eq.${ano}`);
  params.set('order', 'total_gasto.desc');
  params.set('limit', '600');

  const response = await fetch(`${getSupabaseRestUrl()}/rest/v1/deputado_ano_resumos?${params.toString()}`, {
    headers: getPublicHeaders(),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Falha ao buscar resumos anuais');
  }

  const data = await response.json();
  return { ok: true, data: data.map(applyPartyCorrectionToSummary) };
};

export const selectLiveSampleDeputies = (deputados = [], limit = 27) => {
  const groups = deputados.reduce((acc, deputado) => {
    const uf = deputado.siglaUf || deputado.uf || 'SEM_UF';
    if (!acc.has(uf)) acc.set(uf, []);
    acc.get(uf).push(deputado);
    return acc;
  }, new Map());
  const orderedGroups = Array.from(groups.entries())
    .sort(([ufA], [ufB]) => ufA.localeCompare(ufB, 'pt-BR'))
    .map(([, items]) => items.sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR')));
  const selected = [];
  let round = 0;

  while (selected.length < limit && orderedGroups.some((group) => group[round])) {
    orderedGroups.forEach((group) => {
      if (selected.length < limit && group[round]) selected.push(group[round]);
    });
    round += 1;
  }

  return selected;
};

export const fetchLiveDeputyYearSummaries = async (ano, options = {}) => {
  const limit = Number(options.limit || 27);
  const concurrency = Math.max(1, Math.min(Number(options.concurrency || 3), 4));
  const deputados = await getAllDeputadosList();
  const selectedDeputies = selectLiveSampleDeputies(deputados, limit);
  const summaries = [];

  let completed = 0;
  for (let index = 0; index < selectedDeputies.length; index += concurrency) {
    const batch = selectedDeputies.slice(index, index + concurrency);
    const batchSummaries = await Promise.all(batch.map(async (deputado) => {
      try {
        const despesas = await getDeputadoDespesas(deputado.id, ano);
        return buildDeputyAnnualExpenseSummary({ deputado, despesas, ano });
      } catch (error) {
        console.warn('[FISCALIZA] Falha ao montar resumo anual ao vivo.', {
          deputadoId: deputado.id,
          ano,
          error,
        });
        return null;
      } finally {
        completed += 1;
        if (typeof options.onProgress === 'function') {
          options.onProgress({
            current: completed,
            total: selectedDeputies.length,
            totalAvailable: deputados.length,
          });
        }
      }
    }));

    summaries.push(...batchSummaries.filter(Boolean));
  }

  return {
    ok: true,
    source: 'live-camara',
    isLiveFallback: true,
    totalAvailable: deputados.length,
    limit: selectedDeputies.length,
    data: summaries.map(applyPartyCorrectionToSummary),
    message:
      `Amostra parcial montada em tempo real com ${summaries.length} de ${deputados.length} deputados retornados pela API oficial, distribuída entre UFs quando possível. Para ranking nacional definitivo, sincronize o ano completo no Supabase.`,
  };
};

export const getAnnualSummaryBaseStatus = (summaries = []) => {
  const count = summaries.length;

  if (count >= 450) {
    return {
      status: 'available',
      count,
      label: 'Base completa',
      message: `A base tem ${count} deputados sincronizados. O ranking pode ser lido como comparativo nacional de gastos dentro do ano selecionado.`,
      warnings: [],
    };
  }

  if (count > 0) {
    return {
      status: 'partial',
      count,
      label: 'Base parcial',
      message: `A base tem ${count} deputados sincronizados. Use como lista parcial, não como ranking nacional definitivo.`,
      warnings: ['Para ranking nacional confiável, sincronize pelo menos 450 deputados no ano.'],
    };
  }

  return {
    status: 'unavailable',
    count,
    label: 'Sem base sincronizada',
    message: 'Nenhum resumo anual foi encontrado para este ano. Sincronize no painel admin antes de publicar rankings.',
    warnings: ['Ranking indisponível até existir base sincronizada.'],
  };
};

export const buildSpendingAttentionPoints = (summaries = []) => {
  const validSummaries = summaries
    .filter((summary) => Number.isFinite(Number(summary.total_gasto)))
    .map((summary) => ({
      ...summary,
      total_gasto: Number(summary.total_gasto),
      maior_fornecedor_valor: Number(summary.maior_fornecedor_valor || 0),
    }));

  if (!validSummaries.length) return [];

  const baseAverage =
    validSummaries.reduce((acc, summary) => acc + summary.total_gasto, 0) / validSummaries.length;
  const hasNationalBase = validSummaries.length >= 450;

  const generalPoints = validSummaries.flatMap((summary) => {
    const points = [];
    const supplierShare =
      summary.total_gasto > 0 && summary.maior_fornecedor_valor > 0
        ? summary.maior_fornecedor_valor / summary.total_gasto
        : 0;

    if (supplierShare >= 0.4) {
      points.push({
        id: `${summary.ano}-${summary.deputado_id}-supplier`,
        type: 'supplier_concentration',
        level: supplierShare >= 0.6 ? 'high' : 'medium',
        title: 'Concentracao em fornecedor',
        deputyId: summary.deputado_id,
        deputyName: summary.nome,
        party: summary.partido,
        state: summary.uf,
        year: summary.ano,
        value: supplierShare,
        amount: summary.maior_fornecedor_valor,
        total: summary.total_gasto,
        supplier: summary.maior_fornecedor,
        sourceName: summary.source_name,
        sourceUrl: summary.source_url,
        fetchedAt: summary.fetched_at,
        explanation:
          `${(supplierShare * 100).toFixed(1)}% das despesas registradas ficaram concentradas no maior fornecedor. Isso não indica irregularidade sozinho, mas merece leitura da fonte.`,
        calculationMethod:
          'Valor do maior fornecedor dividido pelo total de despesas CEAP registradas no ano para o parlamentar.',
      });
    }

    const lowOrMissingPoint = buildLowOrMissingExpensePoint({ summary, baseAverage, hasNationalBase });
    if (lowOrMissingPoint) points.push(lowOrMissingPoint);

    if (hasNationalBase && summary.total_gasto > baseAverage * 1.5) {
      points.push({
        id: `${summary.ano}-${summary.deputado_id}-above-average`,
        type: 'above_average_spending',
        level: summary.total_gasto > baseAverage * 2 ? 'high' : 'medium',
        title: 'Gasto acima da média da base',
        deputyId: summary.deputado_id,
        deputyName: summary.nome,
        party: summary.partido,
        state: summary.uf,
        year: summary.ano,
        value: summary.total_gasto / baseAverage,
        amount: summary.total_gasto,
        average: baseAverage,
        sourceName: summary.source_name,
        sourceUrl: summary.source_url,
        fetchedAt: summary.fetched_at,
        explanation:
          `O total gasto ficou ${(summary.total_gasto / baseAverage).toFixed(1)}x acima da média da base sincronizada. Isso é um ponto de comparação, não uma acusação.`,
        calculationMethod:
          'Total gasto pelo parlamentar dividido pela média de gasto dos deputados sincronizados no mesmo ano.',
      });
    }

    return points;
  });

  return [
    ...generalPoints,
    ...buildSensitiveCategoryAttentionPoints(validSummaries),
  ].sort((a, b) => {
    const levelWeight = { high: 2, medium: 1 };
    if (levelWeight[b.level] !== levelWeight[a.level]) {
      return levelWeight[b.level] - levelWeight[a.level];
    }
    const typeDifference =
      (ATTENTION_POINT_TYPE_WEIGHT[b.type] || 0) - (ATTENTION_POINT_TYPE_WEIGHT[a.type] || 0);
    if (typeDifference !== 0) return typeDifference;
    return Number(b.amount || 0) - Number(a.amount || 0);
  });
};

export const computeExpenseComparisons = (currentSummary, summaries = []) => {
  if (!currentSummary?.deputado_id) {
    return {
      status: 'unavailable',
      reason: 'Resumo do parlamentar atual indisponivel.',
    warnings: ['Não há dados suficientes para comparar gastos.'],
    };
  }

  const byDeputy = new Map();
  summaries.forEach((summary) => {
    if (summary?.deputado_id) byDeputy.set(String(summary.deputado_id), summary);
  });
  byDeputy.set(String(currentSummary.deputado_id), currentSummary);

  const all = Array.from(byDeputy.values())
    .filter((summary) => Number.isFinite(Number(summary.total_gasto)))
    .map((summary) => ({ ...summary, total_gasto: Number(summary.total_gasto) }));

  const nationalCount = all.length;
  const stateItems = all.filter((summary) => summary.uf === currentSummary.uf);
  const stateCount = stateItems.length;
  const hasNationalBase = nationalCount >= 450;
  const hasStateBase = stateCount >= 3;

  if (!hasNationalBase) {
    return {
      status: nationalCount >= 30 ? 'partial' : 'unavailable',
      nationalCount,
      stateCount,
      reason: `A base anual possui ${nationalCount} deputados sincronizados. Para ranking nacional confiavel, o FISCALIZA exige pelo menos 450.`,
      warnings: ['Sincronize o ano completo no painel admin antes de exibir ranking como comparativo confiavel.'],
    };
  }

  const nationalAverage = all.reduce((acc, item) => acc + item.total_gasto, 0) / nationalCount;
  const stateAverage = hasStateBase
    ? stateItems.reduce((acc, item) => acc + item.total_gasto, 0) / stateCount
    : null;

  const sortedNational = [...all].sort((a, b) => b.total_gasto - a.total_gasto);
  const sortedState = [...stateItems].sort((a, b) => b.total_gasto - a.total_gasto);
  const nationalRank = sortedNational.findIndex((item) => String(item.deputado_id) === String(currentSummary.deputado_id)) + 1;
  const stateRank = sortedState.findIndex((item) => String(item.deputado_id) === String(currentSummary.deputado_id)) + 1;

  return {
    status: hasStateBase ? 'available' : 'partial',
    nationalCount,
    stateCount,
    nationalAverage,
    stateAverage,
    nationalRank,
    stateRank: hasStateBase ? stateRank : null,
    totalGasto: Number(currentSummary.total_gasto),
    sourceName: 'FISCALIZA + Camara dos Deputados - Dados Abertos',
    sourceUrl: currentSummary.source_url,
    fetchedAt: currentSummary.fetched_at,
    calculationMethod:
      'Comparativo calculado a partir dos resumos anuais de despesas CEAP sincronizados no Supabase e originados da API oficial da Camara.',
    explanationForCitizen: `O parlamentar declarou ${formatCurrency(currentSummary.total_gasto)} no ano. A comparacao usa os deputados ja sincronizados para o mesmo ano.`,
    warnings: hasStateBase ? [] : ['A média estadual ficou indisponível porque há poucos deputados do estado sincronizados.'],
  };
};
