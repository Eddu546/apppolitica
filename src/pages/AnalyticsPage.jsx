import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Loader2, UserCheck, Percent, FileText, DollarSign } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

// Componente para um cartão de KPI individual
const KpiCard = ({ icon: Icon, title, value, loading, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {loading ? (
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      ) : (
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      )}
      <div className="text-sm text-gray-600">{title}</div>
    </motion.div>
  );
};

const AnalyticsPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPolitician, setSelectedPolitician] = useState(null);
  const [loadingKpis, setLoadingKpis] = useState(false);
  const [kpiData, setKpiData] = useState(null);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const fetchPoliticians = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Erro ao buscar políticos:", error);
      }
    };
    const debounceTimer = setTimeout(() => fetchPoliticians(), 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedPolitician) return;
    const fetchKpis = async () => {
      setLoadingKpis(true);
      setKpiData(null);
      try {
        const { tipo, id } = selectedPolitician;
        const tipoSlug = tipo.toLowerCase();
        const [presencaRes, lealdadeRes, despesasRes, proposicoesRes] = await Promise.all([
          fetch(`http://localhost:8000/api/kpis/${tipoSlug}/${id}/presenca`),
          fetch(`http://localhost:8000/api/kpis/${tipoSlug}/${id}/lealdade`),
          fetch(`http://localhost:8000/api/${tipoSlug}s/${id}/despesas`),
          fetch(`http://localhost:8000/api/${tipoSlug}s/${id}/proposicoes`),
        ]);
        const presencaData = await presencaRes.json();
        const lealdadeData = await lealdadeRes.json();
        const despesasData = await despesasRes.json();
        const proposicoesData = await proposicoesRes.json();
        setKpiData({
          presenca: presencaData.presenca,
          lealdade: lealdadeData.lealdade,
          despesas: despesasData,
          proposicoes: proposicoesData.length,
        });
      } catch (error) {
        toast({ title: "Erro ao calcular KPIs", description: "Não foi possível buscar todos os dados do político.", variant: "destructive" });
      } finally {
        setLoadingKpis(false);
      }
    };
    fetchKpis();
  }, [selectedPolitician, toast]);

  const handleSelectPolitician = (politician) => {
    setSelectedPolitician(politician);
    setSearchQuery('');
    setSearchResults([]);
  };

  // --- NOVA FUNÇÃO PARA O 'ENTER' ---
  const handleSearchSubmit = (event) => {
    event.preventDefault(); // Impede que a página recarregue
    if (searchResults.length > 0) {
      handleSelectPolitician(searchResults[0]); // Seleciona o primeiro resultado
    }
  };

  return (
    <>
      <Helmet>
        <title>Desempenho Individual - Fiscaliza, MBL!</title>
        <meta name="description" content="Analise o desempenho de um deputado ou senador através de indicadores-chave." />
      </Helmet>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Calculadora de Desempenho</h1>
            <p className="text-lg text-gray-600">Pesquise por um deputado ou senador e veja os seus indicadores-chave.</p>
          </div>
          
          <div className="relative">
            {/* --- O <input> agora está dentro de um <form> --- */}
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Digite o nome de um político e pressione Enter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-lg pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </form>
            {searchResults.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map(p => (
                  <li key={p.id} onClick={() => handleSelectPolitician(p)} className="flex items-center p-3 hover:bg-yellow-50 cursor-pointer">
                    {/* --- CORREÇÃO DA IMAGEM AQUI --- */}
                    <img src={p.foto} alt={p.nome} className="w-10 h-10 rounded-full mr-3 object-cover" />
                    <div>
                      <p className="font-bold">{p.nome}</p>
                      <p className="text-sm text-gray-500">{p.partido}-{p.uf}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-12">
            {!selectedPolitician && (
              <div className="text-center text-gray-500 py-16">
                <UserCheck className="w-16 h-16 mx-auto mb-4" />
                <p>Selecione um político para ver os seus dados de desempenho.</p>
              </div>
            )}
            {selectedPolitician && (
              <div>
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 bg-white rounded-lg shadow-md border">
                  {/* --- CORREÇÃO DA IMAGEM AQUI --- */}
                  <img src={selectedPolitician.foto} alt={selectedPolitician.nome} className="w-24 h-24 rounded-full border-4 border-yellow-400 object-cover" />
                  <div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">{selectedPolitician.nome}</h2>
                    <p className="text-lg text-gray-600">{selectedPolitician.partido} - {selectedPolitician.uf}</p>
                    <Link to={`/politico/${selectedPolitician.tipo.toLowerCase()}/${selectedPolitician.id}`} className="text-sm text-yellow-600 hover:underline mt-1 block">
                      Ver Perfil Completo
                    </Link>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KpiCard icon={Percent} title="Lealdade Partidária" value={kpiData ? `${kpiData.lealdade.toFixed(2)}%` : '0.00%'} loading={loadingKpis} color="green" />
                  <KpiCard icon={UserCheck} title="Presença em Votações" value={kpiData ? `${kpiData.presenca.toFixed(2)}%` : '0.00%'} loading={loadingKpis} color="purple" />
                  <KpiCard icon={DollarSign} title="Gastos (Últimos 90 dias)" value={kpiData ? `${kpiData.despesas.length} registos` : '0'} loading={loadingKpis} color="orange" />
                  <KpiCard icon={FileText} title="Proposições Apresentadas" value={kpiData ? kpiData.proposicoes.toString() : '0'} loading={loadingKpis} color="blue" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsPage;