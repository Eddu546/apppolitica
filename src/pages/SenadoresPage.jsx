import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, MapPin, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getSenadoresAtuais } from '@/services/senado';
import { filterAndSortByFields } from '@/lib/search';

const fallbackPhoto = 'https://www.senado.leg.br/senadores/img/fotos-oficiais/senador_sem_foto.jpg';

const formatDate = (value) => {
  if (!value) return 'não informado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

const SenadoresPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [senadores, setSenadores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getSenadoresAtuais();
        if (!data || data.length === 0) throw new Error("Lista vazia");
        setSenadores(data);
      } catch (error) {
        console.error("Erro ao carregar senadores:", error);
        toast({
          title: "Indisponibilidade Temporária",
          description: "Não foi possível conectar à base de dados do Senado. Tente novamente em instantes.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const estados = [...new Set(senadores.map((s) => s.uf))].sort().filter(Boolean);
  const partidos = [...new Set(senadores.map(s => s.partido))].sort().filter(Boolean);
  const sourceMeta = senadores.__meta || {};

  const filteredSenadores = filterAndSortByFields(
    senadores.filter(senador => {
      const matchesState = selectedState === '' || senador.uf === selectedState;
      const matchesParty = selectedParty === '' || senador.partido === selectedParty;
      return matchesState && matchesParty;
    }),
    searchTerm,
    [
      (senador) => senador.nome,
      (senador) => senador.partido,
      (senador) => senador.uf,
      () => 'Senador Senado Federal',
    ]
  );

  const handleSenadorClick = (id) => {
    navigate(`/senador/${id}`);
  };

  return (
    <>
      <Helmet>
        <title>Senadores - FISCALIZA</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-yellow-400/20 bg-black shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-sm font-bold text-yellow-300">
                <ShieldCheck className="h-4 w-4" />
                Fonte oficial do Senado
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Senadores da República
              </h1>
              <p className="text-lg text-zinc-300">
                Lista atual de senadores em exercício. Indicadores sensíveis aparecem apenas quando houver fonte oficial confirmável.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border-b sticky top-20 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome, partido ou UF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
                />
              </div>

              <select 
                value={selectedState} 
                onChange={(e) => setSelectedState(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none bg-white transition-all"
              >
                <option value="">Todos os Estados</option>
                {estados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>

              <select 
                value={selectedParty} 
                onChange={(e) => setSelectedParty(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none bg-white transition-all"
              >
                <option value="">Todos os Partidos</option>
                {partidos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <Button 
                variant="outline" 
                onClick={() => { setSearchTerm(''); setSelectedState(''); setSelectedParty(''); }}
                className="hover:bg-gray-100"
              >
                <Filter className="w-4 h-4 mr-2" /> Limpar
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-gray-500">Senadores carregados</p>
              <p className="text-2xl font-black text-gray-950">{senadores.length}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-gray-500">Lista filtrada</p>
              <p className="text-2xl font-black text-gray-950">{filteredSenadores.length}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-gray-500">Partidos</p>
              <p className="text-2xl font-black text-gray-950">{partidos.length}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-gray-500">Fonte</p>
              <p className="text-sm font-bold text-gray-950">Senado Federal</p>
              <p className="text-xs text-gray-500">Atualizado: {formatDate(sourceMeta.fetchedAt)}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-12 h-12 text-yellow-600 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSenadores.map((senador) => (
                <motion.div 
                  key={senador.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group cursor-pointer hover:shadow-lg hover:border-yellow-300 transition-all duration-300" 
                  onClick={() => handleSenadorClick(senador.id)}
                >
                  <div className="p-6 flex items-center space-x-4">
                    <div className="relative flex-shrink-0">
                        <img 
                          src={senador.foto} 
                          alt={senador.nome} 
                          className="w-20 h-20 rounded-full object-cover border-4 border-gray-50 group-hover:border-yellow-50 transition-colors" 
                          onError={(e) => e.target.src = fallbackPhoto} 
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-yellow-700 transition-colors">
                        {senador.nome}
                      </h3>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-50 text-yellow-900 border border-yellow-200">
                          {senador.partido}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400" />{senador.uf}
                        </span>
                      </div>
                      <div className="mt-3">
                        <span className="text-[10px] text-yellow-700 font-bold uppercase tracking-wider">Ver dados, fontes e indicadores</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {!loading && filteredSenadores.length === 0 && (
             <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                <Filter className="w-10 h-10 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Nenhum senador encontrado</p>
                <p className="text-sm">Tente ajustar seus filtros de busca.</p>
             </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SenadoresPage;
