import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

const PoliticianProfilePage = () => {
  const { id } = useParams();
  const [politico, setPolitico] = useState(null);
  const [despesas, setDespesas] = useState([]);
  const [proposicoes, setProposicoes] = useState([]);

  useEffect(() => {
    // Dados do deputado
    fetch(`http://localhost:8000/api/deputados/${id}`)
      .then((res) => res.json())
      .then(setPolitico)
      .catch((err) => console.error("Erro ao buscar político:", err));

    // Despesas
    fetch(`http://localhost:8000/api/deputados/${id}/despesas`)
      .then((res) => res.json())
      .then(setDespesas)
      .catch((err) => console.error("Erro ao buscar despesas:", err));

    // Proposições
    fetch(`http://localhost:8000/api/deputados/${id}/proposicoes`)
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          console.error("Erro ao buscar proposições:", errorData);
          return [];
        }
        return res.json();
      })
      .then(setProposicoes)
      .catch((err) => {
        console.error("Erro ao buscar proposições:", err);
        setProposicoes([]);
      });
  }, [id]);

  if (!politico) return <div className="p-4">Carregando político...</div>;

  // Agrupa despesas por tipo para o gráfico
  const despesasPorTipo = despesas.reduce((acc, d) => {
    acc[d.tipoDespesa] = (acc[d.tipoDespesa] || 0) + d.valorDocumento;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(despesasPorTipo),
    datasets: [
      {
        label: "Gastos (R$)",
        data: Object.values(despesasPorTipo),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#81C784",
          "#BA68C8",
          "#FF7043",
        ],
      },
    ],
  };

  const barData = {
    labels: proposicoes.map((p) => p.siglaTipo + " " + p.numero),
    datasets: [
      {
        label: "Ano das proposições",
        data: proposicoes.map((p) => parseInt(p.ano)),
        backgroundColor: "#42A5F5",
      },
    ],
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Dados básicos com foto */}
      <div className="flex items-center gap-6 mb-6">
        <img
          src={politico.urlFoto}
          alt={politico.nome}
          className="w-24 h-24 rounded-full border border-gray-300"
        />
        <div>
          <h1 className="text-3xl font-bold">{politico.nome}</h1>
          <p className="text-gray-700">Partido: {politico.siglaPartido}</p>
          <p className="text-gray-700">UF: {politico.siglaUf}</p>
          {politico.email && (
            <p className="text-gray-700 underline decoration-dotted">
              Email: {politico.email}
            </p>
          )}
        </div>
      </div>

      {/* Gráfico de despesas */}
      {despesas.length > 0 ? (
        <div className="max-w-md max-h-96 mx-auto mb-12">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Gastos por Tipo
          </h2>
          <Doughnut data={chartData} />
        </div>
      ) : (
        <p className="text-gray-500 mt-4 text-center">Nenhuma despesa encontrada.</p>
      )}

      {/* Lista de proposições */}
      {proposicoes.length > 0 ? (
        <>
          <h2 className="text-xl font-semibold mb-4">Proposições</h2>
          <ul className="list-disc pl-5 text-gray-800 max-w-3xl mx-auto">
            {proposicoes.map((p) => (
              <li key={p.id} className="mb-2">
                <span className="font-semibold">{p.siglaTipo} {p.numero}/{p.ano}</span> — {p.ementa}
              </li>
            ))}
          </ul>

          {/* Gráfico barras proposições por ano */}
          <div className="max-w-3xl max-h-96 mx-auto mt-10">
            <h2 className="text-xl font-semibold mb-4 text-center">Proposições por Ano</h2>
            <Bar data={barData} />
          </div>
        </>
      ) : (
        <p className="text-gray-500 mt-8 text-center">Nenhuma proposição encontrada.</p>
      )}
    </div>
  );
};

export default PoliticianProfilePage;
