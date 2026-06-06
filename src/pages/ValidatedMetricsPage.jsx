import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { polishText } from '@/lib/display-text';
import { fetchValidatedMetrics, isCorrectionsDatabaseConfigured } from '@/services/corrections';

const ValidatedMetricsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage('');
      try {
        const result = await fetchValidatedMetrics();
        if (result.ok) {
          setItems(result.data);
        } else {
          setMessage('O banco de dados ainda não está configurado neste ambiente.');
        }
      } catch (error) {
        console.error('Erro ao carregar métricas validadas:', error);
        setMessage('Não foi possível carregar os dados validados agora.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet><title>Dados validados - FISCALIZA</title></Helmet>

      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-10 h-10 text-green-600 mt-1" />
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Dados validados</h1>
              <p className="mt-2 text-gray-600 max-w-3xl">
                Correções revisadas manualmente pelo FISCALIZA. Estes registros mostram a fonte usada e não alteram automaticamente os dados oficiais da Câmara ou do Senado.
              </p>
            </div>
          </div>
          {!isCorrectionsDatabaseConfigured && (
            <div className="mt-5 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              Supabase ainda não configurado neste ambiente.
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            {message}
          </div>
        )}

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                      Validado
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                      {item.cargo}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                      {item.ano}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{item.parlamentar}</h2>
                  <p className="mt-3 text-xs font-bold uppercase text-gray-500">{polishText(item.metrica)}</p>
                  <p className="text-2xl font-extrabold text-gray-900">{polishText(item.valor)}</p>
                  {item.observacao_publica && (
                    <p className="mt-3 text-sm text-gray-600">{polishText(item.observacao_publica)}</p>
                  )}
                  <a
                    className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:underline break-all"
                    href={item.fonte_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver fonte <ExternalLink className="w-4 h-4 ml-1 shrink-0" />
                  </a>
                </CardContent>
              </Card>
            ))}

            {items.length === 0 && !message && (
              <div className="md:col-span-2 rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
                Ainda não há métricas validadas publicadas.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidatedMetricsPage;
