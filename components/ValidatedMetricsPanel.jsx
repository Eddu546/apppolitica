import React from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { polishText } from '@/lib/display-text';

const ValidatedMetricsPanel = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <CheckCircle2 className="w-5 h-5 text-green-700 mt-0.5" />
          <div>
            <h2 className="font-bold text-green-950">Dados validados pelo FISCALIZA</h2>
            <p className="text-sm text-green-800">
              Revisões manuais publicadas com fonte. Elas complementam os dados oficiais, sem substituir a API.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-green-200 bg-white p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase text-green-700">{polishText(item.metrica)} / {item.ano}</p>
                  <p className="text-lg font-extrabold text-gray-900">{polishText(item.valor)}</p>
                  {item.observacao_publica && (
                    <p className="mt-1 text-sm text-gray-600">{polishText(item.observacao_publica)}</p>
                  )}
                </div>
                <a
                  className="inline-flex items-center text-sm font-semibold text-blue-600 hover:underline"
                  href={item.fonte_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Fonte <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidatedMetricsPanel;
