import {
  getCamaraPortalAuthorSearchUrl,
  getCamaraPortalDeputyUrl,
  getCamaraPortalDeputyVotesUrl,
  getCamaraPortalRapporteurSearchUrl,
} from '@/lib/official-links';

const internalSourcePath = (deputyId, dataset, year) =>
  deputyId && dataset && year ? `/fonte/deputado/${encodeURIComponent(deputyId)}/${dataset}/${encodeURIComponent(year)}` : '';

const valueOf = (metric) => (metric?.status === 'unavailable' ? null : metric?.value);

export const buildDeputyKpiVerificationRows = ({ deputyId, year, metrics = {} } = {}) => [
  {
    id: 'proposicoes',
    label: 'Proposicoes de autoria',
    fiscalizaValue: valueOf(metrics.proposicoes),
    fiscalizaMetricId: metrics.proposicoes?.id,
    status: 'comparable',
    badge: 'Comparavel',
    officialUrl: getCamaraPortalAuthorSearchUrl(deputyId, year),
    internalSourceUrl: internalSourcePath(deputyId, 'proposicoes', year),
    method:
      'O card principal do FISCALIZA usa o numero exibido no portal publico da Camara quando essa pagina responde. A pagina interna mostra a lista tecnica retornada pelos Dados Abertos.',
    warning:
      'Este numero significa propostas legislativas de autoria no portal. Nao significa que a proposta foi aprovada.',
  },
  {
    id: 'discursos',
    label: 'Discursos registrados',
    fiscalizaValue: valueOf(metrics.discursos),
    fiscalizaMetricId: metrics.discursos?.id,
    status: 'comparable',
    badge: 'Comparavel',
    officialUrl: getCamaraPortalDeputyUrl(deputyId),
    internalSourceUrl: internalSourcePath(deputyId, 'discursos', year),
    method:
      'O card principal do FISCALIZA usa o numero de discursos em Plenario exibido no portal publico da Camara quando essa pagina responde.',
    warning:
      'Pode haver diferenca em relacao a listas tecnicas caso o portal agrupe ou filtre registros por regra propria.',
  },
  {
    id: 'votacoesPlenario',
    label: 'Votacoes nominais em Plenario',
    fiscalizaValue: valueOf(metrics.votacoesPlenario),
    fiscalizaMetricId: metrics.votacoesPlenario?.id,
    status: 'comparable',
    badge: 'Comparavel',
    officialUrl: getCamaraPortalDeputyVotesUrl(deputyId, year),
    internalSourceUrl: internalSourcePath(deputyId, 'votacoes', year),
    method:
      'O card principal do FISCALIZA usa o total de votacoes nominais em Plenario exibido no portal publico da Camara. A aba Votacoes continua mostrando um recorte tematico de votacoes relevantes.',
    warning:
      'Este total oficial nao diz sozinho se o parlamentar votou a favor ou contra em cada tema; para isso, consulte as votacoes detalhadas.',
  },
  {
    id: 'relatorias',
    label: 'Relatorias',
    fiscalizaValue: valueOf(metrics.relatorias),
    fiscalizaMetricId: metrics.relatorias?.id,
    status: metrics.relatorias?.status === 'available' ? 'comparable' : 'external_check',
    badge: metrics.relatorias?.status === 'available' ? 'Comparavel' : 'Conferencia externa',
    officialUrl: getCamaraPortalRapporteurSearchUrl(deputyId, year),
    internalSourceUrl: '',
    method:
      'O card principal reproduz o total de propostas relatadas exibido no portal publico da Camara quando ele esta disponivel.',
    warning:
      'Este numero nao significa, sozinho, que relatorios foram aprovados; ele mostra a contagem oficial do portal para propostas relatadas.',
  },
  {
    id: 'presenca',
    label: 'Presenca em Plenario e Comissoes',
    fiscalizaValue: valueOf(metrics.presenca),
    fiscalizaMetricId: metrics.presenca?.id,
    status: metrics.presenca?.status === 'available' ? 'comparable' : 'external_check',
    badge: metrics.presenca?.status === 'available' ? 'Comparavel' : 'Conferencia externa',
    officialUrl: getCamaraPortalDeputyUrl(deputyId),
    internalSourceUrl: '',
    method:
      'O FISCALIZA reproduz os numeros de presenca em Plenario e em Comissoes exibidos no portal publico da Camara quando eles estao disponiveis.',
    warning:
      'Este indicador e uma reproducao do resumo oficial do portal; nao e uma acusacao nem um calculo proprio de assiduidade.',
  },
  {
    id: 'gastos',
    label: 'Gastos parlamentares',
    fiscalizaValue: valueOf(metrics.totalGastoAno),
    fiscalizaMetricId: metrics.totalGastoAno?.id,
    status: 'comparable',
    badge: 'Comparavel',
    officialUrl: getCamaraPortalDeputyUrl(deputyId),
    internalSourceUrl: internalSourcePath(deputyId, 'despesas', year),
    method:
      'O FISCALIZA soma valores liquidos das despesas CEAP retornadas pela API. A pagina publica do deputado mostra graficos e recursos relacionados ao mandato.',
    warning:
      'Diferencas podem aparecer quando o portal mostra percentual de uso da cota, verba de gabinete ou outros recursos que nao sao a mesma soma CEAP.',
  },
];

export const summarizeVerificationCoverage = (rows = []) => {
  const comparable = rows.filter((row) => row.status === 'comparable').length;
  const differentScope = rows.filter((row) => row.status === 'different_scope').length;
  const externalCheck = rows.filter((row) => row.status === 'external_check').length;

  return {
    comparable,
    differentScope,
    externalCheck,
    total: rows.length,
  };
};
