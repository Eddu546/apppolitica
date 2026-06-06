import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, Loader2, Users, Vote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getProposicaoAutores,
  getProposicaoByOfficialNumber,
  getProposicaoVotacoes,
  getVotacaoVotos,
} from '@/services/camara';
import { findMajorAgendaByOfficialNumber } from '@/lib/major-agendas';

const voteGroups = [
  { id: 'sim', label: 'Votaram sim' },
  { id: 'nao', label: 'Votaram não' },
  { id: 'abstencao', label: 'Abstenções' },
  { id: 'obstrucao', label: 'Obstruções' },
  { id: 'outros', label: 'Outros registros' },
];

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

const VoteNames = ({ title, votes }) => (
  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
    <div className="mb-2 flex items-center justify-between gap-3">
      <p className="text-xs font-bold uppercase text-gray-500">{title}</p>
      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gray-700">{votes.length}</span>
    </div>
    {votes.length ? (
      <ul className="space-y-1 text-sm text-gray-700">
        {votes.slice(0, 12).map((vote, index) => (
          <li key={`${vote.deputyId || vote.name}-${index}`} className="truncate">
            {vote.name || 'Nome não informado'} {vote.party ? `(${vote.party}/${vote.state || '-'})` : ''}
          </li>
        ))}
        {votes.length > 12 && (
          <li className="text-xs font-semibold text-gray-500">+ {votes.length - 12} nomes não exibidos nesta lista curta</li>
        )}
      </ul>
    ) : (
      <p className="text-sm text-gray-400">Nenhum registro nesta categoria.</p>
    )}
  </div>
);

const VotingCard = ({ voting }) => {
  const grouped = groupVotes(voting.votes);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">Votação nominal</p>
            <h2 className="mt-1 text-lg font-black text-gray-950">{voting.descricao || voting.id}</h2>
            <p className="mt-2 text-sm text-gray-600">
              Data: {formatDate(voting.dataHoraRegistro || voting.data)}. Resultado: {voting.aprovacao || voting.resultado || 'não informado'}.
            </p>
          </div>
          {voting.uri && (
            <a href={voting.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline">
              Fonte <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const found = await getProposicaoByOfficialNumber({ siglaTipo: type, numero: number, ano: year });
        setProposicao(found);

        if (!found?.id) {
          setAutores([]);
          setVotacoes([]);
          setError('A Câmara não retornou uma proposição com esse número oficial.');
          return;
        }

        const [authors, votingRecords] = await Promise.all([
          getProposicaoAutores(found.id).catch(() => []),
          getProposicaoVotacoes(found.id).catch(() => []),
        ]);

        const votingWithVotes = await Promise.all(
          votingRecords.slice(0, 5).map(async (voting) => ({
            ...voting,
            votes: await getVotacaoVotos(voting.id).catch(() => []),
          }))
        );

        setAutores(authors || []);
        setVotacoes(votingWithVotes);
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
          <Link to="/pautas" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600">
            <ArrowLeft className="h-4 w-4" />
            Voltar para pautas
          </Link>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                <FileText className="h-4 w-4" />
                {officialLabel}
              </div>
              <h1 className="text-3xl font-black text-gray-950">
                {agenda?.apelido_pauta || (proposicao?.siglaTipo ? `${proposicao.siglaTipo} ${proposicao.numero}/${proposicao.ano}` : officialLabel)}
              </h1>
              <p className="mt-3 max-w-4xl text-gray-600">
                {proposicao?.ementa || agenda?.resumo_curto || 'Dados oficiais ainda não carregados.'}
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                {error}
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs font-bold uppercase text-gray-500">Situação</p>
                  <p className="mt-1 text-lg font-black text-gray-950">{proposicao?.statusProposicao?.descricaoSituacao || 'Não informada pela fonte'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs font-bold uppercase text-gray-500">Apresentação</p>
                  <p className="mt-1 text-lg font-black text-gray-950">{formatDate(proposicao?.dataApresentacao)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs font-bold uppercase text-gray-500">Votações encontradas</p>
                  <p className="mt-1 text-lg font-black text-gray-950">{votacoes.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h2 className="font-black text-gray-950">Autor ou autores</h2>
                </div>
                {autores.length ? (
                  <div className="flex flex-wrap gap-2">
                    {autores.map((autor, index) => (
                      <span key={`${autor.nome}-${index}`} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                        {autor.nome || autor.nomeAutor || 'Autor não informado'}{autor.siglaPartido ? ` (${autor.siglaPartido}/${autor.siglaUf || '-'})` : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">A fonte oficial não retornou autores nesta consulta.</p>
                )}
              </CardContent>
            </Card>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-blue-950">
              <div className="mb-1 flex items-center gap-2 font-bold">
                <Vote className="h-4 w-4" />
                Como ler os votos desta página
              </div>
              Uma proposição pode ter várias votações: texto-base, destaques, emendas, urgência ou requerimentos. Esta tela mostra até 5 votações retornadas pela Câmara e lista nomes apenas quando o endpoint oficial de votos nominais retorna dados.
            </div>

            {votacoes.length ? (
              <div className="space-y-4">
                {votacoes.map((voting) => (
                  <VotingCard key={voting.id} voting={voting} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
                Nenhuma votação nominal foi encontrada para esta proposição na consulta atual.
              </div>
            )}

            <Card>
              <CardContent className="p-5 text-sm text-gray-600">
                <p className="font-bold text-gray-950">Fonte dos dados</p>
                <p className="mt-2">
                  Câmara dos Deputados - Dados Abertos. Consulta por número oficial da proposição, autores, votações relacionadas e votos nominais por votação quando disponíveis.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default AgendaDetailPage;
