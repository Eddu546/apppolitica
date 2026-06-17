import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  Database,
  ExternalLink,
  FileSearch,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { polishText } from '@/lib/display-text';
import {
  formatCurrency,
  formatNumber,
  getTopSupplier,
  groupExpensesByMonth,
  groupExpensesByType,
} from '@/lib/legislative-logic';
import {
  getDeputadoDespesas,
  getDeputadoDiscursos,
  getDeputadoEventos,
  getDeputadoInfo,
  getDeputadoProposicoes,
  getDeputadoVotacoes,
} from '@/services/camara';

const formatDateTime = (date) => {
  if (!date) return 'Não informado';
  return new Date(date).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const parseMoney = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getOfficialExpenseUrl = (deputadoId, ano) =>
  `https://dadosabertos.camara.leg.br/api/v2/deputados/${encodeURIComponent(deputadoId)}/despesas?ano=${encodeURIComponent(ano)}&ordem=DESC&ordenarPor=dataDocumento`;

const getOfficialPropositionsUrl = (deputadoId, ano) =>
  `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=${encodeURIComponent(deputadoId)}&ano=${encodeURIComponent(ano)}`;

const getOfficialEventsUrl = (deputadoId, ano) =>
  `https://dadosabertos.camara.leg.br/api/v2/deputados/${encodeURIComponent(deputadoId)}/eventos?dataInicio=${encodeURIComponent(ano)}-01-01&dataFim=${encodeURIComponent(ano)}-12-31`;

const getOfficialSpeechesUrl = (deputadoId, ano) =>
  `https://dadosabertos.camara.leg.br/api/v2/deputados/${encodeURIComponent(deputadoId)}/discursos?dataInicio=${encodeURIComponent(ano)}-01-01&dataFim=${encodeURIComponent(ano)}-12-31`;

const getOfficialVotesUrl = () => 'https://dadosabertos.camara.leg.br/api/v2/votacoes';

const DATASET_CONFIGS = {
  despesas: {
    label: 'Despesas parlamentares',
    shortLabel: 'despesas',
    fetcher: getDeputadoDespesas,
    officialUrl: getOfficialExpenseUrl,
  },
  proposicoes: {
    label: 'Proposições de autoria',
    shortLabel: 'proposições',
    fetcher: getDeputadoProposicoes,
    officialUrl: getOfficialPropositionsUrl,
    calculationMethod: 'Contagem das proposições retornadas pela API da Câmara para o deputado e o ano selecionado.',
    citizenExplanation: 'Mostra propostas apresentadas ou assinadas retornadas pela fonte oficial. Não significa que foram aprovadas.',
    limitation: 'Não mede qualidade, impacto, aprovação nem relatoria.',
    itemTitle: (item) => `${item.siglaTipo || 'Proposição'} ${item.numero || ''}${item.ano ? `/${item.ano}` : ''}`.trim(),
    itemDescription: (item) => item.ementa || item.descricaoTipo || 'Sem descrição retornada pela fonte.',
    itemDate: (item) => item.dataApresentacao,
  },
  eventos: {
    label: 'Atividades registradas',
    shortLabel: 'eventos',
    fetcher: getDeputadoEventos,
    officialUrl: getOfficialEventsUrl,
    calculationMethod: 'Contagem de eventos oficiais retornados pela agenda da Câmara para o deputado e ano consultados.',
    citizenExplanation: 'Mostra atividades registradas na base oficial. Pode não representar toda a atividade política do parlamentar.',
    limitation: 'Não deve ser lido sozinho como presença em plenário, falta ou produtividade total.',
    itemTitle: (item) => item.descricaoTipo || item.titulo || 'Evento oficial',
    itemDescription: (item) => item.descricao || item.localCamara?.nome || item.situacao || 'Sem descrição retornada pela fonte.',
    itemDate: (item) => item.dataHoraInicio,
  },
  discursos: {
    label: 'Discursos registrados',
    shortLabel: 'discursos',
    fetcher: getDeputadoDiscursos,
    officialUrl: getOfficialSpeechesUrl,
    calculationMethod: 'Contagem dos discursos retornados pela API da Câmara para o período consultado.',
    citizenExplanation: 'Mostra discursos encontrados oficialmente para o deputado no ano selecionado.',
    limitation: 'Não mede qualidade, duração, impacto político ou conteúdo completo do mandato.',
    itemTitle: (item) => item.tipoDiscurso || item.faseEvento?.titulo || 'Discurso registrado',
    itemDescription: (item) => item.sumario || item.transcricao?.slice?.(0, 260) || 'Sem resumo retornado pela fonte.',
    itemDate: (item) => item.dataHoraInicio,
  },
  votacoes: {
    label: 'Votações relevantes com voto registrado',
    shortLabel: 'votações',
    fetcher: getDeputadoVotacoes,
    officialUrl: getOfficialVotesUrl,
    calculationMethod: 'Contagem do recorte de votações relevantes em que a fonte oficial retornou voto nominal do parlamentar.',
    citizenExplanation: 'Mostra votações nominais selecionadas por relevância pública quando o voto individual do deputado foi encontrado.',
    limitation: 'Não é a lista completa de votações do ano e não transforma ausência de registro em falta.',
    itemTitle: (item) => item.descricao || item.id || 'Votação nominal',
    itemDescription: (item) => `Voto registrado: ${item.deputyVote?.vote || 'não informado'}. Resultado: ${item.aprovacao || item.resultado || 'não informado'}.`,
    itemDate: (item) => item.dataHoraRegistro || item.data,
  },
};

const SourceStatCard = ({ label, value, description }) => (
  <Card>
    <CardContent className="p-5">
      <p className="text-xs font-black uppercase text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-gray-950">{value}</p>
      {description && <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>}
    </CardContent>
  </Card>
);

const GenericRecordList = ({ records, config }) => (
  <Card>
    <CardContent className="p-6">
      <h2 className="text-xl font-black text-gray-950">Registros retornados pela fonte</h2>
      <div className="mt-4 space-y-3">
        {records.slice(0, 20).map((item, index) => (
          <div key={`${config.shortLabel}-${item.id || item.codigo || index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-black text-gray-950">{polishText(config.itemTitle(item))}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{polishText(config.itemDescription(item))}</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-600 ring-1 ring-gray-200">
                {formatDateTime(config.itemDate(item))}
              </span>
            </div>
          </div>
        ))}

        {records.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            A fonte respondeu, mas não retornou registros para este recorte.
          </div>
        )}

        {records.length > 20 && (
          <p className="text-xs text-gray-500">Lista curta com 20 registros para manter a página leve. A fonte técnica pode conter mais itens.</p>
        )}
      </div>
    </CardContent>
  </Card>
);

const SourceDetailPage = () => {
  const { deputyId, dataset, year } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deputado, setDeputado] = useState(null);
  const [records, setRecords] = useState([]);

  const datasetConfig = DATASET_CONFIGS[dataset];
  const isExpenseDataset = dataset === 'despesas';

  useEffect(() => {
    const load = async () => {
      if (!deputyId || !year || !datasetConfig) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const [info, rows] = await Promise.all([
          getDeputadoInfo(deputyId),
          datasetConfig.fetcher(deputyId, year),
        ]);
        setDeputado(info);
        setRecords(rows || []);
      } catch (err) {
        console.error('Erro ao carregar fonte interna:', err);
        setError('Não foi possível consultar a fonte oficial agora.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [datasetConfig, deputyId, year]);

  const summary = useMemo(() => {
    const total = records.reduce((acc, item) => acc + parseMoney(item.valorLiquido), 0);
    const monthly = groupExpensesByMonth(records);
    const months = Math.max(monthly.length, 1);
    const categories = groupExpensesByType(records);
    const topSupplier = getTopSupplier(records);
    const fallbackSourceUrl = datasetConfig?.officialUrl?.(deputyId, year) || 'https://dadosabertos.camara.leg.br/api/v2';

    return {
      total,
      monthlyAverage: total / months,
      count: records.length,
      months,
      categories,
      topSupplier,
      fetchedAt: records.__meta?.fetchedAt,
      sourceName: records.__meta?.sourceName || 'Câmara dos Deputados - Dados Abertos',
      sourceUrl: records.__meta?.sourceUrl || fallbackSourceUrl,
    };
  }, [datasetConfig, deputyId, records, year]);

  const info = deputado?.ultimoStatus || deputado || {};
  const deputyName = info.nomeEleitoral || info.nome || 'Deputado';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-600" />
      </div>
    );
  }

  if (!datasetConfig) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <Helmet><title>Fonte não disponível - FISCALIZA</title></Helmet>
        <Card className="mx-auto max-w-3xl border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <AlertTriangle className="mb-4 h-8 w-8 text-yellow-700" />
            <h1 className="text-2xl font-black text-gray-950">Página de fonte ainda não criada para este dado</h1>
            <p className="mt-2 text-gray-700">
              Por enquanto, a página interna de fonte cobre despesas da Câmara. Outros indicadores continuam mostrando
              fonte, data e método no próprio card.
            </p>
            <Button asChild className="mt-5 bg-yellow-400 text-black hover:bg-yellow-300">
              <Link to={`/politico/${deputyId}`}>Voltar ao perfil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isExpenseDataset) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <Helmet>
          <title>Fonte de {datasetConfig.shortLabel} - {deputyName} - FISCALIZA</title>
          <meta
            name="description"
            content="Página interna de fonte do FISCALIZA com API usada, data de consulta e método de cálculo."
          />
        </Helmet>

        <div className="border-b border-yellow-400/20 bg-black text-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <Link to={`/politico/${deputyId}`} className="mb-6 inline-flex items-center text-sm font-bold text-yellow-200 hover:text-yellow-100">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao perfil
            </Link>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-sm font-bold text-yellow-200">
                  <FileSearch className="h-4 w-4" />
                  Página interna de fonte
                </div>
                <h1 className="text-3xl font-black md:text-4xl">{datasetConfig.label} de {deputyName}</h1>
                <p className="mt-3 max-w-3xl text-zinc-300">
                  Esta página mostra a fonte oficial usada no card, o método de leitura e as limitações do indicador.
                </p>
              </div>
              <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4">
                <p className="text-xs font-black uppercase text-yellow-200">Ano</p>
                <p className="text-3xl font-black text-white">{year}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <SourceStatCard
              label="Registros encontrados"
              value={formatNumber(summary.count)}
              description={`Quantidade de ${datasetConfig.shortLabel} retornada para deputado e ano consultados.`}
            />
            <SourceStatCard
              label="Consultado em"
              value={formatDateTime(summary.fetchedAt)}
              description="Data em que o navegador recebeu a resposta da fonte oficial."
            />
            <SourceStatCard
              label="Fonte"
              value="Câmara"
              description={polishText(summary.sourceName)}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.9fr]">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Calculator className="mt-1 h-6 w-6 text-yellow-700" />
                  <div>
                    <h2 className="text-xl font-black text-gray-950">Como o cálculo é feito</h2>
                    <p className="mt-2 text-sm leading-relaxed text-gray-700">{polishText(datasetConfig.calculationMethod)}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm leading-relaxed text-green-900">
                  <p className="mb-1 font-bold">Explicação para o cidadão</p>
                  <p>{polishText(datasetConfig.citizenExplanation)}</p>
                </div>

                <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm leading-relaxed text-yellow-900">
                  <p className="mb-1 font-bold">Limitação importante</p>
                  <p>{polishText(datasetConfig.limitation)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Database className="mt-1 h-6 w-6 text-yellow-700" />
                  <div>
                    <h2 className="text-xl font-black text-gray-950">Fonte usada</h2>
                    <p className="mt-2 text-sm text-gray-700"><strong>{polishText(summary.sourceName)}</strong></p>
                  </div>
                </div>

                <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
                  <p className="text-xs font-black uppercase text-gray-500">Endpoint técnico oficial</p>
                  <a
                    href={summary.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex max-w-full items-center gap-1 break-all font-semibold text-yellow-800 hover:underline"
                  >
                    {summary.sourceUrl}
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                </div>

                <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">
                  O FISCALIZA usa este dado como leitura auxiliar. Ele não substitui auditoria jurídica, análise política completa ou consulta manual ao processo legislativo.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <GenericRecordList records={records} config={datasetConfig} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Helmet>
        <title>Fonte de despesas - {deputyName} - FISCALIZA</title>
        <meta
          name="description"
          content="Página interna de fonte do FISCALIZA com API usada, data de consulta e fórmula do cálculo de despesas parlamentares."
        />
      </Helmet>

      <div className="border-b border-yellow-400/20 bg-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link to={`/politico/${deputyId}`} className="mb-6 inline-flex items-center text-sm font-bold text-yellow-200 hover:text-yellow-100">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao perfil
          </Link>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-sm font-bold text-yellow-200">
                <FileSearch className="h-4 w-4" />
                Página interna de fonte
              </div>
              <h1 className="text-3xl font-black md:text-4xl">Despesas parlamentares de {deputyName}</h1>
              <p className="mt-3 max-w-3xl text-zinc-300">
                Esta página traduz a fonte oficial usada nos cards de gastos. Ela mostra qual API foi consultada,
                quando foi consultada e como o FISCALIZA calcula os números.
              </p>
            </div>
            <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4">
              <p className="text-xs font-black uppercase text-yellow-200">Ano</p>
              <p className="text-3xl font-black text-white">{year}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SourceStatCard
            label="Total calculado"
            value={formatCurrency(summary.total)}
            description="Soma dos valores líquidos retornados pela fonte oficial."
          />
          <SourceStatCard
            label="Registros encontrados"
            value={formatNumber(summary.count)}
            description="Quantidade de despesas retornadas para deputado e ano consultados."
          />
          <SourceStatCard
            label="Média mensal"
            value={formatCurrency(summary.monthlyAverage)}
            description={`Total dividido por ${summary.months} mês(es) com despesa registrada.`}
          />
          <SourceStatCard
            label="Consultado em"
            value={formatDateTime(summary.fetchedAt)}
            description="Data em que o navegador recebeu a resposta da fonte."
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Calculator className="mt-1 h-6 w-6 text-yellow-700" />
                <div>
                  <h2 className="text-xl font-black text-gray-950">Como o cálculo é feito</h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">
                    O FISCALIZA consulta a API de despesas da Câmara para o deputado e ano selecionados.
                    Depois soma o campo <strong>valorLiquido</strong> de cada registro retornado.
                  </p>
                </div>
              </div>

              <ol className="mt-5 space-y-3 text-sm text-gray-700">
                <li className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <strong>1. Buscar registros oficiais:</strong> endpoint de despesas de deputado na Câmara.
                </li>
                <li className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <strong>2. Somar valores líquidos:</strong> soma de <code>valorLiquido</code>, sem criar valor artificial.
                </li>
                <li className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <strong>3. Agrupar para leitura:</strong> categorias usam <code>tipoDespesa</code> e fornecedores usam <code>nomeFornecedor</code>.
                </li>
                <li className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <strong>4. Exibir limitações:</strong> se a fonte não retornar dado, o site mostra indisponível ou parcial.
                </li>
              </ol>

              <div className="mt-5 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm leading-relaxed text-yellow-900">
                Esta leitura não acusa irregularidade. Despesa declarada na CEAP precisa ser analisada com nota,
                categoria, data, fornecedor, regra vigente e contexto do mandato.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Database className="mt-1 h-6 w-6 text-yellow-700" />
                <div>
                  <h2 className="text-xl font-black text-gray-950">Fonte usada</h2>
                  <p className="mt-2 text-sm text-gray-700">
                    <strong>{polishText(summary.sourceName)}</strong>
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-gray-700">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-black uppercase text-gray-500">Endpoint técnico oficial</p>
                  <a
                    href={summary.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex max-w-full items-center gap-1 break-all font-semibold text-yellow-800 hover:underline"
                  >
                    {summary.sourceUrl}
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                </div>

                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-900">
                  <p className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    Rastreabilidade disponível
                  </p>
                  <p className="mt-1 text-xs">
                    Os cards de total gasto, média mensal, quantidade de despesas e maior fornecedor usam esta mesma base.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-black uppercase text-gray-500">O que esta fonte não prova sozinha</p>
                  <p className="mt-1">
                    Não prova presença, relatoria, voto, qualidade do mandato ou irregularidade. Ela mostra despesas
                    declaradas na base oficial consultada.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-black text-gray-950">Principais categorias</h2>
              <div className="mt-4 space-y-3">
                {summary.categories.slice(0, 8).map((category) => (
                  <div key={category.name} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-gray-800">{polishText(category.name)}</p>
                      <p className="font-black text-gray-950">{formatCurrency(category.value)}</p>
                    </div>
                  </div>
                ))}
                {summary.categories.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                    A fonte respondeu, mas não retornou categorias de despesa para este recorte.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-black text-gray-950">Maior fornecedor</h2>
              {summary.topSupplier ? (
                <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-lg font-black text-gray-950">{summary.topSupplier.name}</p>
                  <p className="mt-2 text-2xl font-black text-yellow-700">{formatCurrency(summary.topSupplier.value)}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {formatNumber(summary.topSupplier.count)} registro(s) associados a este fornecedor.
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  Nenhum fornecedor suficiente para cálculo neste recorte.
                </div>
              )}

              <div className="mt-5 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                Concentração em fornecedor é ponto de atenção, não acusação. A análise responsável exige abrir notas e contexto.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SourceDetailPage;
