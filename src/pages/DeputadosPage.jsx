import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPin, Search, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getAllDeputadosList } from '@/services/camara';
import { filterAndSortByName } from '@/lib/search';

const estados = ['SP', 'RJ', 'MG', 'BA', 'RS', 'PR', 'PE', 'CE', 'PA', 'MA', 'SC', 'GO', 'PB', 'ES', 'AM', 'RN', 'AL', 'PI', 'MT', 'DF', 'MS', 'SE', 'RO', 'TO', 'AC', 'AP', 'RR'];

const DeputadosPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [deputados, setDeputados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeputados = async () => {
      setLoading(true);
      try {
        const allDeputadosRaw = await getAllDeputadosList();
        if (!allDeputadosRaw || allDeputadosRaw.length === 0) throw new Error('Lista vazia');

        setDeputados(allDeputadosRaw.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
      } catch (error) {
        console.error('Erro lista deputados:', error);
        toast({
          title: 'Erro de conexão',
          description: 'Não foi possível carregar a lista. Tente recarregar.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDeputados();
  }, [toast]);

  const partidos = useMemo(
    () => [...new Set(deputados.map((deputado) => deputado.siglaPartido))].sort().filter(Boolean),
    [deputados]
  );

  const filteredDeputados = useMemo(() => {
    const filteredByName = filterAndSortByName(deputados, searchTerm, (deputado) => deputado.nome || '');

    return filteredByName.filter((deputado) => {
      const matchesState = selectedState === '' || deputado.siglaUf === selectedState;
      const matchesParty = selectedParty === '' || deputado.siglaPartido === selectedParty;
      return matchesState && matchesParty;
    });
  }, [deputados, searchTerm, selectedParty, selectedState]);

  const hasActiveFilter = searchTerm || selectedState || selectedParty;

  return (
    <>
      <Helmet>
        <title>Deputados - FISCALIZA</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Deputados Federais</h1>
              <p className="text-lg text-gray-600">
                Lista de deputados em exercício retornada pela Câmara dos Deputados.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800">
                <ShieldCheck className="h-4 w-4" />
                Fonte oficial: Dados Abertos da Câmara
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-20 z-40 border-b bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <select value={selectedState} onChange={(event) => setSelectedState(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none">
                <option value="">Todos os estados</option>
                {estados.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>

              <select value={selectedParty} onChange={(event) => setSelectedParty(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none">
                <option value="">Todos os partidos</option>
                {partidos.map((partido) => <option key={partido} value={partido}>{partido}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-gray-600">
                Mostrando <strong>{filteredDeputados.length}</strong> de <strong>{deputados.length}</strong> deputados carregados.
              </p>
              {hasActiveFilter && (
                <p className="mt-1 text-sm text-gray-500">Filtros ativos: busca, estado ou partido.</p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-600" />
              <p className="text-gray-500">Carregando lista de deputados...</p>
            </div>
          ) : (
            <div key={`${searchTerm}-${selectedState}-${selectedParty}`} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDeputados.map((deputado) => (
                <button
                  key={deputado.id}
                  type="button"
                  className="group overflow-hidden rounded-xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:border-blue-200 hover:shadow-lg"
                  onClick={() => navigate(`/politico/${deputado.id}`)}
                >
                  <div className="flex items-center space-x-4 p-6">
                    <img
                      src={deputado.urlFoto}
                      alt={deputado.nome}
                      className="h-20 w-20 rounded-full border-4 border-gray-50 bg-gray-200 object-cover group-hover:border-blue-50"
                      onError={(event) => {
                        event.currentTarget.src = 'https://www.camara.leg.br/tema/assets/images/foto-deputado-sem-foto.png';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-bold text-gray-900 group-hover:text-blue-600">{deputado.nome}</h3>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">{deputado.siglaPartido}</span>
                        <span className="flex items-center text-sm text-gray-500"><MapPin className="mr-1 h-3 w-3" />{deputado.siglaUf}</span>
                      </div>
                      <div className="mt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Ver dados, fontes e indicadores</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && filteredDeputados.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center text-gray-500">
              Nenhum deputado encontrado com estes filtros.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DeputadosPage;
