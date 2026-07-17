import React from 'react';
import { AlertTriangle, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { polishText } from '@/lib/display-text';
import { formatCurrency } from '@/lib/legislative-logic';

const ExpenseComparisonPanel = ({ comparison, ano }) => {
  if (!comparison || comparison.status === 'unavailable') {
    return (
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <h3 className="font-bold text-gray-900">Comparativos indisponíveis</h3>
              <p className="mt-1 text-sm text-gray-600">
                A base anual de resumos ainda não foi sincronizada em quantidade suficiente para comparar este parlamentar com segurança.
              </p>
              {comparison?.reason && <p className="mt-2 text-xs text-gray-500">{polishText(comparison.reason)}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPartial = comparison.status === 'partial';

  return (
    <Card className="border-blue-100 bg-blue-50">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-700 mt-0.5" />
          <div>
            <h3 className="font-bold text-blue-950">Comparativo de gastos ({ano})</h3>
            <p className="text-sm text-blue-800">
              Comparação calculada pelo FISCALIZA com base em resumos anuais sincronizados a partir da API oficial da Câmara.
            </p>
          </div>
        </div>

        {isPartial && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            Base parcial: alguns comparativos podem ficar indisponíveis até a sincronização completa do ano.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg bg-white p-4 border border-blue-100">
            <p className="text-xs font-bold uppercase text-gray-500">Média nacional</p>
            <p className="text-xl font-black text-gray-900">
              {comparison.nationalAverage ? formatCurrency(comparison.nationalAverage) : 'Indisponível'}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 border border-blue-100">
            <p className="text-xs font-bold uppercase text-gray-500">Média do estado</p>
            <p className="text-xl font-black text-gray-900">
              {comparison.stateAverage ? formatCurrency(comparison.stateAverage) : 'Indisponível'}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 border border-blue-100">
            <p className="text-xs font-bold uppercase text-gray-500">Ranking nacional</p>
            <p className="text-xl font-black text-gray-900">
              {comparison.nationalRank ? `${comparison.nationalRank} de ${comparison.nationalCount}` : 'Indisponível'}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 border border-blue-100">
            <p className="text-xs font-bold uppercase text-gray-500">Ranking estadual</p>
            <p className="text-xl font-black text-gray-900">
              {comparison.stateRank ? `${comparison.stateRank} de ${comparison.stateCount}` : 'Indisponível'}
            </p>
          </div>
        </div>

        <details className="mt-4 text-xs text-blue-900">
          <summary className="cursor-pointer font-bold">Entenda este comparativo</summary>
          <p className="mt-2 leading-relaxed">{polishText(comparison.calculationMethod || comparison.reason)}</p>
          {comparison.warnings?.map((warning) => (
            <p key={warning} className="mt-1">{polishText(warning)}</p>
          ))}
        </details>
      </CardContent>
    </Card>
  );
};

export default ExpenseComparisonPanel;
