
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Building2, Calendar, DollarSign, FileText, Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const AnalyticsPage = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('2024');

  const handleChartClick = (chartName) => {
    toast({
      title: "🚧 Gráfico interativo em desenvolvimento",
      description: `${chartName} ainda não está implementado—mas não se preocupe! Você pode solicitar isso no seu próximo prompt! 🚀`,
    });
  };

  const stats = [
    {
      title: 'Proposições Apresentadas',
      value: '2.847',
      change: '+12%',
      trend: 'up',
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Votações Realizadas',
      value: '156',
      change: '+8%',
      trend: 'up',
      icon: Vote,
      color: 'green'
    },
    {
      title: 'Gastos Públicos',
      value: 'R$ 45.2M',
      change: '-3%',
      trend: 'down',
      icon: DollarSign,
      color: 'orange'
    },
    {
      title: 'Presença Média',
      value: '87.3%',
      change: '+2%',
      trend: 'up',
      icon: Users,
      color: 'purple'
    }
  ];

  const chartData = [
    {
      title: 'Proposições por Partido',
      description: 'Distribuição de proposições apresentadas por partido político',
      type: 'bar'
    },
    {
      title: 'Presença por Estado',
      description: 'Taxa de presença média dos parlamentares por estado',
      type: 'map'
    },
    {
      title: 'Gastos Mensais',
      description: 'Evolução dos gastos públicos ao longo do ano',
      type: 'line'
    },
    {
      title: 'Temas Mais Votados',
      description: 'Principais temas das votações realizadas',
      type: 'pie'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Analytics - CivicTech Brasil</title>
        <meta name="description" content="Análises e insights sobre a atividade parlamentar brasileira. Visualize dados, tendências e estatísticas dos deputados e senadores." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Analytics Parlamentares
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl">
                  Insights e análises detalhadas sobre a atividade parlamentar brasileira com dados em tempo real.
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600',
                green: 'bg-green-100 text-green-600',
                orange: 'bg-orange-100 text-orange-600',
                purple: 'bg-purple-100 text-purple-600'
              };

              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${colorClasses[stat.color]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className={`flex items-center text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className={`w-4 h-4 mr-1 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                      {stat.change}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.title}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {chartData.map((chart, index) => (
              <motion.div
                key={chart.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleChartClick(chart.title)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{chart.title}</h3>
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-6">{chart.description}</p>
                
                {/* Mock Chart Placeholder */}
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Clique para visualizar o gráfico</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Insights Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-8 bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Insights Principais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Maior Atividade</h4>
                <p className="text-blue-700 text-sm">
                  O partido PT apresentou 23% mais proposições este ano comparado ao período anterior.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Melhor Presença</h4>
                <p className="text-green-700 text-sm">
                  Deputados do estado de SC têm a maior taxa de presença média (94.2%).
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">Economia</h4>
                <p className="text-orange-700 text-sm">
                  Gastos públicos reduziram 3% em relação ao mesmo período do ano passado.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsPage;
