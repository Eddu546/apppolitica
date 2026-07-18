import React, { useMemo } from 'react';
import { CheckCircle2, Clock3, HelpCircle, Scale } from 'lucide-react';
import { buildAgendaImpactEvidence } from '@/lib/agenda-impact';
import { polishText } from '@/lib/display-text';

const AgendaImpactPanel = ({ proposal, authors = [], votings = [], procedures = [], themes = [], related = [] }) => {
  const impact = useMemo(
    () => buildAgendaImpactEvidence({ proposal, authors, votings, procedures, themes, related }),
    [authors, procedures, proposal, related, themes, votings]
  );

  return (
    <section className="rounded-lg border border-yellow-200 bg-white p-5 shadow-sm" aria-labelledby="agenda-impact-title">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-black text-yellow-300"><Scale className="h-5 w-5" /></span>
        <div>
          <p className="text-xs font-black uppercase text-yellow-700">Impacto verificável</p>
          <h2 id="agenda-impact-title" className="mt-1 text-xl font-black text-gray-950">O que esta pauta realmente produziu até agora?</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">Primeiro mostramos a trajetória comprovada. Efeito na vida das pessoas só aparece quando houver outra base pública compatível.</p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-xs font-bold uppercase text-yellow-800">Etapa confirmável</p>
        <p className="mt-1 text-lg font-black text-gray-950">{impact.stage}</p>
        {impact.officialStatus && <p className="mt-1 text-sm text-gray-700">Situação oficial: {polishText(impact.officialStatus)}</p>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {impact.evidence.map((item) => (
          <div key={item.label} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center gap-1 text-xs font-bold text-gray-500">{item.confirmed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-700" /> : <HelpCircle className="h-3.5 w-3.5" />}{item.label}</div>
            <p className="mt-2 font-black text-gray-950">{item.value}</p>
          </div>
        ))}
      </div>

      {impact.themes?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {impact.themes.map((theme) => (
            <span key={theme} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{polishText(theme)}</span>
          ))}
        </div>
      )}

      {impact.timeline?.length > 0 && (
        <div className="mt-5">
          <h3 className="flex items-center gap-2 font-black text-gray-950"><Clock3 className="h-4 w-4 text-yellow-700" /> Últimas movimentações oficiais</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {impact.timeline.map((item, index) => (
              <div key={`${item.date}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-black uppercase text-gray-500">
                  {item.date ? new Date(item.date).toLocaleDateString('pt-BR') : 'Data não informada'}
                  {item.organ ? ` · ${item.organ}` : ''}
                </p>
                <p className="mt-1 text-sm leading-5 text-gray-700">{polishText(item.description)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-5 text-gray-600">
        {impact.warnings.map((warning) => <p key={warning}>• {warning}</p>)}
      </div>
    </section>
  );
};

export default AgendaImpactPanel;
