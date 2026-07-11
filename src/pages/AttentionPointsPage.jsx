import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { AlertTriangle, ExternalLink, Filter, Loader2, Search, ShieldAlert } from 'lucide-react';
import AnnualCacheEmptyState from '@/components/AnnualCacheEmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { polishText } from '@/lib/display-text';
import { DEFAULT_LEGISLATIVE_YEAR, LEGISLATIVE_YEARS } from '@/lib/legislative-years';
import { formatCurrency } from '@/lib/legislative-logic';
import { getReadableSourceUrl, isInternalPath } from '@/lib/official-links';
import {
  buildSpendingAttentionPoints,
  fetchDeputyYearSummaries,
  fetchLiveDeputyYearSummaries,
  getAnnualSummaryBaseStatus,
  isAnnualSummaryDatabaseConfigured,
} from '@/services/annualSummaries';
import { SENSITIVE_CEAP_CATEGORIES } from '@/services/benefits';

const levelStyles = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const typeLabels = {
  supplier_concentration: 'Concentração em fornecedor',
  above_average_spending: 'Acima da média',
  sensitive_category_share: 'Categoria sensível',
  unusually_low_spending: 'Gasto muito baixo',
  possible_partial_mandate: 'Possível mandato parcial',
  missing_expense_data: 'Ausência de dados',
};

const typeDescriptions = {
  supplier_concentration: 'Um fornecedor concentrou parte relevante das despesas declaradas.',
  above_average_spending: 'O gasto total ficou acima da média da base sincronizada.',
  sensitive_category_share: 'Uma categoria sensível teve peso alto dentro do total anual.',
  unusually_low_spending: 'O gasto ficou muito abaixo da média e merece conferência de contexto.',
  possible_partial_mandate: 'Poucos registros podem indicar mandato parcial, licença, suplência ou baixo uso da cota.',
  missing_expense_data: 'Nenhuma despesa apareceu no resumo sincronizado para o ano.',
};

const typeOrder = [
  'above_average_spending',
  'sensitive_category_share',
  'supplier_concentration',
  'unusually_low_spending',
  'possible_partial_mandate',
  'missing_expense_data',
];

const deputyPhotoFallback = 'https://www.camara.leg.br/tema/assets/images/foto-deputado-sem-foto.png';

const getDeputyPhotoUrl = (id) =>
  id ? `https://www.camara.leg.br/internet/deputado/bandep/${encodeURIComponent(id)}.jpg` : deputyPhotoFallback;

