import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, BarChart3, DollarSign, ExternalLink, FileText, ListChecks, Loader2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AusteritySealPanel from '@/components/AusteritySealPanel';
import ExpenseComparisonPanel from '@/components/ExpenseComparisonPanel';
import ProfileAttentionPanel from '@/components/ProfileAttentionPanel';
import SensitiveCeapPanel from '@/components/SensitiveCeapPanel';
import { useToast } from '@/components/ui/use-toast';
import TrustMetricCard from '@/components/TrustMetricCard';
import ValidatedMetricsPanel from '@/components/ValidatedMetricsPanel';
import VotingHighlightsPanel from '@/components/VotingHighlightsPanel';
import { polishText } from '@/lib/display-text';
import {
  buildDeputadoMetrics,
  buildFiscalizationIndex,
  filterComplexProjects,
  formatCurrency,
  groupExpensesByMonth,
  groupExpensesByType,
} from '@/lib/legislative-logic';
import {
  buildDeputyAnnualExpenseSummary,
  buildSpendingAttentionPoints,
  computeExpenseComparisons,
  fetchDeputyYearSummaries,
} from '@/services/annualSummaries';
import {
  getDeputadoDespesas,
  getDeputadoDiscursos,
  getDeputadoEventos,
  getDeputadoInfo,
  getDeputadoProposicoes,
  getDeputadoVotacoes,
} from '@/services/camara';
import {
  analyzeVehicleRentalExpenses,
  buildAusteritySeal,
  buildSensitiveCeapSummary,
  fetchDeputyHousingBenefits,
} from '@/services/benefits';
import { fetchValidatedMetrics } from '@/services/corrections';

const ProjectList = ({ lista }) => (
  <div className="space-y-3">
    {lista.slice(0, 12).map((proj) => (
      <div key={proj.id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start gap-2 mb-2">
          <span className="text-[11px] uppercase font-bold px-2 py-1 rounded bg-slate-100 text-slate-700">
            {proj.siglaTipo} {proj.numero}/{proj.ano}
          </span>
          <a href={`https://www.camara.leg.br/propostas-legislativas/${proj.id}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 text-gray-400 hover:text-blue-600" />
          </a>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{polishText(proj.ementa)}</p>
      </div>
    ))}
    {lista.length === 0 && (
      <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        Nenhuma proposição foi retornada pela API para este período.
      </div>
    )}
  </div>
);

const PoliticianProfilePage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [anoSelecionado, setAnoSelecionado] = useState('2024');
  const [politico, setPolitico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partialError, setPartialError] = useState(false);
  const [proposicoes, setProposicoes] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [discursos, setDiscursos] = useState([]);
  const [votacoes, setVotacoes] = useState([]);
  const [metricasValidadas, setMetricasValidadas] = useState([]);
  const [expenseComparison, setExpenseComparison] = useState(null);
  const [attentionPoints, setAttentionPoints] = useState([]);
  const [austeritySeal, setAusteritySeal] = useState(null);

  const anosDisponiveis = ['2023', '2024', '2025'];

  useEffect(() => {
    const carregarDados = async () => {
      if (!id) return;
      setLoading(true);
      setPartialError(false);
      setAusteritySeal(null);

      try {
        const dataInfo = await getDeputadoInfo(id);
        if (!dataInfo) throw new Error('Perfil não encontrado');

        setPolitico(dataInfo);
        const nomeParlamentar = dataInfo.ultimoStatus?.nomeEleitoral || dataInfo.nomeEleitoral;
        const ano = parseInt(anoSelecionado, 10);
        const [
          listaProposicoes,
          listaDespesas,
          listaEventos,
          listaDiscursos,
          listaVotacoes,
          listaValidadas,
          moradia,
        ] = await Promise.all([
          getDeputadoProposicoes(id, ano),
          getDeputadoDespesas(id, ano),
          getDeputadoEventos(id, ano),
          getDeputadoDiscursos(id, ano),
          getDeputadoVotacoes(id, ano),
          nomeParlamentar
            ? fetchValidatedMetrics({ parlamentar: nomeParlamentar, ano: anoSelecionado })
              .then((result) => result.data || [])
              .catch(() => [])
            : Promise.resolve([]),
          fetchDeputyHousingBenefits(id),
        ]);

        if (!listaProposicoes || !listaDespesas || !listaEventos || !listaDiscursos || !listaVotacoes) {
          setPartialError(true);
        }

        setProposicoes(listaProposicoes || []);
        setDespesas(listaDespesas || []);
        setEventos(listaEventos || []);
        setDiscursos(listaDiscursos || []);
        setVotacoes(listaVotacoes || []);
        setMetricasValidadas(listaValidadas || []);
        setAusteritySeal(
          buildAusteritySeal({
            vehicleRental: analyzeVehicleRentalExpenses(listaDespesas || [], { deputadoId: id, ano: anoSelecionado }),
            housingBenefits: moradia,
          })
        );

        const currentSummary = buildDeputyAnnualExpenseSummary({
          deputado: dataInfo,
          despesas: listaDespesas || [],
          ano: anoSelecionado,
        });
        const summariesResult = await fetchDeputyYearSummaries(anoSelecionado).catch(() => ({ ok: false, data: [] }));
        const annualSummaries = summariesResult.data || [];
        setExpenseComparison(computeExpenseComparisons(currentSummary, annualSummaries));
        setAttentionPoints(
          buildSpendingAttentionPoints([...annualSummaries, currentSummary])
            .filter((point) => String(point.deputyId) === String(currentSummary.deputado_id))
        );
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        toast({ title: 'Erro', description: 'Não foi possível carregar os dados oficiais.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [id, anoSelecionado, toast]);

  const metrics = useMemo(
    () => buildDeputadoMetrics({ proposicoes, despesas, eventos, discursos, votacoes }),
    [proposicoes, despesas, eventos, discursos, votacoes]
  );
  const fiscalizationIndex = useMemo(() => buildFiscalizationIndex(metrics), [metrics]);
  const projetosComplexos = useMemo(() => filterComplexProjects(proposicoes), [proposicoes]);
  const graficoData = useMemo(() => groupExpensesByType(despesas), [despesas]);
  const graficoMensal = useMemo(() => groupExpensesByMonth(despesas), [despesas]);
  const sensitiveCeapSummary = useMemo(
    () => buildSensitiveCeapSummary(despesas, { deputadoId: id, ano: anoSelecionado }),
    [despesas, id, anoSelecionado]
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-12 h-12 text-blue-600 animate-spin" /></div>;
  }

  if (!politico) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Deputado não encontrado.</div>;
  }

  const info = politico.ultimoStatus || politico;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Helmet><title>{info.nomeEleitoral} - FISCALIZA</title></Helmet>

      <div className="bg-white border-b shadow-sm pt-6 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/deputados" className="text-gray-500 hover:text-blue-600 inline-flex items-center text-sm mb-6 font-medium">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Link>
          <div className="flex flex-col md:flex-row gap-8">
            <img src={info.urlFoto} alt={info.nomeEleitoral} className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-xl bg-gray-200" />
            <div className="flex-1">
              <h1 className="text-4xl font-extrabold text-gray-900">{info.nomeEleitoral}</h1>
              <p className="text-lg text-gray-600 mt-2">{info.siglaPartido} / {info.siglaUf}</p>
              {info.partyCorrection && (
                <p className="mt-1 text-xs font-semibold text-blue-700">
                  Partido confirmado pela fonte oficial: {info.partyCorrection.sourceName}
                </p>
              )}
              <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                Este perfil mostra apenas indicadores auditáveis ou explicitamente limitados. O FISCALIZA não calcula faltas, relatorias aprovadas ou score geral quando a API não sustenta esse número diretamente.
              </div>
              {partialError && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg" role="alert">
                  <p className="font-bold flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Dados parciais</p>
                  <p>Algumas consultas oficiais falharam. Os indicadores podem estar incompletos.</p>
                </div>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 min-w-[220px]">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Ano consultado</p>
              <div className="flex gap-2 mt-3">
                {anosDisponiveis.map((ano) => (
                  <Button key={ano} variant={anoSelecionado === ano ? 'default' : 'outline'} size="sm" onClick={() => setAnoSelecionado(ano)}>
                    {ano}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <AusteritySealPanel seal={austeritySeal} />
        </div>

        <Tabs defaultValue="indicadores" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="indicadores"><BarChart3 className="w-4 h-4 mr-2" /> Indicadores</TabsTrigger>
            <TabsTrigger value="proposicoes"><FileText className="w-4 h-4 mr-2" /> Proposições</TabsTrigger>
            <TabsTrigger value="votacoes"><ListChecks className="w-4 h-4 mr-2" /> Votações</TabsTrigger>
            <TabsTrigger value="gastos"><DollarSign className="w-4 h-4 mr-2" /> Gastos</TabsTrigger>
          </TabsList>

          <TabsContent value="indicadores" className="mt-6">
            <div className="mb-5">
              <ValidatedMetricsPanel items={metricasValidadas} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <TrustMetricCard metric={metrics.proposicoes} />
              <TrustMetricCard metric={metrics.projetosLegislativos} />
              <TrustMetricCard metric={metrics.totalGastoAno} />
              <TrustMetricCard metric={metrics.mediaMensalGasto} />
              <TrustMetricCard metric={metrics.quantidadeDespesas} />
              <TrustMetricCard metric={metrics.maiorFornecedor} />
              <TrustMetricCard metric={metrics.atividades} />
              <TrustMetricCard metric={metrics.discursos} />
              <TrustMetricCard metric={metrics.votacoesNominais} />
              <TrustMetricCard metric={metrics.relatorias} />
              <TrustMetricCard metric={metrics.presenca} />
              <TrustMetricCard metric={fiscalizationIndex} />
            </div>
          </TabsContent>

          <TabsContent value="proposicoes" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900">Proposições legislativas encontradas</h2>
                  <p className="text-sm text-gray-600">Fonte: Dados Abertos da Câmara. Esta lista não representa relatorias aprovadas.</p>
                </div>
                <ProjectList lista={projetosComplexos} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="votacoes" className="mt-6">
            <VotingHighlightsPanel votacoes={votacoes} ano={anoSelecionado} metric={metrics.votacoesNominais} />
          </TabsContent>

          <TabsContent value="gastos" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-bold mb-2">Gastos da cota parlamentar ({anoSelecionado})</h2>
                <p className="text-3xl font-bold mb-1">{formatCurrency(metrics.totalGastoAno.value || 0)}</p>
                <p className="text-sm text-gray-600 mb-6">
                  Fonte: Dados Abertos da Câmara. Soma dos valores líquidos retornados pela API. CEAP é a cota usada para despesas ligadas ao mandato parlamentar.
                </p>
                <div className="mb-6">
                  <ProfileAttentionPanel points={attentionPoints} />
                </div>
                <div className="mb-6">
                  <ExpenseComparisonPanel comparison={expenseComparison} ano={anoSelecionado} />
                </div>
                <div className="mb-6">
                  <SensitiveCeapPanel summary={sensitiveCeapSummary} />
                </div>
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={graficoData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="value" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8">
                  <h3 className="font-bold mb-2">Evolução mensal de gastos</h3>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={graficoMensal}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="value" fill="#0f766e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PoliticianProfilePage;
