import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter, Building2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const DeputadosPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [deputados, setDeputados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Busca os dados dos deputados no nosso backend
  useEffect(() => {
    async function fetchDeputados() {
      try {
        // Usamos a rota do nosso backend que já estava funcionando
        const response = await fetch('http://localhost:8000/api/deputados');
        if (!response.ok) {
          throw new Error('Erro na resposta da rede');
        }
        const data = await response.json();
        setDeputados(data);
      } catch (error) {
        console.error("Erro ao buscar dados dos deputados:", error);
        toast({
          title: 'Erro ao buscar deputados',
          description: 'Não foi possível carregar os dados. Verifique o backend.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDeputados();
  }, [toast]);

  // Pega as listas de partidos e estados dos dados reais
  const partidos = [...new Set(deputados.map((d) => d.partido))].sort();
  const estados = [...new Set(deputados.map((d) => d.uf))].sort();

  const deputadosFiltrados = deputados.filter((dep) => {
    const nomeMatch = dep.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const partidoMatch = selectedParty ? dep.partido === selectedParty : true;
    const estadoMatch = selectedState ? dep.uf === selectedState : true;
    return nomeMatch && partidoMatch && estadoMatch;
  });

  return (
    <>
      <Helmet>
        <title>Deputados Federais - Fiscaliza, MBL!</title>
        <meta name="description" content="Explore a lista completa dos 513 deputados federais brasileiros. Filtre por nome, partido ou estado." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Deputados Federais
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Conheça os 513 deputados federais e acompanhe o trabalho de quem representa você na Câmara.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <select
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Todos os Partidos</option>
                {partidos.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Todos os Estados</option>
                {estados.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedState('');
                  setSelectedParty('');
                }}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <p className="text-center text-gray-600">Carregando deputados...</p>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-gray-600">
                  Mostrando {deputadosFiltrados.length} de {deputados.length} deputados
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deputadosFiltrados.map((dep, index) => (
                  <motion.div
                    key={dep.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer hover-lift"
                    onClick={() => navigate(`/politico/${dep.id}`)}
                  >
                    <div className="p-6">
                      <div className="flex items-center space-x-4">
                        <img src={dep.foto} alt={dep.nome} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">{dep.nome}</h2>
                           <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">{dep.partido}-{dep.uf}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {deputadosFiltrados.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum deputado encontrado</h3>
                  <p className="text-gray-600">Tente ajustar os filtros de busca.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DeputadosPage;