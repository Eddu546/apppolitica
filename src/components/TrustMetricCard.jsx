import React from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, HelpCircle, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { polishText } from '@/lib/display-text';
import { formatCurrency, formatNumber } from '@/lib/legislative-logic';

const statusStyles = {
  available: {
    label: 'Disponível',
    className: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle2,
  },
  partial: {
    label: 'Limitado',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: AlertTriangle,
  },
  unavailable: {
    label: 'Indisponível',
    className: 'bg-gray-50 text-gray-600 border-gray-200',
    icon: HelpCircle,
  },
  error: {
    label: 'Erro',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: ShieldAlert,
  },
};

const confidenceLabels = {
  high: 'Confiança alta',
  medium: 'Confiança média',
  low: 'Confiança baixa',
  official: 'Fonte oficial',
  limited: 'Fonte limitada',
  unavailable: 'Indisponível',
};

const formatValue = (metric) => {
  if (metric.value === null || metric.value === undefined || metric.status === 'unavailable') {
    return 'Dado indisponível';
  }

  if (metric.unit === 'BRL') return formatCurrency(metric.value);
  if (typeof metric.value === 'number') return `${formatNumber(metric.value)}${metric.unit === 'pontos' ? ' pts' : ''}`;
  return String(metric.value);
};

const formatDate = (date) => {
  if (!date) return 'Não informado';
  return new Date(date).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const getSafeSourceUrl = (sourceUrl) => {
  if (!sourceUrl || String(sourceUrl).includes('{')) return '';
  return sourceUrl;
};

const TrustMetricCard = ({ metric }) => {
  const status = metric.status || (metric.confidence === 'unavailable' ? 'unavailable' : 'available');
  const style = statusStyles[status] || statusStyles.unavailable;
  const Icon = style.icon;
  const sourceName = polishText(metric.sourceName || metric.source || 'Fonte não informada');
  const explanation = polishText(metric.explanationForCitizen || metric.description || 'Método de cálculo não informado.');
  const method = polishText(metric.calculationMethod || metric.description || 'Método de cálculo não informado.');
  const confidence = metric.confidenceLevel || metric.confidence || 'low';
  const safeSourceUrl = getSafeSourceUrl(metric.sourceUrl);

  return (
    <Card className="shadow-sm border-gray-100 h-full">
      <CardContent className="p-5 h-full flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-gray-700">{polishText(metric.label || metric.title)}</p>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${style.className}`}>
            <Icon className="w-3 h-3" />
            {style.label}
          </span>
        </div>

        <p className="text-3xl font-black text-gray-900 leading-tight">{formatValue(metric)}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>

        {metric.warnings?.length > 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800 space-y-1">
            {metric.warnings.map((warning) => (
              <p key={warning}>{polishText(warning)}</p>
            ))}
          </div>
        )}

        <div className="mt-auto border-t border-gray-100 pt-3 text-[11px] text-gray-500 space-y-1">
          <p><strong>Fonte:</strong> {sourceName}</p>
          <p><strong>Atualizado em:</strong> {formatDate(metric.fetchedAt)}</p>
          <p><strong>Confiança:</strong> {confidenceLabels[confidence] || polishText(confidence)}</p>
          <details className="pt-1">
            <summary className="cursor-pointer font-semibold text-gray-600">Entenda este número</summary>
            <p className="mt-1 leading-relaxed">{method}</p>
          </details>
          {safeSourceUrl && (
            <a
              href={safeSourceUrl}
              target={safeSourceUrl.startsWith('/') ? undefined : '_blank'}
              rel={safeSourceUrl.startsWith('/') ? undefined : 'noopener noreferrer'}
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
            >
              Ver fonte <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrustMetricCard;
