import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, Info, Loader2, Users, Vote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AgendaImpactPanel from '@/components/AgendaImpactPanel';
import { findVotingRecordsWithIndividualVotes } from '@/lib/agenda-votes';
import {
  getProposicaoAutores,
  getProposicaoByOfficialNumber,
  getProposicaoRelacionadas,
  getProposicaoTemas,
  getProposicaoTramitacoes,
  getProposicaoVotacoes,
  getVotacaoVotos,
} from '@/services/camara';
import { findMajorAgendaByOfficialNumber } from '@/lib/major-agendas';
import { polishText } from '@/lib/display-text';
import { describeVotingForCitizen } from '@/lib/vote-highlights';

const voteGroups = [
  { id: 'sim', label: 'Votaram sim' },
  { id: 'nao', label: 'Votaram não' },
  { id: 'abstencao', label: 'Abstenções' },
  { id: 'obstrucao', label: 'Obstruções' },
  { id: 'outros', label: 'Outros registros' },
];

const agendaVoteStatusLabels = {
  sim: 'Há voto nominal individual em etapas da pauta.',
  parcial: 'Há votação parcial, simbólica ou nem sempre individual.',
  nao: 'Voto nominal individual ainda não confirmado.',
};

const EMPTY_VOTE_COVERAGE = {
  totalCandidates: 0,
  candidateLimit: 30,
  checked: 0,
  nominalVotings: 0,
  withoutIndividualRecords: 0,
  failed: 0,
  stoppedAfterSourceFailures: false,
};

