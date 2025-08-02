import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Search, Users, Building2 } from 'lucide-react';

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get('q');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se não houver uma busca (query), não faz nada.
    if (!query) {
      setLoading(false);
      return;
    }

    async function fetchResults() {
      setLoading(true);
      try {
        // Chama a nossa nova API de busca no backend
        const response = await fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
          throw new Error('Erro na resposta da busca');
        }
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Erro ao buscar resultados:", error);
        setResults([]); // Em caso de erro, garante que os resultados fiquem vazios
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [query]); // Roda a busca toda vez que o termo 'q' na URL mudar

  // Função para navegar para a página correta do político
  const handleResultClick = (politico) => {
    // O perfil de senador ainda não foi criado, então por enquanto vai para o de deputado
    // Futuramente, podemos adicionar uma lógica aqui
    navigate(`/politico/${politico.id}`);
  };

  return (
    <>
      <Helmet>
        <title>Resultados da Busca por "{query}" - Fiscaliza, MBL!</title>
        <meta name="description" content={`Resultados da busca por políticos com o nome ${query}.`} />
      </Helmet>

      <div className="bg-gray-50 text-gray-900 min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Resultados da Busca</h1>
            <p className="text-lg text-gray-600">
              Exibindo resultados para: <span className="text-yellow-500 font-bold">"{query}"</span>
            </p>
          </motion.div>

          <div className="mt-8">
            {loading ? (
              <p className="text-center text-gray-600">Buscando...</p>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                {results.map((politician, index) => (
                  <motion.div
                    key={`${politician.id}-${politician.tipo}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div 
                      className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0 cursor-pointer hover:border-yellow-400 hover:bg-yellow-50 transition-all"
                      onClick={() => handleResultClick(politician)}
                    >
                      <img className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" alt={`Foto de ${politician.nome}`} src={politician.foto} />
                      <div className="flex-grow text-center sm:text-left">
                        <h2 className="text-xl font-bold">{politician.nome}</h2>
                        <div className="flex items-center justify-center sm:justify-start text-gray-600 mt-1">
                          {politician.tipo === 'Deputado' ? <Users className="w-4 h-4 mr-2" /> : <Building2 className="w-4 h-4 mr-2" />}
                          <span>{politician.tipo} • {politician.partido}-{politician.uf}</span>
                        </div>
                      </div>
                      <Button className="w-full sm:w-auto bg-yellow-400 text-black hover:bg-yellow-500 font-bold" asChild>
                        <Link to={`/politico/${politician.id}`}>Ver Perfil</Link>
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 bg-white rounded-lg border border-gray-200"
              >
                <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Nenhum político encontrado</h2>
                <p className="text-gray-500">Tente refinar sua busca ou verifique o nome digitado.</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchResultsPage;