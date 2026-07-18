import React from 'react';
import { Gauge, Info } from 'lucide-react';
import { polishText } from '@/lib/display-text';

const statusStyles = {
  available: 'border-green-200 bg-green-50 text-green-900',
  partial: 'border-yellow-300 bg-yellow-50 text-yellow-950',
  unavailable: 'border-gray-200 bg-gray-50 text-gray-700',
};

const formatScore = (value) => Number(value).toLocaleString('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const MandateScoreCard = ({ score, compact = false }) => {
  const status = score?.status || 'unavailable';
  const value = score?.value;

  if (compact) {
    return (
      <div className={`rounded-lg border px-3 py-2 ${statusStyles[status]}`}>
        <p className="text-[10px] font-black uppercase">Nota do mandato</p>
        <div className="mt-0.5 flex items-baseline gap-1">
          <strong className="text-2xl font-black">{value === null || value === undefined ? 'Sem nota' : formatScore(value)}</strong>
          {value !== null && value !== undefined && <span className="text-xs font-bold">/ 10</span>}
        </div>
        <p className="text-[11px]">{score?.coverage || 0}% dos critérios disponíveis</p>
      </div>
    );
  }

  return (
    <section className={`rounded-xl border-2 p-5 ${statusStyles[status]}`} aria-labelledby="mandate-score-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
            <Gauge className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-black uppercase">Indicador calculado pelo FISCALIZA</p>
            <h2 id="mandate-score-title" className="mt-1 text-2xl font-black">Nota do mandato</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6">{polishText(score?.explanationForCitizen)}</p>
          </div>
        </div>
        <div className="min-w-[150px] rounded-lg border border-current/20 bg-white px-5 py-3 text-center">
          <p className="text-4xl font-black">{value === null || value === undefined ? '--' : formatScore(value)}</p>
          <p className="text-xs font-bold">de 10</p>
          <p className="mt-1 text-[11px]">Cobertura: {score?.coverage || 0}%</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(score?.components || []).map((component) => (
          <div key={component.id} className="rounded-lg border border-current/15 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black uppercase text-gray-600">{component.label}</p>
              <p className="text-lg font-black text-gray-950">
                {component.score === null ? '--' : formatScore(component.score)}
              </p>
            </div>
            <p className="mt-1 text-xs leading-5 text-gray-600">{polishText(component.explanation)}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-current/15 bg-white p-3 text-sm text-gray-700">
        <p className="flex items-center gap-2 font-bold text-gray-950"><Info className="h-4 w-4" /> Leitura rápida</p>
        {score?.positives?.length > 0 && <p className="mt-2">Melhores componentes: {score.positives.join(' e ')}.</p>}
        <p className="mt-1">{polishText(score?.attention)}</p>
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer font-bold">Entenda a fórmula e as limitações</summary>
          <p className="mt-2 leading-5">{polishText(score?.calculationMethod)}</p>
          {(score?.warnings || []).map((warning) => <p key={warning} className="mt-1">{polishText(warning)}</p>)}
          <p className="mt-1 font-semibold">Metodologia v{score?.version || '1.0'}.</p>
        </details>
      </div>
    </section>
  );
};

export default MandateScoreCard;
