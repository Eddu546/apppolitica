
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Filter, Building2, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const SenadoresPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedParty, setSelectedParty] = useState('');

  // Mock data para demonstração
  const [senadores] = useState([
    {
      id: 1,
      nome: 'Eduardo Braga',
      partido: 'MDB',
      estado: 'AM',
      foto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
      proposicoes: 23,
      presenca: 91,
      mandato: '2019-2027'
    },
    {
      id: 2,
      nome: 'Simone Tebet',
      partido: 'MDB',
      estado: 'MS',
      foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
      proposicoes: 31,
      presenca: 95,
      mandato: '2015-2023'
    },
    {
      id: 3,
      nome: 'Randolfe Rodrigues',
      partido: 'REDE',
      estado: 'AP',
      foto: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
      proposicoes: 42,
      presenca: 88,
      mandato: '2011-2027'
    },
    {
      id: 4,
      nome: 'Eliziane Gama',
      partido: 'CIDADANIA',
      estado: 'MA',
      foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
      proposicoes: 28,
      presenca: 93,
      mandato: '2019-2027'
    },
    {
      id: 5,
      nome: 'Flávio Bolsonaro',
      partido: 'PL',
      estado: 'RJ',
      foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      proposicoes: 19,
      presenca: 82,
      mandato: '2019-2027'
    },
    {
      id: 6,
      nome: 'Katia Abreu',
      partido: 'PP',
      estado: 'TO',
      foto: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=150&h=150&fit=crop&crop=face',
      proposicoes: 35,
      presenca: 89,
      mandato: '2015-2023'
    }
  ]);

  const estados = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
  const partidos = ['MDB', 'PL', 'PT', 'PSDB', 'PP', 'REPUBLICANOS', 'PSB', 'UNIÃO', 'PDT', 'REDE', 'CIDADANIA', 'PSOL'];

  const filteredSenadores = senadores.filter(senador => {
    const matchesSearch = senador.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = selectedState === '' || senador.estado === selectedState;
    const matchesParty = selectedParty === '' || senador.partido === selectedParty;
    return matchesSearch && matchesState && matchesParty;
  });

  const handleSenadorClick = (senador) => {
    toast({
      title: "🚧 Perfil detalhado em desenvolvimento",
      description: `O perfil completo de ${senador.nome} ainda não está implementado—mas não se preocupe! Você pode solicitar isso no seu próximo prompt! 🚀`,
    });
  };

  return (
    <>
      <Helmet>
        <title>Senadores - CivicTech Brasil</title>
        <meta name="description" content="Explore o perfil completo dos 81 senadores brasileiros. Veja proposições, presença e atividades parlamentares de cada senador." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Senadores da República
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Conheça os 81 senadores brasileiros e acompanhe suas atividades no Senado Federal em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar senador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* State Filter */}
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os Estados</option>
                {estados.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>

              {/* Party Filter */}
              <select
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os Partidos</option>
                {partidos.map(partido => (
                  <option key={partido} value={partido}>{partido}</option>
                ))}
              </select>

              {/* Clear Filters */}
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

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer hover-lift"
                onClick={() => handleSenadorClick(senador)}
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={senador.foto}
                      alt={senador.nome}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{senador.nome}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">{senador.partido}</span>
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {senador.estado}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Proposições</span>
                      <span className="text-lg font-bold text-blue-600">{senador.proposicoes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Presença</span>
                      <span className="text-lg font-bold text-green-600">{senador.presenca}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Mandato
                      </span>
                      <span className="text-sm font-medium text-gray-900">{senador.mandato}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredSenadores.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum senador encontrado</h3>
              <p className="text-gray-600">Tente ajustar os filtros de busca.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SenadoresPage;
