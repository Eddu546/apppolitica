import React from 'react';
import { AlertTriangle, ExternalLink, SearchCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { polishText } from '@/lib/display-text';
import { formatCurrency } from '@/lib/legislative-logic';

const formatPercent = (value) =>
  `${((Number(value) || 0) * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

const formatDate = (date) => {
  if (!date) return 'Não informado';
  return new Date(date).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const SensitiveCeapPanel = ({ summary }) => {
  if (!summary) return null;

  const hasCategories = summary.categories?.length > 0;

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <SearchCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-950">Despesas sensíveis da CEAP</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Categorias que costumam merecer leitura mais cuidadosa. Este painel não indica irregularidade sozinho.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 min-w-[260px]">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase text-slate-500">Total sensível</p>
              <p className="text-lg font-black text-slate-950">{formatCurrency(summary.sensitiveTotal)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase text-slate-500">Do total anual</p>
              <p className="text-lg font-black text-slate-950">{formatPercent(summary.sensitiveShare)}</p>
            </div>
          </div>
        </div>

        {!hasCategories ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="font-bold text-green-950">Nenhuma categoria sensível encontrada</p>
            <p className="text-sm text-green-800">
              Nas despesas retornadas pela Câmara para este ano, não apareceu gasto nas categorias monitoradas por este painel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {summary.categories.map((category) => (
              <div key={category.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-950">{polishText(category.label)}</p>
                    <p className="mt-1 text-sm text-slate-600">{polishText(category.explanation)}</p>
                  </div>
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 whitespace-nowrap">
                    {category.count} registro{category.count === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white p-3">
                    <p className="text-xs font-bold uppercase text-slate-500">Valor</p>
                    <p className="text-lg font-black text-slate-950">{formatCurrency(category.amount)}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <p className="text-xs font-bold uppercase text-slate-500">Participação</p>
                    <p className="text-lg font-black text-slate-950">{formatPercent(category.shareOfTotal)}</p>
                  </div>
                </div>

                {category.examples?.length > 0 && (
                  <details className="mt-3 text-xs text-slate-500">
                    <summary className="cursor-pointer font-bold text-slate-700">Exemplos de registros</summary>
                    <div className="mt-2 space-y-1">
                      {category.examples.map((example) => (
                        <p key={`${category.id}-${example.supplier}-${example.value}-${example.date}`}>
                          {example.supplier}: {formatCurrency(example.value)}
                          {example.date ? ` em ${example.date.slice(0, 10)}` : ''}
                        </p>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {summary.warnings?.length > 0 && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                {summary.warnings.map((warning) => (
                  <p key={warning}>{polishText(warning)}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500 space-y-1">
          <p><strong>Fonte:</strong> {polishText(summary.sourceName)}</p>
          <p><strong>Consultado em:</strong> {formatDate(summary.fetchedAt)}</p>
          <details>
            <summary className="cursor-pointer font-bold text-slate-600">Como foi calculado</summary>
            <p className="mt-1 leading-relaxed">{polishText(summary.calculationMethod)}</p>
          </details>
          {summary.sourceUrl && (
            <a
              href={summary.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
            >
              Ver fonte <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SensitiveCeapPanel;
