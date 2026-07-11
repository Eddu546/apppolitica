import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CalendarDays, ExternalLink, Info, Loader2, Mail, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import TrustMetricCard from '@/components/TrustMetricCard';
import ValidatedMetricsPanel from '@/components/ValidatedMetricsPanel';
import {
  getSenadorDespesas,
  getSenadorDetalhes,
  getSenadorDiscursos,
  getSenadorRelatorias,
  getSenadorVotacoes,
} from '@/services/senado';
import { buildSenadorMetrics } from '@/lib/legislative-logic';
import { fetchValidatedMetrics } from '@/services/corrections';
import { ensureArray } from '@/services/senado';
import { DEFAULT_LEGISLATIVE_YEAR, LEGISLATIVE_YEARS } from '@/lib/legislative-years';

const fallbackPhoto = 'https://www.senado.leg.br/senadores/img/fotos-oficiais/senador_sem_foto.jpg';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('pt-BR');
};

const DetailBox = ({ label, value }) => (
  <div className="rounded-lg bg-gray-50 p-3">
    <span className="block text-gray-500 text-xs uppercase font-bold">{label}</span>
    <span className="font-medium text-gray-900">{value || '-'}</span>
  </div>
);

const SenateCitizenSummary = ({ info, mandato, sourceUrl, fetchedAt }) => (
  <Card className="border-yellow-200 bg-yellow-50">
    <CardContent className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-yellow-700" />
        <h2 className="font-black text-gray-950">Resumo cidadão</h2>
      </div>
      <p className="text-sm leading-relaxed text-yellow-950">
        {info.NomeParlamentar} representa {info.UfParlamentar || 'UF não informada'} no Senado Federal pelo partido {info.SiglaPartidoParlamentar || 'não informado'}.
        O mandato de senador dura 8 anos, e esta página usa a ficha oficial retornada pelo Senado para mostrar identificação, partido, estado, contato e período do mandato.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <DetailBox label="Início do mandato" value={formatDate(mandato.PrimeiraLegislaturaDoMandato?.DataInicio)} />
        <DetailBox label="Fim previsto" value={formatDate(mandato.SegundaLegislaturaDoMandato?.DataFim)} />
        <DetailBox label="Consulta oficial" value={formatDate(fetchedAt)} />
      </div>
      {sourceUrl && (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-yellow-900 hover:underline">
          Abrir perfil oficial do Senado <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </CardContent>
  </Card>
);

const SenateUnavailableDataPanel = () => (
  <Card className="border-yellow-200">
    <CardContent className="p-6">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-700" />
        <h3 className="font-black text-gray-950">Dados ainda em normalização</h3>
      </div>
      <p className="text-sm leading-relaxed text-gray-600">
        O FISCALIZA ainda não usa números automáticos para despesas, votações, matérias, relatorias ou discursos de senadores porque esses dados precisam de adaptação e conferência por fonte oficial específica. Até isso ficar auditável, a página mostra “dado indisponível” em vez de estimativa.
      </p>
      <div className="mt-4 grid gap-2 text-sm text-gray-700">
        <p><strong>Disponível com segurança agora:</strong> identificação, partido, UF, foto, contato e mandato.</p>
        <p><strong>Em validação:</strong> despesas, votações nominais, autoria de matérias, relatorias e discursos.</p>
      </div>
    </CardContent>
  </Card>
);

const SenatorProfilePage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [senador, setSenador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anoSelecionado, setAnoSelecionado] = useState(DEFAULT_LEGISLATIVE_YEAR);
  const [relatorias, setRelatorias] = useState([]);
  const [votacoes, setVotacoes] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [discursos, setDiscursos] = useState([]);
  const [metricasValidadas, setMetricasValidadas] = useState([]);

  const anosDisponiveis = LEGISLATIVE_YEARS;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dados = await getSenadorDetalhes(id);
        if (!dados) throw new Error('Senador não encontrado');
        setSenador(dados);

        const ano = parseInt(anoSelecionado, 10);
        const nomeParlamentar = dados.IdentificacaoParlamentar?.NomeParlamentar;
        const [listaRelatorias, listaVotacoes, listaDespesas, listaDiscursos, listaValidadas] = await Promise.all([
          getSenadorRelatorias(id, ano),
          getSenadorVotacoes(id, ano),
          getSenadorDespesas(id, ano),
          getSenadorDiscursos(id, ano),
          nomeParlamentar
            ? fetchValidatedMetrics({ parlamentar: nomeParlamentar, ano: anoSelecionado })
            .then((result) => result.data || [])
              .catch(() => [])
            : Promise.resolve([]),
        ]);

        setRelatorias(listaRelatorias || []);
        setVotacoes(listaVotacoes || []);
        setDespesas(listaDespesas || []);
        setDiscursos(listaDiscursos || []);
        setMetricasValidadas(listaValidadas || []);
      } catch (error) {
        console.warn('Erro ao carregar senador:', error);
        toast({ title: 'Erro', description: 'Perfil indisponível no momento.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, anoSelecionado, toast]);

  const metrics = useMemo(
    () => buildSenadorMetrics({ relatorias, votacoes, despesas, discursos, fetchedAt: senador?.__meta?.fetchedAt }),
    [relatorias, votacoes, despesas, discursos, senador]
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400"><Loader2 className="w-10 h-10 animate-spin text-yellow-600" /></div>;
  }

  if (!senador) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Senador não encontrado.</div>;
  }

  const info = senador.IdentificacaoParlamentar;
  const mandatoRaw = senador.Mandatos?.Mandato;
  const mandato = Array.isArray(mandatoRaw) ? mandatoRaw[0] : (mandatoRaw || {});
  const suplentes = ensureArray(mandato.Suplentes?.Suplente);
  const exercicios = ensureArray(mandato.Exercicios?.Exercicio);
  const officialPageUrl = info.UrlPaginaParlamentar || '';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Helmet><title>{info.NomeParlamentar} - Senado</title></Helmet>

      <div className="border-b border-yellow-400/20 bg-black pt-8 pb-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <Link to="/senadores" className="text-zinc-400 hover:text-yellow-300 inline-flex items-center text-sm mb-8 font-medium transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para lista
          </Link>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <img
              src={info.UrlFotoParlamentar}
              alt={info.NomeParlamentar}
              className="w-40 h-40 rounded-full object-cover border-4 border-yellow-400/30 shadow-xl bg-gray-200"
              onError={(e) => { e.currentTarget.src = fallbackPhoto; }}
            />

            <div className="text-center md:text-left flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-sm font-bold text-yellow-300">
                <ShieldCheck className="h-4 w-4" />
                Perfil oficial do Senado
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{info.NomeParlamentar}</h1>
              <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-yellow-400 text-black border border-yellow-300">
                  {info.SiglaPartidoParlamentar}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-zinc-900 text-zinc-100 border border-zinc-700">
                  {info.UfParlamentar}
                </span>
              </div>
              <div className="mt-5 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm text-yellow-100">
                Indicadores do Senado são exibidos com cautela. O FISCALIZA não usa score geral nem transforma registros incompletos em acusações de falta.
              </div>
            </div>

            <div className="bg-zinc-950 border border-yellow-400/30 rounded-xl p-5">
              <p className="text-xs font-bold text-yellow-300 uppercase tracking-wide">Ano consultado</p>
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

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <SenateCitizenSummary info={info} mandato={mandato} sourceUrl={officialPageUrl} fetchedAt={senador.__meta?.fetchedAt} />
            <ValidatedMetricsPanel items={metricasValidadas} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <TrustMetricCard metric={metrics.relatorias} />
              <TrustMetricCard metric={metrics.votacoes} />
              <TrustMetricCard metric={metrics.despesas} />
              <TrustMetricCard metric={metrics.discursos} />
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                  <CalendarDays className="w-5 h-5 mr-2 text-yellow-700" /> Dados oficiais do mandato
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <DetailBox label="Início" value={formatDate(mandato.PrimeiraLegislaturaDoMandato?.DataInicio)} />
                  <DetailBox label="Fim previsto" value={formatDate(mandato.SegundaLegislaturaDoMandato?.DataFim)} />
                  <DetailBox label="Exercícios retornados" value={exercicios.length || 'Fonte não retornou'} />
                  <DetailBox label="Código do mandato" value={mandato.CodigoMandato} />
                  <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2">
                    <span className="block text-gray-500 text-xs uppercase font-bold">Contato oficial</span>
                    <span className="font-medium text-yellow-800 break-all">{info.EmailParlamentar || 'Não informado'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-yellow-700" /> Suplentes informados
                </h3>
                {suplentes.length ? (
                  <div className="grid gap-3">
                    {suplentes.map((suplente, index) => (
                      <div key={`${suplente.NomeParlamentar || suplente.CodigoParlamentar}-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                        <p className="font-bold text-gray-950">{suplente.NomeParlamentar || suplente.DescricaoParticipacao || 'Nome não informado'}</p>
                        <p className="text-gray-500">{suplente.DescricaoParticipacao || `Suplente ${index + 1}`}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">A consulta oficial não retornou suplentes neste formato.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <SenateUnavailableDataPanel />
            <Card>
              <CardContent className="p-6">
                <h4 className="font-bold text-gray-900 mb-2">Transparência ativa</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Para despesas e detalhes que ainda não estão normalizados no site, consulte as fontes oficiais.
                </p>
                <div className="space-y-2">
                  <a href="https://www6g.senado.leg.br/transparencia/sen/" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-yellow-400 text-black hover:bg-yellow-300">
                      Portal da Transparência <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                  {officialPageUrl && (
                    <a href={officialPageUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full">
                        Perfil oficial <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-yellow-700" /> Contato parlamentar
                </h4>
                <p className="text-sm text-gray-600 break-all">{info.EmailParlamentar || 'O Senado não retornou e-mail nesta consulta.'}</p>
                {info.EmailParlamentar && (
                  <a href={`mailto:${info.EmailParlamentar}`}>
                    <Button variant="outline" className="mt-4 w-full">
                      Enviar e-mail
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-sm leading-relaxed text-gray-600">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-yellow-700" /> Como ler esta página
                </h4>
                <p>
                  A ficha do senador é oficial. Já os indicadores de atuação ainda dependem de integração segura com bases específicas do Senado. Quando o dado não está confirmado, o FISCALIZA mostra indisponibilidade.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SenatorProfilePage;
