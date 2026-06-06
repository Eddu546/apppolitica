import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Scale, SearchCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  getAllDeputadosList,
  getDeputadoDespesas,
  getDeputadoDiscursos,
  getDeputadoEventos,
  getDeputadoProposicoes,
  getDeputadoVotacoes,
} from '@/services/camara';
import { buildDeputadoMetrics } from '@/lib/legislative-logic';
import { buildSensitiveCeapSummary } from '@/services/benefits';
import { filterAndSortByName } from '@/lib/search';

const confidenceLabels = {
  high: 'Confianca alta',
  medium: 'Confianca media',
  low: 'Confianca baixa',
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const formatPercent = (value) =>
  `${((Number(value) || 0) * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

const MetricRow = ({ metric }) => (
  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-gray-700">{metric.title}</p>
      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
        {confidenceLabels[metric.confidenceLevel] || metric.status || 'Indisponivel'}
      </span>
    </div>
    <p className="text-2xl font-black text-gray-900 mt-1">
      {metric.value === null || metric.value === undefined ? 'Dado indisponivel' : metric.unit === 'BRL' ? formatCurrency(metric.value) : metric.value}
    </p>
    <p className="text-xs text-gray-500 mt-1">{metric.explanationForCitizen}</p>
  </div>
);

const SensitiveCeapComparisonBlock = ({ summary }) => {
  if (!summary) return null;

  const topCategories = summary.categories.slice(0, 4);

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 mb-5">
      <div className="flex items-start gap-3 mb-4">
        <SearchCheck className="w-5 h-5 text-blue-700 mt-0.5" />
        <div>
          <h3 className="font-bold text-blue-950">Recorte de despesas sensiveis</h3>
          <p className="text-xs text-blue-800">
            Categorias de maior interesse publico na CEAP. Nao indica irregularidade sozinho.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg bg-white p-3 border border-blue-100">
          <p className="text-[11px] font-bold uppercase text-gray-500">Total sensivel</p>
          <p className="font-black text-gray-900">{formatCurrency(summary.sensitiveTotal)}</p>
        </div>
        <div className="rounded-lg bg-white p-3 border border-blue-100">
          <p className="text-[11px] font-bold uppercase text-gray-500">Do total anual</p>
          <p className="font-black text-gray-900">{formatPercent(summary.sensitiveShare)}</p>
        </div>
      </div>

      {topCategories.length ? (
        <div className="space-y-2">
          {topCategories.map((category) => (
            <div key={category.id} className="rounded-lg bg-white p-3 border border-blue-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">{category.shortLabel}</p>
                  <p className="text-xs text-gray-500">{category.count} registro{category.count === 1 ? '' : 's'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">{formatCurrency(category.amount)}</p>
                  <p className="text-xs text-gray-500">{formatPercent(category.shareOfTotal)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-white p-3 border border-blue-100 text-sm text-gray-600">
          Nenhuma categoria sensivel apareceu nas despesas retornadas para este ano.
        </div>
      )}

      <details className="mt-3 text-xs text-blue-900">
        <summary className="cursor-pointer font-bold">Fonte e metodo</summary>
        <p className="mt-1 leading-relaxed">{summary.calculationMethod}</p>
        <p className="mt-1">Fonte: {summary.sourceName}</p>
      </details>
    </div>
  );
};

const DeputySearchPicker = ({ label, deputados, selectedDeputado, onSelect }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(selectedDeputado ? selectedDeputado.nome : '');
  }, [selectedDeputado]);

  const results = useMemo(() => {
    const base = filterAndSortByName(deputados, query, (deputado) => deputado.nome || '');
    return (query.trim() ? base : base.slice(0, 80)).slice(0, 80);
  }, [deputados, query]);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border">
      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{label}</label>
      <div className="relative">
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (!event.target.value.trim()) onSelect(null);
          }}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Digite o nome do deputado..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-white text-sm focus:ring-2 focus:ring-blue-500"
        />

        {open && (
          <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-xl">
            {results.length > 0 ? (
              results.map((dep) => (
                <button
                  key={dep.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelect(dep);
                    setQuery(dep.nome);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-blue-50"
                >
                  <span className="font-semibold text-gray-900">{dep.nome}</span>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                    {dep.siglaPartido}/{dep.siglaUf}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-4 text-sm text-gray-500">
                Nenhum deputado encontrado para essa busca.
              </div>
            )}
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Busca por nome na lista oficial carregada da Camara.
      </p>
    </div>
  );
};

const PoliticianSummary = ({ deputado, anoSelecionado, toast }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ proposicoes: [], despesas: [], eventos: [], discursos: [], votacoes: [] });

  useEffect(() => {
    const fetchIndicadores = async () => {
      if (!deputado) return;
      setLoading(true);
      const ano = parseInt(anoSelecionado, 10);

      try {
        const [proposicoes, despesas, eventos, discursos, votacoes] = await Promise.all([
          getDeputadoProposicoes(deputado.id, ano),
          getDeputadoDespesas(deputado.id, ano),
          getDeputadoEventos(deputado.id, ano),
          getDeputadoDiscursos(deputado.id, ano),
          getDeputadoVotacoes(deputado.id, ano),
        ]);

        setData({
          proposicoes: proposicoes || [],
          despesas: despesas || [],
          eventos: eventos || [],
          discursos: discursos || [],
          votacoes: votacoes || [],
        });
      } catch (error) {
        console.error(`Erro ao carregar indicadores para ${deputado.nome}:`, error);
        toast({ title: 'Erro', description: `Falha ao carregar dados de ${deputado.nome}.`, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchIndicadores();
  }, [deputado, anoSelecionado, toast]);

  const metrics = useMemo(() => buildDeputadoMetrics(data), [data]);
  const sensitiveCeapSummary = useMemo(
    () => buildSensitiveCeapSummary(data.despesas, { deputadoId: deputado?.id, ano: anoSelecionado }),
    [anoSelecionado, data.despesas, deputado?.id]
  );

  if (!deputado) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
        <Users className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">Selecione um deputado para comparar.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4 bg-white rounded-xl border shadow-sm">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
        <p className="text-gray-600 text-sm font-medium">Consultando dados oficiais de {deputado.nome}...</p>
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col shadow-md border-blue-50">
      <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
        <img src={deputado.urlFoto} alt={deputado.nome} className="w-16 h-16 rounded-full object-cover border-2 border-blue-100 shadow-sm" />
        <div className="min-w-0">
          <CardTitle className="text-lg truncate">{deputado.nome}</CardTitle>
          <p className="text-xs text-gray-500 font-bold">{deputado.siglaPartido} / {deputado.siglaUf}</p>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <div className="grid grid-cols-1 gap-3 mb-6">
          <MetricRow metric={metrics.projetosLegislativos} />
          <MetricRow metric={metrics.totalGastoAno} />
          <MetricRow metric={metrics.mediaMensalGasto} />
          <MetricRow metric={metrics.atividades} />
          <MetricRow metric={metrics.votacoesNominais} />
        </div>
        <SensitiveCeapComparisonBlock summary={sensitiveCeapSummary} />
        <Button asChild variant="outline" size="sm" className="w-full mt-auto">
          <Link to={`/politico/${deputado.id}`}>Ver perfil completo <ArrowRight className="ml-2 w-4 h-4" /></Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const ComparisonPage = () => {
  const { toast } = useToast();
  const [deputadosList, setDeputadosList] = useState([]);
  const [selectedDeputado1, setSelectedDeputado1] = useState(null);
  const [selectedDeputado2, setSelectedDeputado2] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [anoSelecionado, setAnoSelecionado] = useState('2024');

  useEffect(() => {
    const fetchDeputados = async () => {
      setLoadingList(true);
      try {
        const data = await getAllDeputadosList();
        setDeputadosList(data || []);
      } catch (error) {
        console.error('Erro ao carregar lista de deputados:', error);
        toast({ title: 'Erro', description: 'Nao foi possivel carregar a lista de deputados.', variant: 'destructive' });
      } finally {
        setLoadingList(false);
      }
    };

    fetchDeputados();
  }, [toast]);

  const anosDisponiveis = ['2023', '2024', '2025'];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Helmet>
        <title>Comparar Indicadores - FISCALIZA</title>
      </Helmet>

      <div className="bg-white border-b shadow-sm pt-6 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Scale className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
              Compare indicadores auditaveis
            </h1>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Compare dados oficiais e limitados lado a lado. O FISCALIZA nao usa score geral nem transforma ausencia de registro em falta.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center gap-2 mb-8">
          {anosDisponiveis.map((ano) => (
            <Button key={ano} variant={anoSelecionado === ano ? 'default' : 'outline'} size="sm" onClick={() => setAnoSelecionado(ano)}>
              {ano}
            </Button>
          ))}
        </div>

        <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          A comparacao mostra dados oficiais lado a lado para facilitar perguntas melhores: quanto foi declarado, em quais categorias e quais dados ficaram indisponiveis. Ela nao define melhor ou pior parlamentar automaticamente.
        </div>

        {loadingList ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Carregando lista de parlamentares...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <DeputySearchPicker
                label="Deputado 1"
                deputados={deputadosList}
                selectedDeputado={selectedDeputado1}
                onSelect={setSelectedDeputado1}
              />
              <PoliticianSummary deputado={selectedDeputado1} anoSelecionado={anoSelecionado} toast={toast} />
            </div>

            <div className="space-y-6">
              <DeputySearchPicker
                label="Deputado 2"
                deputados={deputadosList}
                selectedDeputado={selectedDeputado2}
                onSelect={setSelectedDeputado2}
              />
              <PoliticianSummary deputado={selectedDeputado2} anoSelecionado={anoSelecionado} toast={toast} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonPage;
