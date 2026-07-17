import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { AlertTriangle, Database, ExternalLink, Loader2, Search, Trophy } from 'lucide-react';
import AnnualCacheEmptyState from '@/components/AnnualCacheEmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { polishText } from '@/lib/display-text';
import { formatCurrency, formatNumber } from '@/lib/legislative-logic';
import { addMandateScoresToSummaries } from '@/lib/mandate-score';
import { DEFAULT_LEGISLATIVE_YEAR, LEGISLATIVE_YEARS } from '@/lib/legislative-years';
import {
  decorateSummariesWithSensitiveCategory,
  fetchDeputyYearSummaries,
  fetchLiveDeputyYearSummaries,
  getAnnualSummaryBaseStatus,
  isAnnualSummaryDatabaseConfigured,
} from '@/services/annualSummaries';
import { SENSITIVE_CEAP_CATEGORIES } from '@/services/benefits';
import { fetchDeputadoPortalYearSummaries } from '@/services/camaraPortal';

const rankingCategoryOptions = [
  { id: 'score', label: 'Nota geral do mandato' },
  { id: 'total', label: 'Total geral de gastos' },
  ...SENSITIVE_CEAP_CATEGORIES.map((category) => ({
    id: category.id,
    label: polishText(category.shortLabel),
  })),
];

const EXPECTED_CAMARA_SEATS = 513;
const RELIABLE_RANKING_THRESHOLD = 450;

const photoFallback = 'https://www.camara.leg.br/tema/assets/images/foto-deputado-sem-foto.png';

const getDeputyPhotoUrl = (id) =>
  id ? `https://www.camara.leg.br/internet/deputado/bandep/${encodeURIComponent(id)}.jpg` : photoFallback;

