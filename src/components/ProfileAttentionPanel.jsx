import React from 'react';
import { AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { polishText } from '@/lib/display-text';
import { formatCurrency } from '@/lib/legislative-logic';

const levelStyles = {
  high: 'border-red-200 bg-red-50 text-red-700',
  medium: 'border-yellow-200 bg-yellow-50 text-yellow-700',
};

const typeLabels = {
  supplier_concentration: 'Concentração em fornecedor',
  above_average_spending: 'Acima da média da base',
  sensitive_category_share: 'Categoria sensível',
};

const ProfileAttentionPanel = ({ points = [] }) => {
  if (!points.length) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-700 mt-0.5" />
            <div>
              <h3 className="font-bold text-green-950">Nenhum ponto de atenção encontrado</h3>
              <p className="text-sm text-green-800">
                Pelos critérios atuais do FISCALIZA, não houve alerta de concentração em fornecedor ou gasto acima da média sincronizada para este ano.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-700 mt-0.5" />
          <div>
            <h3 className="font-bold text-yellow-950">Pontos de atenção neste perfil</h3>
            <p className="text-sm text-yellow-800">
              Estes sinais orientam leitura da fonte oficial. Eles não indicam irregularidade sozinhos.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {points.map((point) => (
            <div key={point.id} className="rounded-lg border border-yellow-200 bg-white p-4">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${levelStyles[point.level] || levelStyles.medium}`}>
                      {point.level === 'high' ? 'Atenção alta' : 'Atenção média'}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                      {typeLabels[point.type] || point.title}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{polishText(point.explanation)}</p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-bold uppercase text-gray-500">Valor relacionado</p>
                      <p className="font-black text-gray-900">{formatCurrency(point.amount || 0)}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-bold uppercase text-gray-500">Total anual</p>
                      <p className="font-black text-gray-900">{formatCurrency(point.total || point.amount || 0)}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-bold uppercase text-gray-500">Referencia</p>
                      <p className="font-black text-gray-900">
                        {polishText(point.categoryLabel || point.supplier || (point.average ? `Média: ${formatCurrency(point.average)}` : 'Base sincronizada'))}
                      </p>
                      {point.recordCount !== undefined && (
                        <p className="mt-1 text-xs text-gray-500">
                          {point.recordCount === null ? 'Registros: não informado' : `${point.recordCount} registro${point.recordCount === 1 ? '' : 's'}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <details className="mt-3 text-xs text-gray-500">
                    <summary className="cursor-pointer font-bold text-gray-700">Como foi calculado</summary>
                    <p className="mt-1">{polishText(point.calculationMethod)}</p>
                  </details>
                </div>

                {point.sourceUrl && (
                  <a
                    href={point.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                  >
                    Fonte <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileAttentionPanel;
