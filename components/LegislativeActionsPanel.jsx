import React, { useMemo } from 'react';
import { ExternalLink, Gavel, Info, Loader2 } from 'lucide-react';
import { buildLegislativeActionsSummary } from '@/lib/legislative-actions';
import { describeVotingForCitizen } from '@/lib/vote-highlights';
import { polishText } from '@/lib/display-text';

const highlightedTypes = new Set(['contributed_to_rejection', 'supported_approval', 'procedural', 'obstruction', 'text_change', 'close_vote']);

const LegislativeActionsPanel = ({ votings = [], loading = false }) => {
  const summary = useMemo(() => buildLegislativeActionsSummary(votings), [votings]);
  const highlights = summary.actions.filter((action) => highlightedTypes.has(action.type)).slice(0, 6);
  const barrierSignals = (summary.counts.contributed_to_rejection || 0)
    + (summary.counts.procedural || 0)
    + (summary.counts.obstruction || 0);

  return (
    <section className="rounded-lg border border-yellow-200 bg-white p-5 shadow-sm" aria-labelledby="legislative-actions-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-yellow-700">Leitura simples das votações</p>
          <h2 id="legislative-actions-title" className="mt-1 text-xl font-black text-gray-950">Atuações que contribuíram para aprovar, alterar ou barrar pautas</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">O verbo “contribuiu” é intencional: uma decisão coletiva não é atribuída a uma única pessoa.</p>
        </div>
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-900">Recorte auditável</span>
      </div>

      {!loading && summary.total > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            ['Contribuições para barrar ou adiar', barrierSignals],
            ['A favor de matéria aprovada', summary.counts.supported_approval || 0],
            ['Retirada ou adiamento', summary.counts.procedural || 0],
            ['Alterações de texto', summary.counts.text_change || 0],
            ['Obstruções registradas', summary.counts.obstruction || 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-2xl font-black text-gray-950">{value}</p>
              <p className="text-xs font-semibold leading-5 text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="mt-5 flex items-center gap-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-600"><Loader2 className="h-4 w-4 animate-spin" /> Analisando votos retornados pela fonte oficial...</div>
      ) : highlights.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {highlights.map((action, index) => {
            const description = describeVotingForCitizen(action.voting);
            return (
              <article key={`${action.voting.id || index}-${action.type}`} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-black text-yellow-300"><Gavel className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-yellow-800">{action.label}</p>
                    <h3 className="mt-1 font-black text-gray-950">{polishText(description.title)}</h3>
                    <p className="mt-2 text-xs leading-5 text-gray-600">{action.explanation}</p>
                    {action.sourceUrl && <a href={action.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">Ver registro oficial <ExternalLink className="h-3 w-3" /></a>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
          <p>Nenhuma atuação desse tipo foi confirmada no recorte carregado. Isso não significa que ela não exista no ano.</p>
        </div>
      )}

      <details className="mt-4 text-xs leading-5 text-gray-600">
        <summary className="cursor-pointer font-bold text-gray-800">Como esta leitura é calculada</summary>
        <p className="mt-2">{summary.calculationMethod}</p>
        {summary.warnings.map((warning) => <p key={warning}>• {warning}</p>)}
      </details>
    </section>
  );
};

export default LegislativeActionsPanel;