const formatPercent = (value) =>
  `${((Number(value) || 0) * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

const getCoverageLabel = ({ sourceMode, count }) => {
  if (sourceMode === 'live') return 'Amostra ao vivo';
  if (sourceMode === 'error') return 'Base indisponível';
  if (count >= RELIABLE_RANKING_THRESHOLD) return 'Base completa';
  if (count > 0) return 'Base parcial';
  return 'Sem base';
};

const getCoverageStyle = ({ sourceMode, count }) => {
  if (sourceMode === 'live') return 'border-yellow-300 bg-yellow-50 text-yellow-900';
  if (sourceMode === 'error' || count === 0) return 'border-red-200 bg-red-50 text-red-800';
  if (count >= RELIABLE_RANKING_THRESHOLD) return 'border-green-200 bg-green-50 text-green-800';
  return 'border-yellow-300 bg-yellow-50 text-yellow-900';
};

const RankingCoveragePanel = ({ sourceMode, sourceMeta, items, year, showCoverage, onToggleCoverage }) => {
  const totalReference = Number(sourceMeta.totalAvailable || EXPECTED_CAMARA_SEATS);
  const count = items.length;
  const coverage = totalReference > 0 ? count / totalReference : 0;
  const coverageLabel = getCoverageLabel({ sourceMode, count });
  const style = getCoverageStyle({ sourceMode, count });
  const isReliable = sourceMode === 'supabase' && count >= RELIABLE_RANKING_THRESHOLD;

  const modeDescription = sourceMode === 'live'
    ? 'Os dados foram buscados em tempo real na API oficial porque o cache do Supabase não estava disponível para este ano.'
    : sourceMode === 'supabase'
      ? 'Os dados vieram do cache anual salvo no Supabase a partir da API oficial da Câmara.'
      : 'Não foi possível carregar a base de rankings agora.';

  return (
    <Card className={`mb-6 border-2 ${style}`}>
      <CardContent className="p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/80">
              {isReliable ? <Trophy className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide">Qualidade da base em {year}</p>
              <h2 className="mt-1 text-2xl font-black text-gray-950">{coverageLabel}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700">{modeDescription}</p>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-700">
                Cobertura atual: <strong>{formatNumber(count)} de {formatNumber(totalReference)}</strong> deputados de referência
                ({formatPercent(coverage)}).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button type="button" variant="outline" className="border-yellow-300 bg-white text-gray-900" onClick={onToggleCoverage}>
              <Database className="mr-2 h-4 w-4" />
              {showCoverage ? 'Ocultar cobertura' : 'Ver cobertura da base'}
            </Button>
            <Button asChild className="bg-yellow-400 text-black hover:bg-yellow-300">
              <Link to="/metodologia">Como funciona</Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/70">
          <div
            className={`h-full ${isReliable ? 'bg-green-600' : sourceMode === 'live' ? 'bg-yellow-500' : 'bg-yellow-600'}`}
            style={{ width: count > 0 ? `${Math.max(2, Math.min(100, coverage * 100))}%` : '0%' }}
          />
        </div>

        {showCoverage && (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-white/70 bg-white p-3">
              <p className="text-xs font-black uppercase text-gray-500">Critério do FISCALIZA</p>
              <p className="mt-1 text-sm text-gray-700">
                Ranking nacional confiável exige pelo menos {formatNumber(RELIABLE_RANKING_THRESHOLD)} deputados sincronizados.
              </p>
            </div>
            <div className="rounded-lg border border-white/70 bg-white p-3">
              <p className="text-xs font-black uppercase text-gray-500">Origem atual</p>
              <p className="mt-1 text-sm text-gray-700">
                {sourceMode === 'live' ? 'API oficial em tempo real, sem cache completo.' : sourceMode === 'supabase' ? 'Supabase, cache anual do FISCALIZA.' : 'Falha de carregamento.'}
              </p>
            </div>
            <div className="rounded-lg border border-white/70 bg-white p-3">
              <p className="text-xs font-black uppercase text-gray-500">Como interpretar</p>
              <p className="mt-1 text-sm text-gray-700">
                {isReliable
                  ? 'Pode ser lido como comparativo nacional de gastos do ano selecionado.'
                  : 'Use como amostra ou lista parcial. Não trate como ranking definitivo.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const sortOptions = {
  score_total: {
    label: 'Maior nota geral',
    compare: (a, b) => Number(b.mandateScore?.value || -1) - Number(a.mandateScore?.value || -1),
  },
  score_total_asc: {
    label: 'Menor nota geral',
    compare: (a, b) => Number(a.mandateScore?.value ?? 99) - Number(b.mandateScore?.value ?? 99),
  },
  total_gasto: {
    label: 'Maior gasto total',
    compare: (a, b) => Number(b.total_gasto) - Number(a.total_gasto),
  },
  total_gasto_asc: {
    label: 'Menor gasto total',
    compare: (a, b) => Number(a.total_gasto) - Number(b.total_gasto),
  },
  media_mensal: {
    label: 'Maior média mensal',
    compare: (a, b) => Number(b.media_mensal) - Number(a.media_mensal),
  },
  media_mensal_asc: {
    label: 'Menor média mensal',
    compare: (a, b) => Number(a.media_mensal) - Number(b.media_mensal),
  },
  quantidade_despesas: {
    label: 'Mais despesas registradas',
    compare: (a, b) => Number(b.quantidade_despesas) - Number(a.quantidade_despesas),
  },
  quantidade_despesas_asc: {
    label: 'Menos despesas registradas',
    compare: (a, b) => Number(a.quantidade_despesas) - Number(b.quantidade_despesas),
  },
  recorte_valor: {
    label: 'Maior valor no recorte',
    compare: (a, b) => Number(b.ranking_value) - Number(a.ranking_value),
  },
  recorte_valor_asc: {
    label: 'Menor valor no recorte',
    compare: (a, b) => Number(a.ranking_value) - Number(b.ranking_value),
  },
  recorte_percentual: {
    label: 'Maior peso no total',
    compare: (a, b) => Number(b.ranking_share) - Number(a.ranking_share),
  },
  nome: {
    label: 'Nome A-Z',
    compare: (a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'),
  },
};

const buildLowSpendingContext = ({ item, listAverage, categoryMode }) => {
  if (categoryMode) return null;

  const total = Number(item.total_gasto || 0);
  const count = Number(item.quantidade_despesas || 0);
  const average = Number(listAverage || 0);
  const isZero = total === 0;
  const isVeryLow = average > 0 ? total > 0 && total < average * 0.12 : total > 0 && total < 5000;
  const hasFewRecords = count <= 5;

  if (!isZero && !isVeryLow && !hasFewRecords) return null;

  const signals = [];
  if (isZero) {
    signals.push('Nenhuma despesa CEAP apareceu no resumo anual sincronizado.');
  } else if (average > 0) {
    signals.push(`O total representa ${formatPercent(total / average)} da média da lista filtrada.`);
  }

  if (hasFewRecords) {
    signals.push(`${formatNumber(count)} despesa(s) registrada(s), quantidade bem pequena para um ano inteiro.`);
  }

  signals.push('Possíveis motivos: uso muito baixo da CEAP, mandato parcial, suplência, licença ou dado oficial ainda incompleto.');

  return {
    title: isZero ? 'Gasto zerado na base' : 'Gasto muito abaixo da curva',
    signals,
    warning:
      'O FISCALIZA não afirma o motivo como fato sem fonte complementar. Para confirmar posse, licença ou mandato parcial, consulte o perfil oficial do parlamentar.',
  };
};

const RankingRow = ({ item, position, categoryLabel, categoryMode, scoreMode, listAverage, year }) => {
  const lowSpendingContext = buildLowSpendingContext({ item, listAverage, categoryMode: categoryMode || scoreMode });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[80px_1fr_160px_160px_140px] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">Posição</p>
            <p className="text-2xl font-black text-gray-900">{position}</p>
          </div>
          <div className="flex min-w-0 items-center gap-4">
            <img
              src={getDeputyPhotoUrl(item.deputado_id)}
              alt={item.nome}
              className="h-14 w-14 shrink-0 rounded-full border border-gray-200 bg-gray-100 object-cover"
              onError={(event) => {
                event.currentTarget.src = photoFallback;
              }}
            />
            <div className="min-w-0">
              <Link to={`/politico/${item.deputado_id}?ano=${year}`} className="text-lg font-extrabold text-gray-900 hover:text-blue-600">
                {item.nome}
              </Link>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{item.partido || '-'}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{item.uf || '-'}</span>
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">Câmara</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Fonte: {polishText(item.source_name)}. Consultado em {item.fetched_at ? new Date(item.fetched_at).toLocaleDateString('pt-BR') : 'data não informada'}.
              </p>
              {item.partyCorrection && (
                <p className="mt-1 text-xs text-blue-600">
                  Partido corrigido com base na fonte oficial: {polishText(item.partyCorrection.sourceName)}.
                </p>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">{scoreMode ? 'Nota geral' : categoryMode ? categoryLabel : 'Total gasto'}</p>
            <p className="font-black text-gray-900">
              {scoreMode
                ? item.mandateScore?.value === null ? 'Sem nota' : `${Number(item.mandateScore.value).toLocaleString('pt-BR', { minimumFractionDigits: 1 })} / 10`
                : formatCurrency(categoryMode ? item.ranking_value : item.total_gasto)}
            </p>
            {scoreMode && <p className="mt-1 text-xs text-gray-500">Cobertura: {item.mandateScore?.coverage || 0}%</p>}
            {categoryMode && !scoreMode && (
              <p className="mt-1 text-xs text-gray-500">{formatPercent(item.ranking_share)} do total anual</p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">{scoreMode ? 'Melhor componente' : categoryMode ? 'Total anual' : 'Média mensal'}</p>
            <p className="font-black text-gray-900">
              {scoreMode
                ? item.mandateScore?.components?.filter((component) => component.score !== null).sort((a, b) => b.score - a.score)[0]?.label || 'Indisponível'
                : formatCurrency(categoryMode ? item.total_gasto : item.media_mensal)}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">{scoreMode ? 'Situação' : categoryMode ? 'Registros no recorte' : 'Despesas'}</p>
            <p className="font-black text-gray-900">
              {scoreMode
                ? item.mandateScore?.status === 'available' ? 'Nota completa' : item.mandateScore?.status === 'partial' ? 'Nota parcial' : 'Sem nota'
                : categoryMode && item.ranking_count === null
                ? 'Não informado'
                : formatNumber(categoryMode ? item.ranking_count : item.quantidade_despesas)}
            </p>
          </div>
        </div>

        {item.maior_fornecedor && (
          <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
            Maior fornecedor: <strong>{item.maior_fornecedor}</strong>
            {item.maior_fornecedor_valor ? ` (${formatCurrency(item.maior_fornecedor_valor)})` : ''}
          </div>
        )}

        {lowSpendingContext && (
          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">
            <p className="font-bold">{lowSpendingContext.title}</p>
            <ul className="mt-2 space-y-1">
              {lowSpendingContext.signals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-blue-800">{lowSpendingContext.warning}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const RankingsPage = () => {
  const [year, setYear] = useState(DEFAULT_LEGISLATIVE_YEAR);
  const [items, setItems] = useState([]);
  const [portalItems, setPortalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('total');
  const [sortBy, setSortBy] = useState('total_gasto');
  const [sourceMode, setSourceMode] = useState('supabase');
  const [sourceMeta, setSourceMeta] = useState({ totalAvailable: EXPECTED_CAMARA_SEATS, source: 'supabase' });
  const [showCoverage, setShowCoverage] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage('');
      setSourceMode('supabase');
      setPortalItems([]);
      setSourceMeta({ totalAvailable: EXPECTED_CAMARA_SEATS, source: 'supabase' });

      const loadLiveFallback = async (reason) => {
        setSourceMode('live');
        setMessage(`${reason} Montando amostra gratuita em tempo real pela API oficial da Câmara...`);
        const liveResult = await fetchLiveDeputyYearSummaries(year, {
          limit: 27,
          concurrency: 3,
          onProgress: ({ current, total }) => {
            setMessage(`Montando amostra oficial em tempo real: ${current} de ${total} deputados consultados.`);
          },
        });
        setItems(liveResult.data || []);
        setSourceMeta({
          totalAvailable: liveResult.totalAvailable || EXPECTED_CAMARA_SEATS,
          limit: liveResult.limit,
          source: liveResult.source,
        });
        setMessage(liveResult.message);
      };

      try {
        const result = await fetchDeputyYearSummaries(year);
        if (result.ok && result.data?.length) {
          setItems(result.data || []);
          const portalResult = await fetchDeputadoPortalYearSummaries(year).catch(() => ({ ok: false, data: [] }));
          setPortalItems(portalResult.data || []);
          setSourceMeta({
            totalAvailable: EXPECTED_CAMARA_SEATS,
            source: 'supabase',
            loaded: result.data.length,
          });
          setMessage('');
        } else if (result.ok) {
          await loadLiveFallback('Nenhum resumo anual foi encontrado no Supabase para este ano.');
        } else {
          await loadLiveFallback('Supabase ainda não está configurado neste ambiente.');
        }
      } catch (error) {
        console.error('Erro ao carregar rankings:', error);
        try {
          await loadLiveFallback('Não foi possível carregar o cache de rankings agora.');
        } catch (fallbackError) {
          console.error('Erro ao carregar rankings ao vivo:', fallbackError);
          setSourceMode('error');
          setSourceMeta({ totalAvailable: EXPECTED_CAMARA_SEATS, source: 'error' });
          setItems([]);
          setMessage('Não foi possível carregar o cache nem a amostra ao vivo da Câmara agora.');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [reloadKey, year]);

  const baseStatus = useMemo(() => getAnnualSummaryBaseStatus(items), [items]);
  const states = useMemo(() => [...new Set(items.map((item) => item.uf).filter(Boolean))].sort(), [items]);
  const parties = useMemo(() => [...new Set(items.map((item) => item.partido).filter(Boolean))].sort(), [items]);
  const selectedCategory = rankingCategoryOptions.find((option) => option.id === categoryFilter) || rankingCategoryOptions[0];
  const scoreMode = categoryFilter === 'score';
  const categoryMode = categoryFilter !== 'total' && !scoreMode;
  const scoredItems = useMemo(
    () => addMandateScoresToSummaries(items, portalItems),
    [items, portalItems]
  );
  const scoreCoverageCount = useMemo(
    () => scoredItems.filter((item) => item.mandateScore?.value !== null).length,
    [scoredItems]
  );
  const rankedItems = useMemo(
    () => categoryMode
      ? decorateSummariesWithSensitiveCategory(scoredItems, categoryFilter)
      : scoredItems,
    [categoryFilter, categoryMode, scoredItems]
  );

  const globallyRankedItems = useMemo(
    () => [...rankedItems]
      .filter((item) => !categoryMode || Number(item.ranking_value) > 0)
      .filter((item) => !scoreMode || item.mandateScore?.value !== null)
      .sort(sortOptions[sortBy]?.compare || sortOptions.total_gasto.compare)
      .map((item, index) => ({ ...item, globalPosition: index + 1 })),
    [categoryMode, rankedItems, scoreMode, sortBy]
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return globallyRankedItems
      .filter((item) => !normalizedSearch || String(item.nome).toLowerCase().includes(normalizedSearch))
      .filter((item) => !stateFilter || item.uf === stateFilter)
      .filter((item) => !partyFilter || item.partido === partyFilter);
  }, [globallyRankedItems, partyFilter, search, stateFilter]);

  const totalRecorte = useMemo(
    () => filteredItems.reduce((acc, item) => acc + Number(scoreMode ? item.mandateScore?.value : categoryMode ? item.ranking_value : item.total_gasto || 0), 0),
    [categoryMode, filteredItems, scoreMode]
  );
  const mediaRecorte = filteredItems.length ? totalRecorte / filteredItems.length : 0;
  const latestFetch = useMemo(() => {
    const dates = filteredItems.map((item) => item.fetched_at).filter(Boolean).sort();
    return dates[dates.length - 1] || null;
  }, [filteredItems]);
  const hasNoBase = !loading && items.length === 0;
  const clearFilters = () => {
    setSearch('');
    setStateFilter('');
    setPartyFilter('');
    setCategoryFilter('total');
    setSortBy('total_gasto');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Helmet>
        <title>Rankings Auditáveis - FISCALIZA</title>
      </Helmet>

      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <Trophy className="mt-1 h-10 w-10 text-blue-600" />
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Rankings auditáveis</h1>
              <p className="mt-2 max-w-3xl text-gray-600">
                Compare gastos e a nota geral calculada pelo FISCALIZA a partir dos resumos anuais oficiais. A nota mostra cobertura, componentes e limitações.
              </p>
            </div>
          </div>

          {!isAnnualSummaryDatabaseConfigured && (
            <div className="mt-5 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              Supabase não configurado. Esta página precisa da tabela pública de resumos anuais.
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!loading && (
          <RankingCoveragePanel
            sourceMode={sourceMode}
            sourceMeta={sourceMeta}
            items={items}
            year={year}
            showCoverage={showCoverage}
            onToggleCoverage={() => setShowCoverage((current) => !current)}
          />
        )}

        <Card className={`mb-6 ${baseStatus.status === 'available' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              {baseStatus.status === 'available' ? (
                <Trophy className="mt-0.5 h-5 w-5 text-green-700" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-700" />
              )}
              <div>
                <h2 className="font-bold text-gray-900">{polishText(baseStatus.label)}</h2>
                <p className="text-sm text-gray-700">{polishText(baseStatus.message)}</p>
                {sourceMode === 'live' && (
                  <p className="mt-1 text-xs font-semibold text-gray-700">
                    Modo atual: amostra parcial ao vivo. Ela mantém a página útil sem custo, mas não substitui o cache anual completo.
                  </p>
                )}
                {baseStatus.warnings.map((warning) => (
                  <p key={warning} className="mt-1 text-xs text-gray-600">{polishText(warning)}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {scoreMode && !loading && (
          <div className={`mb-6 rounded-lg border p-4 text-sm ${scoreCoverageCount >= RELIABLE_RANKING_THRESHOLD ? 'border-green-200 bg-green-50 text-green-900' : 'border-yellow-300 bg-yellow-50 text-yellow-900'}`}>
            <p className="font-bold">
              Cobertura da nota: {formatNumber(scoreCoverageCount)} de {formatNumber(items.length)} deputados da base
            </p>
            <p className="mt-1">
              A nota só aparece quando há pelo menos 50% dos componentes calculáveis. Para ampliar este ranking, o administrador precisa completar os resumos do Portal da Câmara no ano selecionado.
            </p>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Deputados na base</p>
              <p className="text-2xl font-black text-gray-900">{formatNumber(items.length)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Lista filtrada</p>
              <p className="text-2xl font-black text-gray-900">{formatNumber(filteredItems.length)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase text-gray-500">{scoreMode ? 'Nota média da lista' : categoryMode ? 'Total do recorte' : 'Média da lista'}</p>
              <p className="text-2xl font-black text-gray-900">
                {scoreMode ? `${mediaRecorte.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / 10` : formatCurrency(categoryMode ? totalRecorte : mediaRecorte)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Última consulta</p>
              <p className="text-lg font-black text-gray-900">
                {latestFetch ? new Date(latestFetch).toLocaleDateString('pt-BR') : 'Sem dado'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  list="ranking-search-suggestions"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar deputado..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                />
                <datalist id="ranking-search-suggestions">
                  {globallyRankedItems.map((item) => <option key={item.deputado_id || item.id} value={item.nome} />)}
                </datalist>
              </div>
              <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Todos os estados</option>
                {states.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
              <select value={partyFilter} onChange={(event) => setPartyFilter(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Todos os partidos</option>
                {parties.map((party) => <option key={party} value={party}>{party}</option>)}
              </select>
              <select
                value={categoryFilter}
                onChange={(event) => {
                  const nextCategory = event.target.value;
                  setCategoryFilter(nextCategory);
                  setSortBy(nextCategory === 'score' ? 'score_total' : nextCategory === 'total' ? 'total_gasto' : 'recorte_valor');
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {rankingCategoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {Object.entries(sortOptions).map(([value, option]) => (
                  <option key={value} value={value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {LEGISLATIVE_YEARS.map((option) => (
                <Button key={option} size="sm" variant={year === option ? 'default' : 'outline'} onClick={() => setYear(option)}>
                  {option}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {message && !hasNoBase && (
          <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.slice(0, 150).map((item) => (
              <RankingRow
                key={`${item.ano}-${item.deputado_id}`}
                item={item}
                position={item.globalPosition}
                categoryLabel={selectedCategory.label}
                categoryMode={categoryMode}
                scoreMode={scoreMode}
                listAverage={mediaRecorte}
                year={year}
              />
            ))}

            {filteredItems.length > 150 && (
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-600">
                Mostrando os 150 primeiros resultados. Use busca e filtros para refinar.
              </div>
            )}

            {filteredItems.length === 0 && (
              hasNoBase ? (
                <AnnualCacheEmptyState
                  year={year}
                  context="rankings"
                  message={message}
                  onRetry={() => setReloadKey((current) => current + 1)}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-600">
                  <p className="font-semibold text-gray-900">Nenhum deputado encontrado com os filtros selecionados.</p>
                  <p className="mt-2 text-sm">A base existe para este ano, mas o recorte atual ficou vazio.</p>
                  <Button type="button" variant="outline" className="mt-4" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                </div>
              )
            )}
          </div>
        )}

        <Card className="mt-6">
          <CardContent className="p-5 text-sm text-gray-600">
            <p className="mb-2 font-bold text-gray-900">Fonte dos dados</p>
            <p>
              Os valores são calculados pelo FISCALIZA a partir das despesas CEAP retornadas pela API oficial da Câmara dos Deputados. O ranking usa apenas deputados sincronizados no ano selecionado.
            </p>
            <a
              href="https://dadosabertos.camara.leg.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
            >
              Ver API oficial <ExternalLink className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RankingsPage;
