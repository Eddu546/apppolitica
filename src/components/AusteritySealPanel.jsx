import React from 'react';
import { AlertTriangle, Award, CheckCircle2, ExternalLink, HelpCircle, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { polishText } from '@/lib/display-text';
import { formatCurrency } from '@/lib/legislative-logic';

const sealStyles = {
  approved: {
    Icon: Award,
    card: 'border-green-200 bg-green-50',
    icon: 'bg-green-600 text-white',
    title: 'text-green-950',
    text: 'text-green-800',
    pill: 'border-green-200 bg-white text-green-700',
    label: 'Aprovado',
  },
  not_approved: {
    Icon: ShieldCheck,
    card: 'border-yellow-200 bg-yellow-50',
    icon: 'bg-yellow-500 text-white',
    title: 'text-yellow-950',
    text: 'text-yellow-800',
    pill: 'border-yellow-200 bg-white text-yellow-700',
    label: 'Não concedido',
  },
  review: {
    Icon: HelpCircle,
    card: 'border-slate-200 bg-slate-50',
    icon: 'bg-slate-600 text-white',
    title: 'text-slate-950',
    text: 'text-slate-700',
    pill: 'border-slate-200 bg-white text-slate-700',
    label: 'Em análise',
  },
};

const formatDate = (date) => {
  if (!date) return 'Não informado';
  return new Date(date).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const getCheckState = (check) => {
  if (check.status !== 'available') {
    return {
      Icon: HelpCircle,
      label: 'Em análise',
      className: 'border-slate-200 bg-slate-50 text-slate-700',
    };
  }

  if (check.passed) {
    return {
      Icon: CheckCircle2,
      label: 'Não encontrado',
      className: 'border-green-200 bg-green-50 text-green-700',
    };
  }

  return {
    Icon: AlertTriangle,
    label: 'Encontrado',
    className: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  };
};

const isSafeSourceUrl = (sourceUrl) => sourceUrl && !String(sourceUrl).includes('{');

const AusteritySealPanel = ({ seal }) => {
  if (!seal) return null;

  const style = sealStyles[seal.status] || sealStyles.review;
  const SealIcon = style.Icon;

  return (
    <Card className={`${style.card} shadow-sm`}>
      <CardContent className="p-5">
        <div className="flex flex-col xl:flex-row xl:items-start gap-5">
          <div className="flex items-start gap-4 flex-1">
            <div className={`h-12 w-12 rounded-full ${style.icon} flex items-center justify-center shrink-0`}>
              <SealIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className={`text-lg font-black ${style.title}`}>{polishText(seal.title)}</h2>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${style.pill}`}>
                  {style.label}
                </span>
              </div>
              <p className={`text-sm leading-relaxed ${style.text}`}>{polishText(seal.description)}</p>
              <p className="mt-2 text-xs text-slate-600">
                O selo é calculado pelo FISCALIZA a partir de fontes oficiais. Ele não é uma declaração da Câmara e não avalia outras despesas do mandato.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xl:w-[620px]">
            {seal.checks.map((check) => {
              const checkState = getCheckState(check);
              const CheckIcon = checkState.Icon;

              return (
                <div key={check.id} className="rounded-lg border border-white/70 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{polishText(check.label)}</p>
                      <p className="mt-1 text-sm text-slate-600">{polishText(check.detail)}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${checkState.className}`}>
                      <CheckIcon className="h-3 w-3" />
                      {checkState.label}
                    </span>
                  </div>

                  {check.amount > 0 && (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase text-slate-500">Valor encontrado</p>
                      <p className="text-lg font-black text-slate-900">{formatCurrency(check.amount)}</p>
                    </div>
                  )}

                  {check.warnings?.length > 0 && (
                    <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                      {check.warnings.map((warning) => (
                        <p key={warning}>{polishText(warning)}</p>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500 space-y-1">
                    <p><strong>Fonte:</strong> {polishText(check.sourceName || 'Fonte não informada')}</p>
                    <p><strong>Consultado em:</strong> {formatDate(check.fetchedAt)}</p>
                    <details>
                      <summary className="cursor-pointer font-bold text-slate-600">Como foi verificado</summary>
                      <p className="mt-1 leading-relaxed">{polishText(check.calculationMethod || 'Método não informado.')}</p>
                    </details>
                    {isSafeSourceUrl(check.sourceUrl) && (
                      <a
                        href={check.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                      >
                        Ver fonte <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AusteritySealPanel;
