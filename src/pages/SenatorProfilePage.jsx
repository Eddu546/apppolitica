import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Info, Loader2 } from 'lucide-react';
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

const SenatorProfilePage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [senador, setSenador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anoSelecionado, setAnoSelecionado] = useState('2024');
  const [relatorias, setRelatorias] = useState([]);
  const [votacoes, setVotacoes] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [discursos, setDiscursos] = useState([]);
  const [metricasValidadas, setMetricasValidadas] = useState([]);

  const anosDisponiveis = ['2023', '2024', '2025'];

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
    () => buildSenadorMetrics({ relatorias, votacoes, despesas, discursos }),
    [relatorias, votacoes, despesas, discursos]
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  }

  if (!senador) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Senador não encontrado.</div>;
  }

  const info = senador.IdentificacaoParlamentar;
  const mandatoRaw = senador.Mandatos?.Mandato;
  const mandato = Array.isArray(mandatoRaw) ? mandatoRaw[0] : (mandatoRaw || {});

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Helmet><title>{info.NomeParlamentar} - Senado</title></Helmet>

      <div className="bg-white border-b shadow-sm pt-8 pb-10">
        <div className="max-w-5xl mx-auto px-4">
          <Link to="/senadores" className="text-gray-500 hover:text-blue-600 inline-flex items-center text-sm mb-8 font-medium transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para lista
          </Link>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <img
              src={info.UrlFotoParlamentar}
              alt={info.NomeParlamentar}
              className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl bg-gray-200"
              onError={(e) => { e.currentTarget.src = 'https://www.senado.leg.br/senadores/img/fotos-oficiais/senador_sem_foto.jpg'; }}
            />

            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{info.NomeParlamentar}</h1>
              <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  {info.SiglaPartidoParlamentar}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-700 border border-gray-200">
                  {info.UfParlamentar}
                </span>
              </div>
              <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                Indicadores do Senado são exibidos com cautela. O FISCALIZA não usa score geral nem transforma registros incompletos em acusações de falta.
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
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

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
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
                  <Info className="w-5 h-5 mr-2 text-gray-400" /> Dados do mandato
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="block text-gray-500 text-xs uppercase font-bold">Início</span>
                    <span className="font-medium text-gray-900">{mandato.PrimeiraLegislaturaDoMandato?.DataInicio || '-'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="block text-gray-500 text-xs uppercase font-bold">Fim previsto</span>
                    <span className="font-medium text-gray-900">{mandato.SegundaLegislaturaDoMandato?.DataFim || '-'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg sm:col-span-2">
                    <span className="block text-gray-500 text-xs uppercase font-bold">Contato</span>
                    <span className="font-medium text-blue-600 break-all">{info.EmailParlamentar || 'Não informado'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h4 className="font-bold text-gray-900 mb-2">Transparência ativa</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Para despesas e detalhes que ainda não estão normalizados no site, consulte a fonte oficial.
                </p>
                <a href="https://www6g.senado.leg.br/transparencia/sen/" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Portal da Transparência
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SenatorProfilePage;
