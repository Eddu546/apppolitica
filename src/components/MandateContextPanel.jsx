import React from 'react';
import { CalendarClock, ExternalLink } from 'lucide-react';
import { buildMandateContext } from '@/lib/mandate-context';

const statusLabels = {
  complete: 'Ano com exercício integral confirmado',
  partial: 'Ano com possível exercício parcial',
  unknown: 'Período de exercício não confirmado',
};

const MandateContextPanel = ({ history = [], year }) => {
  const context = buildMandateContext({ history, year });
  const visibleEvents = context.events.filter((item) => item.date.startsWith(String(year))).slice(-4);

  return (
    <section className={`rounded-lg border p-4 ${context.isPartial ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" />
          <div>
            <p className="text-xs font-black uppercase text-gray-500">Contexto do mandato em {year}</p>
            <h2 className="mt-1 font-black text-gray-950">{statusLabels[context.status]}</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              {context.activeDays !== null
                ? `${context.activeDays} de ${context.totalDays} dias aparecem como exercício no histórico oficial.`
                : 'A fonte não permite calcular com segurança quantos dias o parlamentar esteve em exercício neste ano.'}
            </p>
          </div>
        </div>
        <a href={context.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:underline">
          Ver histórico oficial <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {visibleEvents.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {visibleEvents.map((event) => (
            <div key={`${event.date}-${event.situation}`} className="rounded-md border bg-white p-3 text-xs">
              <p className="font-black text-gray-950">{new Date(event.date).toLocaleDateString('pt-BR')}</p>
              <p className="mt-1 text-gray-600">{event.situation}</p>
            </div>
          ))}
        </div>
      )}

      {context.warnings.length > 0 && <p className="mt-3 text-xs leading-5 text-gray-600">{context.warnings.join(' ')}</p>}
    </section>
  );
};

export default MandateContextPanel;

