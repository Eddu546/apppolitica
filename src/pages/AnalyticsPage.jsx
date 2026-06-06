import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Building2,
  Info,
  Loader2,
  Map,
  PieChart,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie,
} from 'recharts';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllDeputadosList } from '@/services/camara';

const EXPECTED_CAMARA_SEATS = 513;

const IBGE_2022_POPULATION_BY_STATE = {
  AC: 830018,
  AL: 3127683,
  AM: 3941175,
  AP: 733759,
  BA: 14141626,
  CE: 8794957,
  DF: 2817381,
  ES: 3833486,
  GO: 7055228,
  MA: 6775152,
  MG: 20538718,
  MS: 2756700,
  MT: 3658649,
  PA: 8120131,
  PB: 3974495,
  PE: 9058155,
  PI: 3271199,
  PR: 11444380,
  RJ: 16054524,
  RN: 3302406,
  RO: 1581196,
  RR: 636303,
  RS: 10882965,
  SC: 7610361,
  SE: 2210004,
  SP: 44411238,
  TO: 1511460,
};

const regionsMap = {
  Norte: ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
  Nordeste: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
  'Centro-Oeste': ['DF', 'GO', 'MT', 'MS'],
  Sudeste: ['ES', 'MG', 'RJ', 'SP'],
  Sul: ['PR', 'RS', 'SC'],
};

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#f97316', '#7c3aed', '#0ea5e9'];

const formatPercent = (value) =>
  `${((Number(value) || 0) * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

const formatCompactNumber = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    maximumFractionDigits: 0,
  });

const formatDeputiesPerMillion = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getRegionByState = (uf) => {
  for (const [region, states] of Object.entries(regionsMap)) {
    if (states.includes(uf)) return region;
  }
  return 'Não informado';
};

const StatCard = ({ label, value, hint, icon: Icon, colorClass }) => (
  <Card>
    <CardContent className="flex items-center justify-between p-6">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <h3 className="mt-1 text-2xl font-black text-gray-900">{value}</h3>
        {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      </div>
      <div className={`rounded-full p-3 ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
    </CardContent>
  </Card>
);

const AnalyticsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState({
    recordsReturned: 0,
    totalParties: 0,
    largestParty: { sigla: '', count: 0 },
    partyData: [],
    stateData: [],
    regionData: [],
    fetchedAt: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const deputados = await getAllDeputadosList();

        if (!deputados || deputados.length === 0) {
          throw new Error('Lista de deputados vazia');
        }

        const byParty = deputados.reduce((acc, deputy) => {
          const party = deputy.siglaPartido || 'Sem partido informado';
          acc[party] = (acc[party] || 0) + 1;
          return acc;
        }, {});

        const partyData = Object.entries(byParty)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        const byState = deputados.reduce((acc, deputy) => {
          const state = deputy.siglaUf || 'NI';
          acc[state] = (acc[state] || 0) + 1;
          return acc;
        }, {});

        const stateData = Object.entries(byState)
          .map(([name, value]) => {
            const population = IBGE_2022_POPULATION_BY_STATE[name] || 0;
            const deputiesPerMillion = population > 0 ? (value / population) * 1000000 : 0;
            const residentsPerDeputy = value > 0 ? population / value : 0;

            return {
              name,
              value,
              population,
              deputiesPerMillion: Number(deputiesPerMillion.toFixed(3)),
              residentsPerDeputy: Number(residentsPerDeputy.toFixed(0)),
            };
          })
          .sort((a, b) => b.deputiesPerMillion - a.deputiesPerMillion);

        const byRegion = deputados.reduce((acc, deputy) => {
          const region = getRegionByState(deputy.siglaUf);
          acc[region] = (acc[region] || 0) + 1;
          return acc;
        }, {});

        const regionData = Object.entries(byRegion)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        setStats({
          recordsReturned: deputados.length,
          totalParties: partyData.length,
          largestParty: { sigla: partyData[0]?.name || '-', count: partyData[0]?.value || 0 },
          partyData,
          stateData,
          regionData,
          fetchedAt: deputados.__meta?.fetchedAt || new Date().toISOString(),
        });
      } catch (err) {
        console.error('Erro estatísticas:', err);
        setError(true);
        toast({
          title: 'Erro de carregamento',
          description: 'Não foi possível buscar os dados oficiais da Câmara.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const largestPartyShare = stats.recordsReturned
    ? stats.largestParty.count / stats.recordsReturned
    : 0;

  const topRepresentedStates = useMemo(() => stats.stateData.slice(0, 5), [stats.stateData]);
  const lessRepresentedStates = useMemo(() => stats.stateData.slice(-5).reverse(), [stats.stateData]);
  const hasSeatMismatch = stats.recordsReturned !== EXPECTED_CAMARA_SEATS;
  const apiCountHint = stats.recordsReturned > EXPECTED_CAMARA_SEATS
    ? 'A API pode incluir suplentes ou registros de exercício'
    : stats.recordsReturned < EXPECTED_CAMARA_SEATS
      ? 'A consulta retornou menos registros que o total de cadeiras'
      : 'Quantidade compatível com as cadeiras';
  const qualityMessage = stats.recordsReturned > EXPECTED_CAMARA_SEATS
    ? `A Câmara possui ${EXPECTED_CAMARA_SEATS} cadeiras. Nesta consulta, a API retornou ${stats.recordsReturned} registros, possivelmente incluindo suplentes ou registros de exercício.`
    : `A Câmara possui ${EXPECTED_CAMARA_SEATS} cadeiras. Nesta consulta, a API retornou ${stats.recordsReturned} registros, então a leitura pode estar incompleta ou depender de atualização da fonte.`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Estatísticas indisponíveis</h1>
        <p className="max-w-md text-gray-600">
          Não foi possível carregar os dados oficiais da Câmara no momento. Tente atualizar a página em instantes.
        </p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Estatísticas - FISCALIZA</title>
        <meta name="description" content="Estatísticas da composição da Câmara dos Deputados com dados oficiais." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="border-b bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="mb-4 text-3xl font-black text-gray-900 md:text-4xl">
                Estatísticas Parlamentares
              </h1>
              <p className="text-xl text-gray-600">
                Visão geral da composição da Câmara dos Deputados a partir dos registros retornados pela fonte oficial.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Cadeiras na Câmara"
              value={EXPECTED_CAMARA_SEATS}
              hint="Referência institucional da Câmara dos Deputados"
              icon={Users}
              colorClass="bg-blue-100 text-blue-600"
            />
            <StatCard
              label="Registros consultados"
              value={stats.recordsReturned}
              hint={apiCountHint}
              icon={BarChart3}
              colorClass="bg-orange-100 text-orange-600"
            />
            <StatCard
              label="Partidos representados"
              value={stats.totalParties}
              hint="Contagem das siglas presentes na lista consultada"
              icon={Building2}
              colorClass="bg-green-100 text-green-600"
            />
            <StatCard
              label="Maior bancada"
              value={stats.largestParty.sigla}
              hint={`${stats.largestParty.count} registros, ${formatPercent(largestPartyShare)} da lista`}
              icon={TrendingUp}
              colorClass="bg-purple-100 text-purple-600"
            />
          </div>

          {hasSeatMismatch && (
            <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm leading-relaxed text-yellow-900">
              <div className="mb-1 flex items-center gap-2 font-bold text-yellow-950">
                <Info className="h-4 w-4" />
                Leitura cuidadosa da base
              </div>
              {qualityMessage} Por isso, esta página não chama todos esses registros de “deputados ativos”; ela mostra a composição da lista oficial consultada e sinaliza a diferença.
            </div>
          )}

          <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className="h-[400px]">
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição por partido (top 10)</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.partyData.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={72} tick={{ fontWeight: 'bold' }} />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                        {stats.partyData.slice(0, 10).map((entry, index) => (
                          <Cell key={`party-${entry.name}`} fill={index < 3 ? '#2563eb' : '#93c5fd'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Card className="h-[400px]">
                <CardHeader>
                  <CardTitle className="text-lg">Bancadas por região</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={stats.regionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {stats.regionData.map((entry, index) => (
                          <Cell key={`region-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <Card className="h-[450px]">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg"><Map className="mr-2 h-5 w-5" /> Representação por habitante</CardTitle>
                </CardHeader>
                <CardContent className="h-[370px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.stateData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === 'deputiesPerMillion') {
                            return [`${formatDeputiesPerMillion(value)} deputados por milhão`, 'Representação proporcional'];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(label, payload) => {
                          const item = payload?.[0]?.payload;
                          if (!item) return label;
                          return `${label}: ${item.value} deputados, ${formatCompactNumber(item.population)} habitantes`;
                        }}
                      />
                      <Bar dataKey="deputiesPerMillion" fill="#10b981" radius={[4, 4, 0, 0]}>
                        {stats.stateData.map((entry) => (
                          <Cell key={`state-${entry.name}`} fill={entry.deputiesPerMillion >= 5 ? '#059669' : '#86efac'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  <h2 className="font-black text-gray-950">Como usar esta página</h2>
                </div>
                <div className="space-y-4 text-sm leading-relaxed text-gray-700">
                  <p>
                    Esta tela ajuda a entender a distribuição política da Câmara antes de comparar gastos, votos ou proposições.
                  </p>
                  <p>
                    A maior bancada da lista é <strong>{stats.largestParty.sigla}</strong>, com {stats.largestParty.count} registros.
                    Isso indica peso político, não desempenho individual.
                  </p>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="mb-2 font-bold text-gray-900">Mais representação por habitante</p>
                    <ul className="space-y-1">
                      {topRepresentedStates.map((state) => (
                        <li key={state.name} className="flex justify-between">
                          <span>{state.name}</span>
                          <strong>{formatDeputiesPerMillion(state.deputiesPerMillion)}/mi</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="mb-2 font-bold text-gray-900">Menos representação por habitante</p>
                    <ul className="space-y-1">
                      {lessRepresentedStates.map((state) => (
                        <li key={state.name} className="flex justify-between">
                          <span>{state.name}</span>
                          <strong>{formatDeputiesPerMillion(state.deputiesPerMillion)}/mi</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-gray-500">
                    Fontes: Câmara dos Deputados - Dados Abertos; população residente do Censo 2022 do IBGE. Atualizado em{' '}
                    {stats.fetchedAt ? new Date(stats.fetchedAt).toLocaleString('pt-BR') : 'data não informada'}.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsPage;
