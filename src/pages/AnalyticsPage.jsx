import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, DollarSign, FileText, Vote } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Função para formatar o número como moeda brasileira
const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    return 'R$ 0,00';
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const AnalyticsPage = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('2024');
  const [loading, setLoading] = useState(true);
  
  // Estado para armazenar os dados de gastos vindos da API
  const [gastosData, setGastosData] = useState({
    totalGastos: 0,
    deputadosAnalisados: 0,
  });

  // useEffect para buscar os dados de analytics do nosso backend
  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8000/api/analytics/gastos-deputados');
        if (!response.ok) {
          throw new Error('Falha ao buscar dados de analytics');
        }
        const data = await response.json();
        setGastosData(data);
      } catch (error) {
        console.error('Erro ao buscar analytics:', error);
        toast({
          title: "Erro de Analytics",
          description: "Não foi possível carregar os dados de gastos do backend.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [toast]);


  const handleChartClick = (chartName) => {
    toast({
      title: "🚧 Gráfico interativo em desenvolvimento",
      description: `${chartName} ainda não está implementado—mas não se preocupe! Você pode solicitar isso no seu próximo prompt! 🚀`,
    });
  };

  // Os outros stats continuam como exemplo por enquanto
  const stats = [
    { title: 'Proposições Apresentadas', value: '2.847', icon: FileText, color: 'blue' },
    { title: 'Votações Realizadas', value: '156', icon: Vote, color: 'green' },
    { 
      title: `Gastos Públicos (Amostra de ${gastosData.deputadosAnalisados} deps)`, 
      value: loading ? 'Calculando...' : formatCurrency(gastosData.totalGastos), // <-- USA O DADO REAL AQUI
      icon: DollarSign, 
      color: 'orange' 
    },
    { title: 'Presença Média', value: '87.3%', icon: Users, color: 'purple' }
  ];

  // Gráficos continuam como exemplo
  const chartData = [
    { title: 'Proposições por Partido', description: 'Distribuição de proposições por partido' },
    { title: 'Presença por Estado', description: 'Taxa de presença média por estado' },
    { title: 'Gastos Mensais', description: 'Evolução dos gastos ao longo do ano' },
    { title: 'Temas Mais Votados', description: 'Principais temas das votações' }
  ];

  return (
    <>
      <Helmet>
        <title>Analytics - Fiscaliza, MBL!</title>
        <meta name="description" content="Análises e insights sobre a atividade parlamentar brasileira." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Analytics Parlamentares
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl">
                  Insights sobre a atividade parlamentar com base em dados públicos.
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const colorClasses = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', orange: 'bg-orange-100 text-orange-600', purple: 'bg-purple-100 text-purple-600' };
              return (
                <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${colorClasses[stat.color]}`}><Icon className="w-6 h-6" /></div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.title}</div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {chartData.map((chart, index) => (
              <motion.div key={chart.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }} className="bg-white rounded-xl p-6 shadow-sm cursor-pointer" onClick={() => handleChartClick(chart.title)}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{chart.title}</h3>
                <p className="text-gray-600 mb-6">{chart.description}</p>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-12 h-12 text-gray-400" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsPage;