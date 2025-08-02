import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const SearchResultsPage = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('q');

  const mockResults = [
    { id: 1, name: 'Kim Kataguiri', party: 'UNIÃO/SP', photo: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=150&h=150&fit=crop&crop=face' },
    { id: 5, name: 'Marcel van Hattem', party: 'NOVO/RS', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
  ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

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
            {mockResults.length > 0 ? (
              <div className="space-y-4">
                {mockResults.map((politician, index) => (
                  <motion.div
                    key={politician.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0">
                      <img  class="w-20 h-20 rounded-full object-cover border-2 border-gray-200" alt={`Foto de ${politician.name}`} src="https://images.unsplash.com/photo-1580128660010-fd027e1e587a" />
                      <div className="flex-grow text-center sm:text-left">
                        <h2 className="text-xl font-bold">{politician.name}</h2>
                        <p className="text-gray-600">{politician.party}</p>
                      </div>
                      <Link to={`/politico/${politician.id}`} className="w-full sm:w-auto">
                        <Button className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-bold">
                          Ver Perfil
                        </Button>
                      </Link>
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