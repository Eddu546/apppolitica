import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const DeputadosPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [deputados, setDeputados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeputados() {
      try {
        const response = await fetch('https://dadosabertos.camara.leg.br/api/v2/deputados?itens=100');
        const data = await response.json();
        setDeputados(data.dados);
      } catch (error) {
        toast({
          title: 'Erro ao buscar deputados',
          description: 'Não foi possível carregar os dados da API.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDeputados();
  }, []);

  const deputadosFiltrados = deputados.filter((dep) => {
    const nomeMatch = dep.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const partidoMatch = selectedParty ? dep.siglaPartido === selectedParty : true;
    const estadoMatch = selectedState ? dep.siglaUf === selectedState : true;
    return nomeMatch && partidoMatch && estadoMatch;
  });

  return (
    <>
      <Helmet>
        <title>Deputados - APPolítica</title>
      </Helmet>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Users /> Deputados Federais
        </h1>

        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded px-3 py-1 w-full md:w-1/3"
          />
          <select
            value={selectedParty}
            onChange={(e) => setSelectedParty(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="">Todos os Partidos</option>
            {[...new Set(deputados.map((d) => d.siglaPartido))].sort().map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="">Todos os Estados</option>
            {[...new Set(deputados.map((d) => d.siglaUf))].sort().map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Carregando deputados...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deputadosFiltrados.map((dep) => (
              <motion.div
                key={dep.id}
                className="border rounded-lg p-4 shadow bg-white cursor-pointer hover:bg-gray-100"
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate(`/politico/${dep.id}`)}

              >
                <div className="flex items-center gap-4">
                  <img src={dep.urlFoto} alt={dep.nome} className="w-16 h-16 rounded-full" />
                  <div>
                    <h2 className="text-lg font-semibold">{dep.nome}</h2>
                    <p>{dep.siglaPartido} - {dep.siglaUf}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default DeputadosPage;
