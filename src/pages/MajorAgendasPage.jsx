import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ExternalLink, FileText, Search, ShieldCheck, Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { polishText } from '@/lib/display-text';
import { MAJOR_AGENDAS, searchMajorAgendas } from '@/lib/major-agendas';
import {
  fiscalizaAgendaPath,
  getCamaraPortalPropositionUrl,
  getCamaraPortalSearchUrl,
  parseOfficialNumber,
} from '@/lib/official-links';
import { getProposicaoByOfficialNumber } from '@/services/camara';
import AgendaDetailPage from '@/pages/AgendaDetailPage';

const voteStatusInfo = {
  sim: {
    label: 'Com voto nominal',
    icon: CheckCircle2,
    style: 'border-green-200 bg-green-50 text-green-700',
    explanation: 'Há registros nominais em etapas da pauta, então é possível procurar votos individuais nos perfis.',
  },
  parcial: {
    label: 'Voto parcial ou simbólico',
    icon: AlertTriangle,
    style: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    explanation: 'Parte da tramitação pode ter votação simbólica, requerimento ou destaque sem voto nominal individual completo.',
  },
  nao: {
    label: 'Sem voto nominal confirmado',
    icon: AlertTriangle,
    style: 'border-gray-200 bg-gray-50 text-gray-700',
    explanation: 'O cadastro ainda não encontrou voto nominal individual confiável para exibir como dado fiscalizável.',
  },
};

const StatPill = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4">
    <p className="text-xs font-bold uppercase text-gray-500">{label}</p>
    <p className="mt-1 text-2xl font-black text-gray-950">{value}</p>
  </div>
);

const OfficialPortalLink = ({ number }) => {
  const [officialUrl, setOfficialUrl] = useState(getCamaraPortalSearchUrl(number));
  const [mode, setMode] = useState('search');

  useEffect(() => {
    const parsed = parseOfficialNumber(number);
    let active = true;

    if (!parsed) {
      setOfficialUrl(getCamaraPortalSearchUrl(number));
      setMode('search');
      return () => {
        active = false;
      };
    }

    setMode('loading');
    getProposicaoByOfficialNumber({
      siglaTipo: parsed.type,
      numero: parsed.number,
      ano: parsed.year,
    })
      .then((proposicao) => {
        if (!active) return;
        if (proposicao?.id) {
          setOfficialUrl(getCamaraPortalPropositionUrl(proposicao.id));
          setMode('official');
        } else {
          setOfficialUrl(getCamaraPortalSearchUrl(number));
          setMode('search');
        }
      })
      .catch(() => {
        if (!active) return;
        setOfficialUrl(getCamaraPortalSearchUrl(number));
        setMode('search');
      });

    return () => {
      active = false;
    };
  }, [number]);

  const label =
    mode === 'official'
      ? `Abrir ${number} na Câmara`
      : mode === 'loading'
        ? `Localizando ${number}...`
        : `Buscar ${number} na Câmara`;

  return (
    <a
      href={officialUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${
        mode === 'official'
          ? 'border-blue-200 text-blue-700 hover:bg-blue-50'
          : 'border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100'
      }`}
    >
      {label} <ExternalLink className="h-4 w-4" />
    </a>
  );
};

const AgendaCard = ({ agenda }) => {
  const voteInfo = voteStatusInfo[agenda.houve_voto_nominal] || voteStatusInfo.parcial;
  const VoteIcon = voteInfo.icon;

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{polishText(agenda.tema)}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{agenda.tipo}</span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${voteInfo.style}`}>
              <VoteIcon className="h-3.5 w-3.5" />
              {voteInfo.label}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black text-gray-950">{polishText(agenda.apelido_pauta)}</h2>
            <p className="mt-1 text-sm font-bold text-blue-700">{agenda.numero_proposicao.join(' / ')}</p>
          </div>

          <p className="max-w-4xl text-sm leading-relaxed text-gray-700">{polishText(agenda.resumo_curto)}</p>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-relaxed text-blue-950">
              <p className="mb-1 font-bold">Leitura para o cidadão</p>
              {voteInfo.explanation}
            </div>
            {agenda.observacao_voto && (
              <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-3 text-sm leading-relaxed text-yellow-950">
                <p className="mb-1 font-bold">Observação sobre votos</p>
                {polishText(agenda.observacao_voto)}
              </div>
            )}
          </div>

          <details className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <summary className="cursor-pointer font-bold text-gray-950">Como fiscalizar esta pauta</summary>
            <div className="mt-3 space-y-2 leading-relaxed">
              <p>1. Consulte a proposição oficial nos Dados Abertos da Câmara pelos botões deste card.</p>
              <p>2. Abra o perfil de um deputado e entre na aba “Votações”.</p>
              <p>3. Procure pelo número oficial, apelido da pauta ou descrição da votação. Quando não houver voto nominal, o site deve mostrar isso como limitação.</p>
            </div>
          </details>
        </div>

        <div className="flex shrink-0 flex-col gap-2 lg:w-64">
          {agenda.numero_proposicao.map((number) => (
            <OfficialPortalLink key={number} number={number} />
          ))}
          <Link
            to={fiscalizaAgendaPath(agenda.numero_proposicao[0])}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Ver dados da pauta no FISCALIZA
          </Link>
          <Link
            to="/deputados"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
          >
            Ver deputados
          </Link>
        </div>
      </div>
    </article>
  );
};

const MajorAgendasPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const propositionSlug = searchParams.get('proposicao') || '';
  const [search, setSearch] = useState(searchParams.get('busca') || '');
  const [theme, setTheme] = useState('');
  const [voteStatus, setVoteStatus] = useState('');
  const searchParamValue = searchParams.get('busca') || '';

  useEffect(() => {
    setSearch(searchParamValue);
  }, [searchParamValue]);

  const themes = useMemo(
    () => [...new Set(MAJOR_AGENDAS.map((agenda) => agenda.tema).filter(Boolean))].sort(),
    []
  );

  const filteredAgendas = useMemo(() => {
    const base = search.trim() ? searchMajorAgendas(search) : MAJOR_AGENDAS;
    return base
      .filter((agenda) => !theme || agenda.tema === theme)
      .filter((agenda) => !voteStatus || agenda.houve_voto_nominal === voteStatus)
      .sort((a, b) => String(b.ano_pauta).localeCompare(String(a.ano_pauta)) || a.apelido_pauta.localeCompare(b.apelido_pauta, 'pt-BR'));
  }, [search, theme, voteStatus]);

  const totals = useMemo(() => ({
    all: MAJOR_AGENDAS.length,
    nominal: MAJOR_AGENDAS.filter((agenda) => agenda.houve_voto_nominal === 'sim').length,
    partial: MAJOR_AGENDAS.filter((agenda) => agenda.houve_voto_nominal === 'parcial').length,
    themes: themes.length,
  }), [themes.length]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    const nextParams = new URLSearchParams(searchParams);
    if (value.trim()) nextParams.set('busca', value.trim());
    else nextParams.delete('busca');
    setSearchParams(nextParams, { replace: true });
  };

  if (propositionSlug) {
    return <AgendaDetailPage slugOverride={propositionSlug} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Helmet>
        <title>Pautas nacionais - FISCALIZA</title>
      </Helmet>

      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                <FileText className="h-4 w-4" />
                Pautas para fiscalizar
              </div>
              <h1 className="text-3xl font-black text-gray-950">Pautas nacionais importantes</h1>
              <p className="mt-3 max-w-3xl text-gray-600">
                Consulte temas que geraram debate nacional, veja o número oficial e entenda se há voto nominal individual para fiscalizar nos perfis dos parlamentares.
              </p>
            </div>
            <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-4 text-sm leading-relaxed text-yellow-950 lg:max-w-sm">
              <ShieldCheck className="mb-2 h-5 w-5" />
              Esta lista é um cadastro editorial do FISCALIZA para orientar a busca. O voto individual continua vindo somente da Câmara dos Deputados.
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatPill label="Pautas cadastradas" value={totals.all} />
          <StatPill label="Com voto nominal" value={totals.nominal} />
          <StatPill label="Voto parcial" value={totals.partial} />
          <StatPill label="Temas" value={totals.themes} />
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={handleSearchChange}
                placeholder="Buscar pauta, apelido ou número oficial..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <select value={theme} onChange={(event) => setTheme(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Todos os temas</option>
              {themes.map((item) => (
                <option key={item} value={item}>{polishText(item)}</option>
              ))}
            </select>
            <select value={voteStatus} onChange={(event) => setVoteStatus(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Todos os votos</option>
              <option value="sim">Com voto nominal</option>
              <option value="parcial">Voto parcial/simbólico</option>
              <option value="nao">Sem voto nominal</option>
            </select>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-gray-700">{filteredAgendas.length} pautas encontradas</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href="https://dadosabertos.camara.leg.br/swagger/api.html#/Proposições" target="_blank" rel="noopener noreferrer">
                Documentação oficial
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link to="/meu-roteiro">Montar roteiro de fiscalização</Link>
            </Button>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-blue-950">
          <div className="mb-1 flex items-center gap-2 font-bold">
            <Vote className="h-4 w-4" />
            Utilidade pública desta página
          </div>
          Ela liga o nome popular da pauta ao número oficial. Isso ajuda a conferir se o voto exibido no perfil realmente pertence ao projeto, emenda, requerimento ou destaque daquela discussão.
        </div>

        {filteredAgendas.length > 0 ? (
          <div className="grid gap-4">
            {filteredAgendas.map((agenda) => (
              <AgendaCard key={agenda.id} agenda={agenda} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <h2 className="font-black text-gray-950">Nenhuma pauta encontrada</h2>
            <p className="mt-1 text-sm text-gray-500">Tente buscar por apelido, tema ou número oficial como PL 2630/2020.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MajorAgendasPage;