const AttentionPointCard = ({ point }) => {
  const readableSourceUrl = getReadableSourceUrl({ sourceUrl: point.sourceUrl });

  return (
  <Card>
    <CardContent className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${levelStyles[point.level] || levelStyles.medium}`}>
              {point.level === 'high' ? 'Atenção alta' : 'Atenção média'}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
              {typeLabels[point.type] || polishText(point.title)}
            </span>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{point.year}</span>
          </div>

          <div className="flex items-center gap-4">
            <img
              src={getDeputyPhotoUrl(point.deputyId)}
              alt={point.deputyName}
              className="h-16 w-16 shrink-0 rounded-full border border-gray-200 bg-gray-100 object-cover"
              onError={(event) => {
                event.currentTarget.src = deputyPhotoFallback;
              }}
            />
            <div>
              <Link to={`/politico/${point.deputyId}`} className="text-xl font-extrabold text-gray-900 hover:text-blue-600">
                {point.deputyName}
              </Link>
              <p className="text-sm text-gray-500">
                {point.party || '-'} / {point.state || '-'}
              </p>
            </div>
          </div>

          <p className="max-w-3xl text-sm leading-relaxed text-gray-700">{polishText(point.explanation)}</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-bold uppercase text-gray-500">Valor relacionado</p>
              <p className="font-black text-gray-900">{formatCurrency(point.amount || 0)}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-bold uppercase text-gray-500">Total anual</p>
              <p className="font-black text-gray-900">{formatCurrency(point.total || point.amount || 0)}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-bold uppercase text-gray-500">Referência</p>
              <p className="font-black text-gray-900">
                {polishText(point.categoryLabel || point.supplier || (point.average ? `Média: ${formatCurrency(point.average)}` : 'Base sincronizada'))}
              </p>
              {point.recordCount !== undefined && (
                <p className="mt-1 text-xs text-gray-500">
                  {point.recordCount === null ? 'Registros: não informado' : `${point.recordCount} registro${point.recordCount === 1 ? '' : 's'}`}
                </p>
              )}
            </div>
          </div>

          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer font-bold text-gray-700">Como foi calculado</summary>
            <p className="mt-1">{polishText(point.calculationMethod)}</p>
          </details>
        </div>

        {readableSourceUrl && (
          isInternalPath(readableSourceUrl) ? (
            <Link
              to={readableSourceUrl}
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
            >
              Fonte explicada <ExternalLink className="h-4 w-4" />
            </Link>
          ) : (
            <a
              href={readableSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
            >
              Fonte oficial <ExternalLink className="h-4 w-4" />
            </a>
          )
        )}
      </div>
    </CardContent>
  </Card>
  );
};

const AttentionPointsPage = () => {
  const [year, setYear] = useState(DEFAULT_LEGISLATIVE_YEAR);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [sourceMode, setSourceMode] = useState('supabase');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage('');
      setSourceMode('supabase');

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
        setSummaries(liveResult.data || []);
        setMessage(liveResult.message);
      };

      try {
        const result = await fetchDeputyYearSummaries(year);
        if (result.ok && result.data?.length) {
          setSummaries(result.data || []);
          setMessage('');
        } else if (result.ok) {
          await loadLiveFallback('Nenhum resumo anual foi encontrado no Supabase para este ano.');
        } else {
          await loadLiveFallback('Supabase ainda não está configurado neste ambiente.');
        }
      } catch (error) {
        console.error('Erro ao carregar pontos de atenção:', error);
        try {
          await loadLiveFallback('Não foi possível carregar o cache de pontos de atenção agora.');
        } catch (fallbackError) {
          console.error('Erro ao carregar pontos de atenção ao vivo:', fallbackError);
          setSourceMode('error');
          setSummaries([]);
          setMessage('Não foi possível carregar o cache nem a amostra ao vivo da Câmara agora.');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [reloadKey, year]);

  const baseStatus = useMemo(() => getAnnualSummaryBaseStatus(summaries), [summaries]);
  const points = useMemo(() => buildSpendingAttentionPoints(summaries), [summaries]);
  const states = useMemo(() => [...new Set(summaries.map((item) => item.uf).filter(Boolean))].sort(), [summaries]);
  const parties = useMemo(() => [...new Set(summaries.map((item) => item.partido).filter(Boolean))].sort(), [summaries]);

  const filteredPoints = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return points
      .filter((point) => !normalizedSearch || point.deputyName.toLowerCase().includes(normalizedSearch))
      .filter((point) => !stateFilter || point.state === stateFilter)
      .filter((point) => !partyFilter || point.party === partyFilter)
      .filter((point) => !typeFilter || point.type === typeFilter)
      .filter((point) => !categoryFilter || point.categoryId === categoryFilter)
      .filter((point) => !levelFilter || point.level === levelFilter);
  }, [categoryFilter, levelFilter, partyFilter, points, search, stateFilter, typeFilter]);
  const pointsByType = useMemo(
    () => typeOrder.map((type) => ({
      type,
      label: typeLabels[type],
      description: typeDescriptions[type],
      count: filteredPoints.filter((point) => point.type === type).length,
      total: points.filter((point) => point.type === type).length,
    })),
    [filteredPoints, points]
  );
  const hasNoBase = !loading && summaries.length === 0;
  const clearFilters = () => {
    setSearch('');
    setStateFilter('');
    setPartyFilter('');
    setTypeFilter('');
    setCategoryFilter('');
    setLevelFilter('');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Helmet>
        <title>Pontos de Atenção - FISCALIZA</title>
      </Helmet>

      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <ShieldAlert className="mt-1 h-10 w-10 text-yellow-600" />
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Pontos de atenção</h1>
              <p className="mt-2 max-w-3xl text-gray-600">
                Sinais para orientar fiscalização cidadã. Estes alertas não acusam irregularidade; eles mostram padrões que merecem leitura da fonte oficial.
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
        <Card className={`mb-6 ${baseStatus.status === 'available' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-700" />
              <div>
                <h2 className="font-bold text-gray-900">{polishText(baseStatus.label)}</h2>
                <p className="text-sm text-gray-700">{polishText(baseStatus.message)}</p>
                {sourceMode === 'live' && (
                  <p className="mt-1 text-xs font-semibold text-gray-700">
                    Modo atual: amostra parcial ao vivo. Ela mantém a página útil sem custo, mas não substitui o cache anual completo.
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-600">
                  Mesmo com base completa, estes pontos são indicadores de triagem, não conclusões sobre conduta.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar deputado..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Todos os estados</option>
                {states.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
              <select value={partyFilter} onChange={(event) => setPartyFilter(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Todos os partidos</option>
                {parties.map((party) => (
                  <option key={party} value={party}>
                    {party}
                  </option>
                ))}
              </select>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Todos os tipos</option>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Todas as categorias</option>
                {SENSITIVE_CEAP_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {polishText(category.shortLabel)}
                  </option>
                ))}
              </select>
              <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Todos os níveis</option>
                <option value="high">Atenção alta</option>
                <option value="medium">Atenção média</option>
              </select>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {LEGISLATIVE_YEARS.map((option) => (
                <Button key={option} size="sm" variant={year === option ? 'default' : 'outline'} onClick={() => setYear(option)}>
                  {option}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={clearFilters}
              >
                <Filter className="mr-1 h-4 w-4" />
                Limpar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Pontos encontrados</p>
              <p className="text-2xl font-black text-gray-900">{filteredPoints.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Atenção alta</p>
              <p className="text-2xl font-black text-red-700">{filteredPoints.filter((point) => point.level === 'high').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Atenção média</p>
              <p className="text-2xl font-black text-yellow-700">{filteredPoints.filter((point) => point.level === 'medium').length}</p>
            </CardContent>
          </Card>
        </div>

        {!loading && points.length > 0 && (
          <Card className="mb-6 border-yellow-200">
            <CardContent className="p-5">
              <div className="mb-4">
                <h2 className="text-lg font-black text-gray-950">Tipos de ponto de atenção</h2>
                <p className="mt-1 text-sm text-gray-600">
                  A separação abaixo ajuda a investigar sem misturar sinais diferentes. Nenhum item é acusação; todos pedem leitura da fonte.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {pointsByType.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setTypeFilter((current) => (current === item.type ? '' : item.type))}
                    className={`rounded-xl border p-4 text-left transition ${
                      typeFilter === item.type
                        ? 'border-yellow-400 bg-yellow-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-yellow-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-gray-950">{item.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-600">{item.description}</p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-black text-gray-800">
                        {item.count}
                      </span>
                    </div>
                    {item.total !== item.count && (
                      <p className="mt-2 text-xs text-gray-500">{item.total} no total antes dos filtros.</p>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
          <div className="space-y-4">
            {filteredPoints.slice(0, 150).map((point) => (
              <AttentionPointCard key={point.id} point={point} />
            ))}

            {filteredPoints.length > 150 && (
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-600">
                Mostrando os 150 primeiros pontos. Use filtros para refinar.
              </div>
            )}

            {filteredPoints.length === 0 && (
              hasNoBase ? (
                <AnnualCacheEmptyState
                  year={year}
                  context="attention"
                  message={message}
                  onRetry={() => setReloadKey((current) => current + 1)}
                />
              ) : points.length === 0 ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-12 text-center text-green-900">
                  <p className="font-bold">Nenhum ponto de atenção pelos critérios atuais.</p>
                  <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed">
                    A base de despesas foi carregada, mas os critérios do FISCALIZA não encontraram concentração relevante,
                    gasto fora da média, categoria sensível com peso alto, poucos registros ou ausência de dados neste recorte.
                    Isso não é atestado de regularidade; apenas significa que nada foi sinalizado automaticamente.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-600">
                  <p className="font-semibold text-gray-900">Nenhum ponto aparece com os filtros selecionados.</p>
                  <p className="mt-2 text-sm">A base existe para este ano, mas o recorte atual ficou vazio.</p>
                  <Button type="button" variant="outline" className="mt-4" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttentionPointsPage;
