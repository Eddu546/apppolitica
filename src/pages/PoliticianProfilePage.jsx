import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from 'react-helmet';
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
} from "chart.js";

// Registrando os componentes do Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  Title
);

const PoliticianProfilePage = () => {
  const { id } = useParams();
  const [politico, setPolitico] = useState(null);
  const [despesas, setDespesas] = useState([]);
  const [proposicoes, setProposicoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [politicoRes, despesasRes, proposicoesRes] = await Promise.all([
          fetch(`http://localhost:8000/api/deputados/${id}`),
          fetch(`http://localhost:8000/api/deputados/${id}/despesas`),
          fetch(`http://localhost:8000/api/deputados/${id}/proposicoes`),
        ]);

        if (!politicoRes.ok) throw new Error('Falha ao buscar dados do político');
        
        const politicoData = await politicoRes.json();
        const despesasData = despesasRes.ok ? await despesasRes.json() : [];
        const proposicoesData = proposicoesRes.ok ? await proposicoesRes.json() : [];

        setPolitico(politicoData);
        setDespesas(despesasData);
        setProposicoes(proposicoesData);

      } catch (err) {
        setError(err.message);
        console.error("Erro na página de perfil:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getDespesasChartData = () => {
    const despesasAgrupadas = despesas.reduce((acc, d) => {
      const tipo = d.tipoDespesa;
      const valor = parseFloat(d.valorLiquido);
      if (!acc[tipo]) acc[tipo] = 0;
      acc[tipo] += valor;
      return acc;
    }, {});

    const sortedDespesas = Object.entries(despesasAgrupadas)
      .sort(([,a],[,b]) => b-a)
      .slice(0, 7);

    return {
      labels: sortedDespesas.map(([tipo]) => tipo),
      datasets: [{
        label: 'Gastos por Tipo (R$)',
        data: sortedDespesas.map(([, valor]) => valor.toFixed(2)),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'],
      }],
    };
  };

  const getProposicoesChartData = () => {
    const proposicoesPorAno = proposicoes.reduce((acc, p) => {
      const ano = p.ano;
      if (!acc[ano]) acc[ano] = 0;
      acc[ano]++;
      return acc;
    }, {});
    
    const sortedAnos = Object.entries(proposicoesPorAno).sort(([a],[b]) => a-b);

    return {
      labels: sortedAnos.map(([ano]) => ano),
      datasets: [{
        label: 'Quantidade de Proposições',
        data: sortedAnos.map(([, count]) => count),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      }],
    };
  };
  
  // Função para formatar a data (ex: 2023-10-26 -> 26/10/2023)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Função para formatar valor em moeda brasileira
  const formatCurrency = (value) => {
    return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };


  if (loading) return <div className="p-6 text-center">Carregando perfil do político...</div>;
  if (error) return <div className="p-6 text-center text-red-600">Erro: {error}</div>;
  if (!politico) return <div className="p-6 text-center">Político não encontrado.</div>;

  return (
    <>
      <Helmet>
        <title>{`Perfil: ${politico.ultimoStatus.nome} - Fiscaliza, MBL!`}</title>
      </Helmet>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 p-6 bg-white rounded-lg shadow-md border">
          <img src={politico.ultimoStatus.urlFoto} alt={`Foto de ${politico.ultimoStatus.nome}`} className="w-32 h-32 rounded-full border-4 border-yellow-400 object-cover" />
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{politico.ultimoStatus.nome}</h1>
            <p className="text-xl text-gray-600">{politico.ultimoStatus.siglaPartido} - {politico.ultimoStatus.siglaUf}</p>
            <p className="text-sm text-gray-500 mt-2">Email: <a href={`mailto:${politico.ultimoStatus.email}`} className="text-yellow-600 hover:underline">{politico.ultimoStatus.email}</a></p>
          </div>
        </div>

        <div className="mb-12 bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-2xl font-bold text-center mb-6">Despesas da Cota Parlamentar</h2>
          {despesas.length > 0 ? (
            <>
              <div className="max-w-md mx-auto mb-10">
                <Doughnut data={getDespesasChartData()} options={{ plugins: { title: { display: true, text: 'Top 7 Tipos de Gastos (R$)' } } }} />
              </div>
              
              {/* --- NOVA TABELA DE ÚLTIMOS GASTOS --- */}
              <h3 className="text-xl font-bold mb-4 text-gray-800">Últimos Gastos Detalhados</h3>
              <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Despesa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {despesas.slice(0, 5).map((gasto) => ( // Pega os 5 gastos mais recentes
                      <tr key={gasto.codDocumento}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(gasto.dataDocumento)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gasto.tipoDespesa}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{gasto.nomeFornecedor}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(gasto.valorLiquido)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500">Nenhuma despesa registrada para este parlamentar.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-2xl font-bold text-center mb-6">Atividade Legislativa</h2>
          {proposicoes.length > 0 ? (
            <>
              <div className="max-w-2xl mx-auto mb-10">
                <Bar data={getProposicoesChartData()} options={{ plugins: { title: { display: true, text: 'Proposições Apresentadas por Ano' } } }} />
              </div>
              <h3 className="text-xl font-bold mb-4">Principais Proposições:</h3>
              <ul className="list-disc pl-5 space-y-3 text-gray-700">
                {proposicoes.slice(0, 5).map(p => (
                  <li key={p.id}>
                    <span className="font-semibold">{p.siglaTipo} {p.numero}/{p.ano}</span> - {p.ementa}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-center text-gray-500">Nenhuma proposição registrada para este parlamentar.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default PoliticianProfilePage;