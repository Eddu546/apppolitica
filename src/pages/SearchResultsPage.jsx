import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, FileText, Loader2, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { searchMajorAgendas } from '@/lib/major-agendas';

const fallbackPhoto = 'https://www.camara.leg.br/tema/assets/images/foto-deputado-sem-foto.png';

const AgendaResultCard = ({ agenda, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04 }}
    className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm"
  >
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{agenda.tema}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{agenda.tipo}</span>
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
            Voto nominal: {agenda.houve_voto_nominal}
          </span>
        </div>
        <h3 className="mt-3 text-xl font-black text-gray-950">{agenda.apelido_pauta}</h3>
        <p className="mt-1 text-sm font-bold text-blue-700">{agenda.numero_proposicao.join(' / ')}</p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700">{agenda.resumo_curto}</p>
        {agenda.observacao_voto && (
          <p className="mt-2 text-xs leading-relaxed text-gray-500">{agenda.observacao_voto}</p>
        )}
      </div>
      <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-3 text-xs leading-relaxed text-yellow-900 lg:max-w-xs">
        <ShieldCheck className="mb-1 h-4 w-4" />
        Esta e uma pauta cadastrada pelo FISCALIZA para ajudar a traducao. O voto individual aparece apenas nos perfis quando a Camara retorna registro nominal.
        <Link to={`/pautas?busca=${encodeURIComponent(agenda.apelido_pauta)}`} className="mt-2 block font-bold text-blue-700 hover:underline">
          Ver na pagina de pautas
        </Link>
      </div>
    </div>
  </motion.div>
);

const PoliticianResultCard = ({ politico, index }) => (
  <motion.div
    key={`${politico.origem}-${politico.id}`}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    <div className="flex flex-col items-center gap-6 rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:flex-row">
      <img
        className="h-20 w-20 rounded-full border-4 border-gray-100 bg-gray-200 object-cover"
        src={politico.foto}
        alt={politico.nome}
        loading="lazy"
        onError={(event) => {
          event.currentTarget.src = fallbackPhoto;
        }}
      />

      <div className="flex-grow text-center sm:text-left">
        <h2 className="text-xl font-bold text-gray-900">{politico.nome}</h2>
        <div className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${politico.origem === 'senado' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            {politico.cargo}
          </span>
          <span className="text-sm font-medium text-gray-500">
            {politico.partido} - {politico.uf}
          </span>
        </div>
      </div>

      <Link to={politico.link} className="w-full sm:w-auto">
        <Button className="w-full border border-blue-200 bg-white font-semibold text-blue-600 shadow-sm hover:border-blue-300 hover:bg-blue-50">
          Ver perfil
        </Button>
      </Link>
    </div>
  </motion.div>
);

const SearchResultsPage = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('q') || '';

  const [politicianResults, setPoliticianResults] = useState([]);
  const [agendaResults, setAgendaResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      setLoading(true);
      setError(false);
      setPoliticianResults([]);
      const agendas = searchMajorAgendas(query).slice(0, 5);
      setAgendaResults(agendas);

      try {
        const deputadosReq = fetch(`/api/camara/api/v2/deputados?nome=${encodeURIComponent(query)}&ordem=ASC&ordenarPor=nome&itens=20`)
          .then((response) => (response.ok ? response.json() : { dados: [] }))
          .then((data) => (data.dados || []).map((deputado) => ({
            id: deputado.id,
            nome: deputado.nome,
            partido: deputado.siglaPartido,
            uf: deputado.siglaUf,
            foto: deputado.urlFoto,
            cargo: 'Deputado Federal',
            link: `/politico/${deputado.id}`,
            origem: 'camara',
          })))
          .catch(() => []);

        const senadoresReq = fetch('/api/senado/senador/lista/atual.json')
          .then((response) => (response.ok ? response.json() : { ListaParlamentarEmExercicio: { Parlamentares: { Parlamentar: [] } } }))
          .then((data) => {
            const lista = data.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
            const arrayLista = Array.isArray(lista) ? lista : [lista];

            return arrayLista
              .filter((senador) => (senador.IdentificacaoParlamentar?.NomeParlamentar || '').toLowerCase().includes(query.toLowerCase()))
              .map((senador) => ({
                id: senador.IdentificacaoParlamentar.CodigoParlamentar,
                nome: senador.IdentificacaoParlamentar.NomeParlamentar,
                partido: senador.IdentificacaoParlamentar.SiglaPartidoParlamentar,
                uf: senador.IdentificacaoParlamentar.UfParlamentar,
                foto: senador.IdentificacaoParlamentar.UrlFotoParlamentar,
                cargo: 'Senador',
                link: `/senador/${senador.IdentificacaoParlamentar.CodigoParlamentar}`,
                origem: 'senado',
              }));
          })
          .catch(() => []);

        const [deputados, senadores] = await Promise.all([deputadosReq, senadoresReq]);
        setPoliticianResults([...senadores, ...deputados]);
      } catch (err) {
        console.error('Erro critico na busca:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const hasResults = agendaResults.length > 0 || politicianResults.length > 0;

  return (
    <>
      <Helmet>
        <title>Resultados para "{query}" - FISCALIZA</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 p-4 text-gray-900 md:p-8">
        <div className="mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="mb-2 text-3xl font-extrabold">Resultados da busca</h1>
            <p className="text-lg text-gray-600">
              Termo pesquisado: <span className="font-bold text-blue-600">"{query}"</span>
            </p>
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-600" />
              <p className="text-gray-500">Consultando bases oficiais e pautas cadastradas...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-red-700">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <div>
                <p className="font-bold">Erro ao buscar dados</p>
                <p className="text-sm">Nao foi possivel conectar com os servicos publicos no momento. Tente novamente.</p>
              </div>
            </div>
          ) : hasResults ? (
            <div className="space-y-8">
              {agendaResults.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-black text-gray-950">Pautas nacionais encontradas</h2>
                  </div>
                  <div className="space-y-3">
                    {agendaResults.map((agenda, index) => (
                      <AgendaResultCard key={agenda.id} agenda={agenda} index={index} />
                    ))}
                  </div>
                </section>
              )}

              {politicianResults.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Search className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-black text-gray-950">Politicos encontrados</h2>
                  </div>
                  <div className="space-y-4">
                    {politicianResults.map((politico, index) => (
                      <PoliticianResultCard key={`${politico.origem}-${politico.id}`} politico={politico} index={index} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-white py-20 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900">Nenhum resultado encontrado</h3>
              <p className="mx-auto mt-1 max-w-md text-gray-500">Tente buscar por nome, partido, pauta popular ou numero oficial como PL 2630/2020.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchResultsPage;
