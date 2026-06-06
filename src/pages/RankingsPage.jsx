import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { AlertTriangle, ExternalLink, Loader2, Search, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber } from '@/lib/legislative-logic';
import {
  decorateSummariesWithSensitiveCategory,
  fetchDeputyYearSummaries,
  getAnnualSummaryBaseStatus,
  isAnnualSummaryDatabaseConfigured,
} from '@/services/annualSummaries';
import { SENSITIVE_CEAP_CATEGORIES } from '@/services/benefits';

const rankingCategoryOptions = [
  { id: 'total', label: 'Total geral de gastos' },
  ...SENSITIVE_CEAP_CATEGORIES.map((category) => ({
    id: category.id,
    label: category.shortLabel,
  })),
];

const photoFallback = 'https://www.camara.leg.br/tema/assets/images/foto-deputado-sem-foto.png';

const getDeputyPhotoUrl = (id) =>
  id ? `https://www.camara.leg.br/internet/deputado/bandep/${encodeURIComponent(id)}.jpg` : photoFallback;

const formatPercent = (value) =>
  `${((Number(value) || 0) * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

const sortOptions = {
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

const RankingRow = ({ item, position, categoryLabel, categoryMode, listAverage }) => {
  const lowSpendingContext = buildLowSpendingContext({ item, listAverage, categoryMode });

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
              <Link to={`/politico/${item.deputado_id}`} className="text-lg font-extrabold text-gray-900 hover:text-blue-600">
                {item.nome}
              </Link>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{item.partido || '-'}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{item.uf || '-'}</span>
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">Câmara</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Fonte: {item.source_name}. Consultado em {item.fetched_at ? new Date(item.fetched_at).toLocaleDateString('pt-BR') : 'data não informada'}.
              </p>
              {item.partyCorrection && (
                <p className="mt-1 text-xs text-blue-600">
                  Partido corrigido com base na fonte oficial: {item.partyCorrection.sourceName}.
                </p>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">{categoryMode ? categoryLabel : 'Total gasto'}</p>
            <p className="font-black text-gray-900">{formatCurrency(categoryMode ? item.ranking_value : item.total_gasto)}</p>
            {categoryMode && (
              <p className="mt-1 text-xs text-gray-500">{formatPercent(item.ranking_share)} do total anual</p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">{categoryMode ? 'Total anual' : 'Média mensal'}</p>
            <p className="font-black text-gray-900">{formatCurrency(categoryMode ? item.total_gasto : item.media_mensal)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">{categoryMode ? 'Registros no recorte' : 'Despesas'}</p>
            <p className="font-black text-gray-900">
              {categoryMode && item.ranking_count === null
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
  const [year, setYear] = useState('2025');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('total');
  const [sortBy, setSortBy] = useState('total_gasto');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage('');
      try {
        const result = await fetchDeputyYearSummaries(year);
        if (result.ok) {
          setItems(result.data || []);
        } else {
          setItems([]);
          setMessage('Supabase ainda não está configurado neste ambiente.');
        }
      } catch (error) {
        console.error('Erro ao carregar rankings:', error);
        setItems([]);
        setMessage('Não foi possível carregar a base de rankings agora.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [year]);

  const baseStatus = useMemo(() => getAnnualSummaryBaseStatus(items), [items]);
  const states = useMemo(() => [...new Set(items.map((item) => item.uf).filter(Boolean))].sort(), [items]);
  const parties = useMemo(() => [...new Set(items.map((item) => item.partido).filter(Boolean))].sort(), [items]);
  const selectedCategory = rankingCategoryOptions.find((option) => option.id === categoryFilter) || rankingCategoryOptions[0];
  const categoryMode = categoryFilter !== 'total';
  const rankedItems = useMemo(
    () => decorateSummariesWithSensitiveCategory(items, categoryFilter),
    [categoryFilter, items]
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return [...rankedItems]
      .filter((item) => !normalizedSearch || String(item.nome).toLowerCase().includes(normalizedSearch))
      .filter((item) => !stateFilter || item.uf === stateFilter)
      .filter((item) => !partyFilter || item.partido === partyFilter)
      .filter((item) => !categoryMode || Number(item.ranking_value) > 0)
      .sort(sortOptions[sortBy]?.compare || sortOptions.total_gasto.compare);
  }, [categoryMode, partyFilter, rankedItems, search, sortBy, stateFilter]);

  const totalRecorte = useMemo(
    () => filteredItems.reduce((acc, item) => acc + Number(categoryMode ? item.ranking_value : item.total_gasto || 0), 0),
    [categoryMode, filteredItems]
  );
  const mediaRecorte = filteredItems.length ? totalRecorte / filteredItems.length : 0;
  const latestFetch = useMemo(() => {
    const dates = filteredItems.map((item) => item.fetched_at).filter(Boolean).sort();
    return dates[dates.length - 1] || null;
  }, [filteredItems]);

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
                Compare gastos parlamentares a partir dos resumos anuais sincronizados no Supabase. Todos os valores vêm da API oficial da Câmara e são calculados pelo FISCALIZA.
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
              {baseStatus.status === 'available' ? (
                <Trophy className="mt-0.5 h-5 w-5 text-green-700" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-700" />
              )}
              <div>
                <h2 className="font-bold text-gray-900">{baseStatus.label}</h2>
                <p className="text-sm text-gray-700">{baseStatus.message}</p>
                {baseStatus.warnings.map((warning) => (
                  <p key={warning} className="mt-1 text-xs text-gray-600">{warning}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

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
              <p className="text-xs font-bold uppercase text-gray-500">{categoryMode ? 'Total do recorte' : 'Média da lista'}</p>
              <p className="text-2xl font-black text-gray-900">{formatCurrency(categoryMode ? totalRecorte : mediaRecorte)}</p>
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
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar deputado..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                />
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
                  setSortBy(nextCategory === 'total' ? 'total_gasto' : 'recorte_valor');
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
              {['2023', '2024', '2025', '2026'].map((option) => (
                <Button key={option} size="sm" variant={year === option ? 'default' : 'outline'} onClick={() => setYear(option)}>
                  {option}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {message && (
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
            {filteredItems.slice(0, 150).map((item, index) => (
              <RankingRow
                key={`${item.ano}-${item.deputado_id}`}
                item={item}
                position={index + 1}
                categoryLabel={selectedCategory.label}
                categoryMode={categoryMode}
                listAverage={mediaRecorte}
              />
            ))}

            {filteredItems.length > 150 && (
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-600">
                Mostrando os 150 primeiros resultados. Use busca e filtros para refinar.
              </div>
            )}

            {filteredItems.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
                Nenhum resumo anual encontrado para os filtros selecionados.
              </div>
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
