import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const SenadoresPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate(); // Importamos o useNavigate
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [senadores, setSenadores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSenadores() {
      try {
        const response = await fetch('http://localhost:8000/api/senadores');
        if (!response.ok) {
          throw new Error(`Erro do servidor: ${response.status}`);
        }
        const data = await response.json();
        setSenadores(data);
      } catch (error) {
        console.error("Erro ao buscar dados dos senadores:", error);
        toast({
          title: "Erro de Conexão",
          description: "Não foi possível buscar os dados dos senadores.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchSenadores();
  }, [toast]);

  const partidos = [...new Set(senadores.map(s => s.partido))].sort();
  const estados = [...new Set(senadores.map(s => s.uf))].sort();

  const filteredSenadores = senadores.filter(senador => {
    const matchesSearch = senador.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = selectedState === '' || senador.uf === selectedState;
    const matchesParty = selectedParty === '' || senador.partido === selectedParty;
    return matchesSearch && matchesState && matchesParty;
  });

  return (
    <>
      <Helmet>
        <title>Senadores - Fiscaliza, MBL!</title>
        <meta name="description" content="Explore o perfil completo dos 81 senadores brasileiros." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Senadores da República
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Conheça os senadores brasileiros e acompanhe suas atividades no Senado Federal.
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
                  placeholder="Buscar senador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Todos os Estados</option>
                {estados.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
              <select
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Todos os Partidos</option>
                {partidos.map(partido => (
                  <option key={partido} value={partido}>{partido}</option>
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
            <p className="text-center text-gray-600">Carregando senadores...</p>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-gray-600">
                  Mostrando {filteredSenadores.length} de {senadores.length} senadores
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSenadores.map((senador, index) => (
                  <motion.div
                    key={senador.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer hover-lift"
                    // --- CORREÇÃO APLICADA AQUI ---
                    onClick={() => navigate(`/politico/senador/${senador.id}`)}
                  >
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <img
                          src={senador.foto}
                          alt={senador.nome}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{senador.nome}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">{senador.partido}-{senador.uf}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {filteredSenadores.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum senador encontrado</h3>
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

export default SenadoresPage;