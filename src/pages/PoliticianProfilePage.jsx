import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from 'react-helmet';
import { Doughnut, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, Title } from "chart.js";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

// Registra todos os componentes do Chart.js que vamos usar
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, Title);

// Funções de formatação
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        return 'Data inválida';
    }
};

const PoliticianProfilePage = () => {
  const { tipo, id } = useParams();
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
        const apiEndpoint = tipo === 'deputado' ? 'deputados' : 'senadores';
        const baseUrl = `http://localhost:8000/api/${apiEndpoint}`;

        const [politicoRes, despesasRes, proposicoesRes] = await Promise.all([
          fetch(`${baseUrl}/${id}`),
          fetch(`${baseUrl}/${id}/despesas`),
          fetch(`${baseUrl}/${id}/proposicoes`),
        ]);

        if (!politicoRes.ok) throw new Error(`Falha ao buscar dados do ${tipo}`);
        
        const politicoData = await politicoRes.json();
        const despesasData = despesasRes.ok ? await despesasRes.json() : [];
        const proposicoesData = proposicoesRes.ok ? await proposicoesRes.json() : [];

        setPolitico(politicoData);
        setDespesas(despesasData);
        setProposicoes(proposicoesData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, tipo]);

  // Funções "inteligentes" para obter os dados corretos
  const getNome = () => politico?.ultimoStatus?.nome || politico?.IdentificacaoParlamentar?.NomeParlamentar;
  const getFoto = () => politico?.ultimoStatus?.urlFoto || politico?.IdentificacaoParlamentar?.UrlFotoParlamentar;
  const getPartidoUF = () => `${politico?.ultimoStatus?.siglaPartido || politico?.IdentificacaoParlamentar?.SiglaPartidoParlamentar} - ${politico?.ultimoStatus?.siglaUf || politico?.IdentificacaoParlamentar?.UfParlamentar}`;
  const getEmail = () => politico?.ultimoStatus?.email || politico?.IdentificacaoParlamentar?.EmailParlamentar;

  // --- Funções para os gráficos (agora usadas apenas para deputados) ---
  const getDeputadoDespesasChartData = () => {
    const despesasAgrupadas = despesas.reduce((acc, d) => {
      const tipo = d.tipoDespesa;
      const valor = parseFloat(d.valorLiquido);
      if (!acc[tipo]) acc[tipo] = 0;
      acc[tipo] += valor;
      return acc;
    }, {});
    const sortedDespesas = Object.entries(despesasAgrupadas).sort(([,a],[,b]) => b-a).slice(0, 7);
    return {
      labels: sortedDespesas.map(([tipo]) => tipo),
      datasets: [{
        label: 'Gastos por Tipo (R$)',
        data: sortedDespesas.map(([, valor]) => valor.toFixed(2)),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'],
      }],
    };
  };

  const getDeputadoProposicoesChartData = () => {
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

  if (loading) return <div className="p-6 text-center text-lg font-semibold">A carregar perfil...</div>;
  if (error) return <div className="p-6 text-center text-red-600">Erro: {error}</div>;
  if (!politico) return <div className="p-6 text-center">Político não encontrado.</div>;

  // --- Renderização Separada para cada Tipo de Político ---

  if (tipo === 'deputado') {
    return (
      <>
        <Helmet><title>{`Perfil: ${getNome()} - Fiscaliza, MBL!`}</title></Helmet>
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 p-6 bg-white rounded-lg shadow-md border">
            <img src={getFoto()} alt={`Foto de ${getNome()}`} className="w-32 h-32 rounded-full border-4 border-yellow-400 object-cover" />
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{getNome()}</h1>
              <p className="text-xl text-gray-600">{getPartidoUF()}</p>
              <p className="text-sm text-gray-500 mt-2">Email: <a href={`mailto:${getEmail()}`} className="text-yellow-600 hover:underline">{getEmail()}</a></p>
            </div>
          </div>

          <div className="mb-12 bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-2xl font-bold text-center mb-6">Despesas da Cota Parlamentar</h2>
            {despesas.length > 0 ? (
              <>
                <div className="max-w-md mx-auto mb-10">
                  <Doughnut data={getDeputadoDespesasChartData()} options={{ plugins: { title: { display: true, text: 'Top 7 Tipos de Gastos (R$)' } } }} />
                </div>
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
                      {despesas.slice(0, 10).map((gasto) => (
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
              <p className="text-center text-gray-500">Nenhuma despesa registada para este parlamentar.</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-2xl font-bold text-center mb-6">Atividade Legislativa</h2>
            {proposicoes.length > 0 ? (
              <>
                <div className="max-w-2xl mx-auto mb-10">
                  <Bar data={getDeputadoProposicoesChartData()} options={{ plugins: { title: { display: true, text: 'Proposições Apresentadas por Ano' } } }} />
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
              <p className="text-center text-gray-500">Nenhuma proposição registada para este parlamentar.</p>
            )}
          </div>
        </div>
      </>
    );
  }

  // Renderização para Senadores (voltamos ao botão externo, que é estável)
  return (
    <>
      <Helmet><title>{`Perfil: ${getNome()} - Fiscaliza, MBL!`}</title></Helmet>
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 p-6 bg-white rounded-lg shadow-md border">
          <img src={getFoto()} alt={`Foto de ${getNome()}`} className="w-32 h-32 rounded-full border-4 border-yellow-400 object-cover" />
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{getNome()}</h1>
            <p className="text-xl text-gray-600">{getPartidoUF()}</p>
            <p className="text-sm text-gray-500 mt-2">Email: <a href={`mailto:${getEmail()}`} className="text-yellow-600 hover:underline">{getEmail()}</a></p>
          </div>
        </div>

        <div className="mb-12 bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-2xl font-bold text-center mb-6">Despesas Parlamentares</h2>
          <div className="text-center">
              <p className="text-gray-600 mb-4">As despesas dos senadores são detalhadas no Portal da Transparência do Senado Federal.</p>
              <a href={despesas.urlExterna} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold">
                      Ver Despesas no Portal do Senado <ExternalLink className="ml-2 w-4 h-4" />
                  </Button>
              </a>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-2xl font-bold text-center mb-6">Atividade Legislativa</h2>
          {proposicoes && proposicoes.length > 0 ? (
            <ul className="list-disc pl-5 space-y-3 text-gray-700">
              {proposicoes.slice(0, 5).map((p, index) => (
                <li key={p.IdentificacaoMateria?.CodigoMateria || `prop-senador-${index}`}>
                  <span className="font-semibold">{p.IdentificacaoMateria?.SiglaCasaIdentificacaoMateria || ''} {p.IdentificacaoMateria?.NumeroMateria || ''}/{p.IdentificacaoMateria?.AnoMateria || ''}</span>
                  - {p.EmentaMateria || "Ementa não disponível."}
                </li>
              ))}
            </ul>
          ) : <p className="text-center text-gray-500">Nenhuma proposição registada para este parlamentar.</p>}
        </div>
      </div>
    </>
  );
};

export default PoliticianProfilePage;