const normalizeVoteGroup = (vote) => {
  const value = String(vote || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  if (value.includes('SIM')) return 'sim';
  if (value.includes('NAO')) return 'nao';
  if (value.includes('ABST')) return 'abstencao';
  if (value.includes('OBSTRU')) return 'obstrucao';
  return 'outros';
};

const groupVotes = (votes = []) =>
  votes.reduce(
    (acc, vote) => {
      const group = normalizeVoteGroup(vote.vote);
      acc[group].push(vote);
      acc.total += 1;
      return acc;
    },
    { total: 0, sim: [], nao: [], abstencao: [], obstrucao: [], outros: [] }
  );

const formatDate = (value) => {
  if (!value) return 'data não informada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('pt-BR');
};

const getCamaraPortalUrl = (proposicao) =>
  proposicao?.id
    ? `https://www.camara.leg.br/propostas-legislativas/${proposicao.id}`
    : 'https://www.camara.leg.br/proposicoesWeb/';

const getTechnicalUrl = (path = '') => `https://dadosabertos.camara.leg.br/api/v2${path}`;

const getStatusText = (proposicao) =>
  proposicao?.statusProposicao?.descricaoSituacao ||
  proposicao?.statusProposicao?.descricaoTramitacao ||
  proposicao?.ultimoStatus?.descricaoSituacao ||
  proposicao?.ultimoStatus?.descricaoTramitacao ||
  'Não informada pela fonte';

const getProcedureText = (proposicao) =>
  proposicao?.statusProposicao?.despacho ||
  proposicao?.statusProposicao?.descricaoTramitacao ||
  proposicao?.ultimoStatus?.despacho ||
  proposicao?.ultimoStatus?.descricaoTramitacao ||
  'A Câmara não retornou um resumo de tramitação nesta consulta.';

const formatAuthor = (autor = {}) => {
  const name = autor.nome || autor.nomeAutor || autor.nomeCivil || 'Autor não informado';
  const party = autor.siglaPartido ? ` (${autor.siglaPartido}/${autor.siglaUf || '-'})` : '';
  return `${name}${party}`;
};

const getVotingOfficialUrl = (voting = {}) =>
  voting.uri || (voting.id ? getTechnicalUrl(`/votacoes/${encodeURIComponent(voting.id)}`) : '');

const buildParticipantSummary = (votacoes = []) => {
  const byDeputy = new Map();

  votacoes.forEach((voting) => {
    (voting.votes || []).forEach((vote) => {
      const key = vote.deputyId || `${vote.name}-${vote.party}-${vote.state}`;
      if (!key) return;

      const current =
        byDeputy.get(key) || {
          deputyId: vote.deputyId,
          name: vote.name || 'Nome não informado',
          party: vote.party || '',
          state: vote.state || '',
          total: 0,
          sim: 0,
          nao: 0,
          abstencao: 0,
          obstrucao: 0,
          outros: 0,
          lastVote: '',
        };

      const group = normalizeVoteGroup(vote.vote);
      current[group] += 1;
      current.total += 1;
      current.lastVote = vote.vote || current.lastVote;
      byDeputy.set(key, current);
    });
  });

  return Array.from(byDeputy.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
};

const VoteNames = ({ title, votes }) => {
  const [expanded, setExpanded] = useState(false);
  const visibleVotes = expanded ? votes : votes.slice(0, 12);

  return (
  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
    <div className="mb-2 flex items-center justify-between gap-3">
      <p className="text-xs font-bold uppercase text-gray-500">{title}</p>
      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gray-700">{votes.length}</span>
    </div>
    {votes.length ? (
      <ul className="space-y-1 text-sm text-gray-700">
        {visibleVotes.map((vote, index) => (
          <li key={`${vote.deputyId || vote.name}-${index}`} className="truncate">
            {vote.name || 'Nome não informado'} {vote.party ? `(${vote.party}/${vote.state || '-'})` : ''}
          </li>
        ))}
        {votes.length > 12 && (
          <li>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-0 text-xs font-bold text-yellow-800 hover:bg-transparent"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? 'Mostrar lista curta' : <>Mostrar todos os {votes.length} nomes</>}
            </Button>
          </li>
        )}
      </ul>
    ) : (
      <p className="text-sm text-gray-400">Nenhum registro nesta categoria.</p>
    )}
  </div>
  );
};

const AgendaSummaryPanel = ({ agenda, officialLabel }) => {
  if (!agenda) return null;

  return (
    <Card className="border-blue-100 bg-blue-50">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-700" />
          <h2 className="font-black text-blue-950">Resumo público da pauta</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-blue-100 bg-white p-3">
            <p className="text-xs font-bold uppercase text-gray-500">Número oficial</p>
            <p className="mt-1 font-black text-gray-950">{officialLabel}</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-white p-3">
            <p className="text-xs font-bold uppercase text-gray-500">Tema</p>
            <p className="mt-1 font-black capitalize text-gray-950">{polishText(agenda.tema)}</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-white p-3">
            <p className="text-xs font-bold uppercase text-gray-500">Ano de referência</p>
            <p className="mt-1 font-black text-gray-950">{agenda.ano_pauta}</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-white p-3">
            <p className="text-xs font-bold uppercase text-gray-500">Voto nominal</p>
            <p className="mt-1 font-black text-gray-950">{polishText(agendaVoteStatusLabels[agenda.houve_voto_nominal] || agendaVoteStatusLabels.parcial)}</p>
          </div>
        </div>
        {agenda.observacao_voto && (
          <div className="mt-4 rounded-lg border border-yellow-100 bg-yellow-50 p-3 text-sm leading-relaxed text-yellow-950">
            <p className="mb-1 font-bold">Observação sobre votos</p>
            <p>{polishText(agenda.observacao_voto)}</p>
          </div>
        )}
        <p className="mt-4 text-xs leading-relaxed text-blue-900">
          Este resumo é um cadastro editorial do FISCALIZA para orientar a busca. Autores, situação, votações e nomes de deputados abaixo vêm da Câmara dos Deputados quando a fonte oficial retorna dados.
        </p>
      </CardContent>
    </Card>
  );
};

const OfficialPropositionPanel = ({ proposicao, autores, officialLabel }) => (
  <Card>
    <CardContent className="p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-5 w-5 text-yellow-600" />
            <h2 className="font-black text-gray-950">Dados oficiais da proposição</h2>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            Esta seção usa a consulta oficial da Câmara para o número {officialLabel}. Quando algum campo não aparece, o FISCALIZA mantém a lacuna visível.
          </p>
        </div>
        {proposicao?.id && (
          <div className="flex flex-wrap gap-2">
            <a href={getCamaraPortalUrl(proposicao)} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                Portal da Câmara <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href={proposicao.__meta?.detailSourceUrl || getTechnicalUrl(`/proposicoes/${proposicao.id}`)} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                Endpoint técnico da API <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        )}
      </div>

      {proposicao ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-bold uppercase text-gray-500">Situação atual</p>
              <p className="mt-1 font-black text-gray-950">{polishText(getStatusText(proposicao))}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-bold uppercase text-gray-500">Apresentação</p>
              <p className="mt-1 font-black text-gray-950">{formatDate(proposicao.dataApresentacao)}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-bold uppercase text-gray-500">Autores retornados</p>
              <p className="mt-1 font-black text-gray-950">{autores.length || 'Fonte não retornou'}</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-gray-100 bg-white p-4">
            <p className="text-xs font-bold uppercase text-gray-500">Ementa oficial</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">{polishText(proposicao.ementa || 'Ementa não retornada pela Câmara nesta consulta.')}</p>
          </div>

          <div className="mt-4 rounded-lg border border-gray-100 bg-white p-4">
            <p className="text-xs font-bold uppercase text-gray-500">Tramitação resumida</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">{polishText(getProcedureText(proposicao))}</p>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-bold uppercase text-gray-500">Autor ou autores</p>
            {autores.length ? (
              <div className="flex flex-wrap gap-2">
                {autores.slice(0, 16).map((autor, index) => (
                  <span key={`${autor.nome || autor.nomeAutor}-${index}`} className="rounded-full bg-yellow-50 px-3 py-1 text-sm font-bold text-yellow-900 ring-1 ring-yellow-200">
                    {formatAuthor(autor)}
                  </span>
                ))}
                {autores.length > 16 && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-600">+ {autores.length - 16} autores</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">A fonte oficial não retornou autores nesta consulta.</p>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-950">
          A Câmara não retornou uma proposição com esse número oficial na consulta atual.
        </div>
      )}
    </CardContent>
  </Card>
);

const ParticipantsPanel = ({ votacoes, coverage = {} }) => {
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const participants = buildParticipantSummary(votacoes);
  const totalVoteRecords = votacoes.reduce((sum, voting) => sum + (voting.votes || []).length, 0);
  const parties = new Set(participants.map((item) => item.party).filter(Boolean)).size;
  const states = new Set(participants.map((item) => item.state).filter(Boolean)).size;
  const visibleParticipants = showAllParticipants ? participants : participants.slice(0, 120);

  return (
    <Card id="deputados-participantes">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-yellow-600" />
          <h2 className="font-black text-gray-950">Deputados que aparecem nas votações retornadas</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs font-bold uppercase text-gray-500">Nomes únicos</p>
            <p className="text-2xl font-black text-gray-950">{participants.length}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs font-bold uppercase text-gray-500">Registros de voto</p>
            <p className="text-2xl font-black text-gray-950">{totalVoteRecords}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs font-bold uppercase text-gray-500">Partidos</p>
            <p className="text-2xl font-black text-gray-950">{parties}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs font-bold uppercase text-gray-500">Estados</p>
            <p className="text-2xl font-black text-gray-950">{states}</p>
          </div>
        </div>

        {coverage.checked > 0 && (
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-relaxed text-blue-950">
            O FISCALIZA verificou {coverage.checked} de {coverage.totalCandidates} votações vinculadas.
            {' '}{coverage.nominalVotings} votação(ões) retornaram nomes individuais e {coverage.withoutIndividualRecords} não retornaram lista nominal.
            {coverage.totalCandidates > coverage.candidateLimit && (
              <> A busca automática foi limitada às {coverage.candidateLimit} candidatas com maior chance de conter voto nominal.</>
            )}
          </div>
        )}

        {participants.length ? (
          <div className="mt-4 max-h-96 overflow-auto rounded-lg border border-gray-100">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Deputado</th>
                  <th className="px-4 py-3">Partido/UF</th>
                  <th className="px-4 py-3">Participações</th>
                  <th className="px-4 py-3">Sim</th>
                  <th className="px-4 py-3">Não</th>
                  <th className="px-4 py-3">Abstenção</th>
                  <th className="px-4 py-3">Obstrução</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleParticipants.map((item) => (
                  <tr key={item.deputyId || `${item.name}-${item.party}-${item.state}`}>
                    <td className="px-4 py-3 font-bold text-gray-950">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600">{item.party || '-'} / {item.state || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{item.total}</td>
                    <td className="px-4 py-3 text-green-700">{item.sim}</td>
                    <td className="px-4 py-3 text-red-700">{item.nao}</td>
                    <td className="px-4 py-3 text-gray-700">{item.abstencao}</td>
                    <td className="px-4 py-3 text-gray-700">{item.obstrucao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-950">
            {coverage.failed > 0 && coverage.failed === coverage.checked
              ? 'A fonte oficial falhou ao responder às consultas de votos individuais. O FISCALIZA não transformou essa falha em ausência de voto.'
              : 'A Câmara não retornou nomes individuais nas votações verificadas. Isso normalmente indica votação simbólica ou procedimental e não significa que os deputados estavam ausentes.'}
          </div>
        )}

        {participants.length > 120 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setShowAllParticipants((value) => !value)}
          >
            {showAllParticipants ? 'Mostrar lista curta' : <>Mostrar todos os {participants.length} deputados</>}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const SourceMethodPanel = ({ proposicao, votacoes, officialLabel, type, number, year }) => {
  const searchParams = new URLSearchParams({
    siglaTipo: String(type || '').toUpperCase(),
    numero: String(number || ''),
    ano: String(year || ''),
  });
  const endpoints = [
    {
      label: 'Busca por número oficial',
      url: proposicao?.__meta?.searchSourceUrl || getTechnicalUrl(`/proposicoes?${searchParams.toString()}`),
    },
    ...(proposicao?.id
      ? [
          { label: 'Detalhe da proposição', url: proposicao.__meta?.detailSourceUrl || getTechnicalUrl(`/proposicoes/${proposicao.id}`) },
          { label: 'Autores', url: getTechnicalUrl(`/proposicoes/${proposicao.id}/autores`) },
          { label: 'Votações vinculadas', url: getTechnicalUrl(`/proposicoes/${proposicao.id}/votacoes`) },
        ]
      : []),
    ...(votacoes[0]?.id ? [{ label: 'Votos nominais por votação', url: getTechnicalUrl(`/votacoes/${votacoes[0].id}/votos`) }] : []),
  ];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-yellow-600" />
          <h2 className="font-black text-gray-950">Fonte e método</h2>
        </div>
        <p className="text-sm leading-relaxed text-gray-600">
          Os dados abaixo vêm da Câmara dos Deputados - Dados Abertos. O FISCALIZA usa o número oficial {officialLabel}, busca a proposição, consulta autores, votações vinculadas e, para cada votação, tenta carregar os votos nominais individuais.
        </p>
        <div className="mt-4 grid gap-2">
          {endpoints.map((item) => (
            <a key={item.label} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-yellow-300 hover:text-yellow-900">
              <span>{item.label}</span>
              <ExternalLink className="h-4 w-4 shrink-0" />
            </a>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm leading-relaxed text-yellow-950">
          Nem toda votação de uma pauta é nominal. Votações simbólicas ou procedimentais podem aparecer sem lista individual de deputados.
        </div>
      </CardContent>
    </Card>
  );
};

const VotingCard = ({ voting, agenda, officialLabel }) => {
  const grouped = groupVotes(voting.votes);
  const votingInfo = describeVotingForCitizen(voting);
  const visibleTitle = agenda
    ? `${agenda.apelido_pauta} (${officialLabel})`
    : polishText(votingInfo.title || voting.descricao || voting.id);
  const matterLabel = votingInfo.matter?.label || officialLabel;
  const sourceUrl = getVotingOfficialUrl(voting);
  const voteSourceUrl = voting.votes?.__meta?.sourceUrl || (voting.id ? getTechnicalUrl(`/votacoes/${voting.id}/votos`) : '');

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">{polishText(votingInfo.subtitle || 'Votação nominal')}</p>
            <h2 className="mt-1 text-lg font-black text-gray-950">{polishText(visibleTitle)}</h2>
            <p className="mt-2 text-sm text-gray-600">
              Data: {formatDate(voting.dataHoraRegistro || voting.data)}. Resultado: {polishText(voting.aprovacao || voting.resultado || 'não informado')}.
            </p>
            <p className="mt-2 text-sm text-gray-700">
              Matéria mostrada: <strong>{polishText(matterLabel)}</strong>. Esta votação foi retornada pela Câmara como vinculada à proposição consultada.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="#deputados-participantes">
              <Button variant="outline" size="sm">Ver participantes</Button>
            </a>
            {sourceUrl && (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  Dados técnicos da votação <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            )}
            {voteSourceUrl && (
              <a href={voteSourceUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  Votos técnicos <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <p className="text-xs font-bold uppercase text-gray-500">Descrição oficial da votação</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">{polishText(votingInfo.rawDescription || voting.descricao || 'Descrição não retornada pela Câmara.')}</p>
        </div>

        {votingInfo.warnings?.length > 0 && (
          <div className="mt-4 space-y-2">
            {votingInfo.warnings.slice(0, 3).map((warning) => (
              <div key={warning} className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-950">
                {polishText(warning)}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {voteGroups.map((group) => (
            <div key={group.id} className="rounded-lg border border-gray-100 bg-white p-3">
              <p className="text-xs font-bold uppercase text-gray-500">{group.label}</p>
              <p className="text-2xl font-black text-gray-950">{grouped[group.id].length}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {voteGroups.map((group) => (
            <VoteNames key={group.id} title={group.label} votes={grouped[group.id]} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const AgendaDetailPage = ({ slugOverride = '' }) => {
  const params = useParams();
  const slugMatch = String(slugOverride || params.slug || '').match(/^([A-Za-z]+)-(\d+)-(\d{4})$/);
  const type = params.type || slugMatch?.[1] || '';
  const number = params.number || slugMatch?.[2] || '';
  const year = params.year || slugMatch?.[3] || '';
  const officialLabel = `${String(type || '').toUpperCase()} ${number}/${year}`;
  const agenda = useMemo(() => findMajorAgendaByOfficialNumber(officialLabel), [officialLabel]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [proposicao, setProposicao] = useState(null);
  const [autores, setAutores] = useState([]);
  const [votacoes, setVotacoes] = useState([]);
  const [tramitacoes, setTramitacoes] = useState([]);
  const [temas, setTemas] = useState([]);
  const [relacionadas, setRelacionadas] = useState([]);
  const [voteCoverage, setVoteCoverage] = useState(EMPTY_VOTE_COVERAGE);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      setVoteCoverage(EMPTY_VOTE_COVERAGE);
      setTramitacoes([]);
      setTemas([]);
      setRelacionadas([]);
      try {
        const found = await getProposicaoByOfficialNumber({ siglaTipo: type, numero: number, ano: year });
        setProposicao(found);

        if (!found?.id) {
          setAutores([]);
          setVotacoes([]);
          setError('A Câmara não retornou uma proposição com esse número oficial.');
          return;
        }

        const [authors, votingRecords, procedures, officialThemes, relatedProposals] = await Promise.all([
          getProposicaoAutores(found.id).catch(() => []),
          getProposicaoVotacoes(found.id).catch(() => []),
          getProposicaoTramitacoes(found.id).catch(() => []),
          getProposicaoTemas(found.id).catch(() => []),
          getProposicaoRelacionadas(found.id).catch(() => []),
        ]);

        const votingWithVotes = await findVotingRecordsWithIndividualVotes(
          votingRecords,
          (votingId) => getVotacaoVotos(votingId, { retries: 0, timeoutMs: 8000, maxPages: 6 }),
          {
            batchSize: 4,
            maxCandidates: 30,
            maxNominalVotings: 8,
            maxSourceFailures: 3,
          }
        );

        setAutores(authors || []);
        setTramitacoes(procedures || []);
        setTemas(officialThemes || []);
        setRelacionadas(relatedProposals || []);
        setVotacoes(votingWithVotes);
        setVoteCoverage(votingWithVotes.__meta || EMPTY_VOTE_COVERAGE);
        if (votingRecords.__meta?.error) {
          setError('A Câmara identificou a proposição, mas a consulta de votações vinculadas falhou temporariamente.');
        }
      } catch (err) {
        console.error('Erro ao carregar pauta:', err);
        setError('Não foi possível carregar os dados oficiais desta proposição agora.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [number, type, year]);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Helmet>
        <title>{officialLabel} - FISCALIZA</title>
      </Helmet>

      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link to="/pautas" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-yellow-700">
            <ArrowLeft className="h-4 w-4" />
            Voltar para pautas
          </Link>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-sm font-bold text-yellow-900">
                <FileText className="h-4 w-4" />
                {officialLabel}
              </div>
              <h1 className="text-3xl font-black text-gray-950">
                {polishText(agenda?.apelido_pauta || (proposicao?.siglaTipo ? `${proposicao.siglaTipo} ${proposicao.numero}/${proposicao.ano}` : officialLabel))}
              </h1>
              <p className="mt-3 max-w-4xl text-gray-600">
                {polishText(proposicao?.ementa || agenda?.resumo_curto || 'Dados oficiais ainda não carregados.')}
              </p>
            </div>
            {proposicao?.id && (
              <a href={getCamaraPortalUrl(proposicao)} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  Abrir na Câmara <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AgendaSummaryPanel agenda={agenda} officialLabel={officialLabel} />

        {loading ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-yellow-600" />
            <p className="mt-4 font-bold text-gray-900">Consultando a fonte oficial...</p>
            <p className="mt-2 max-w-xl text-sm text-gray-500">
              A página já mostra o resumo público da pauta acima. Os dados de autores, situação e votações aparecem aqui quando os Dados Abertos da Câmara respondem.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {error && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                {error}
              </div>
            )}

            <OfficialPropositionPanel proposicao={proposicao} autores={autores} officialLabel={officialLabel} />

            <AgendaImpactPanel
              proposal={proposicao}
              authors={autores}
              votings={votacoes}
              procedures={tramitacoes}
              themes={temas}
              related={relacionadas}
            />

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm leading-relaxed text-yellow-950">
              <div className="mb-1 flex items-center gap-2 font-bold">
                <Vote className="h-4 w-4" />
                Como ler os votos desta página
              </div>
              Uma proposição pode ter várias votações: texto-base, destaques, emendas, urgência ou requerimentos. O FISCALIZA verifica progressivamente até 30 votações vinculadas e mostra até 8 que tenham nomes individuais retornados pela Câmara.
            </div>

            {votacoes.length ? (
              <div className="space-y-4">
                {votacoes.map((voting) => (
                  <VotingCard key={voting.id} voting={voting} agenda={agenda} officialLabel={officialLabel} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
                {voteCoverage.failed > 0
                  ? 'A consulta oficial dos votos individuais falhou nesta tentativa. Nenhum resultado foi inferido.'
                  : 'Nenhuma votação com nomes individuais foi encontrada. A pauta pode ter tido votação simbólica, estar sem votação ou não possuir vínculo nominal publicado pela fonte atual.'}
              </div>
            )}

            <ParticipantsPanel votacoes={votacoes} coverage={voteCoverage} />
            <SourceMethodPanel proposicao={proposicao} votacoes={votacoes} officialLabel={officialLabel} type={type} number={number} year={year} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendaDetailPage;
