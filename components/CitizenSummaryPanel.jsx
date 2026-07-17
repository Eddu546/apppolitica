import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Scale,
  WalletCards,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { polishText } from '@/lib/display-text';
import { formatCurrency, formatNumber } from '@/lib/legislative-logic';

const statusLabels = {
  available: 'Disponível',
  partial: 'Limitado',
  unavailable: 'Indisponível',
  error: 'Erro',
};

const statusStyles = {
  available: 'border-green-200 bg-green-50 text-green-700',
  partial: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  unavailable: 'border-gray-200 bg-gray-50 text-gray-600',
  error: 'border-red-200 bg-red-50 text-red-700',
};

const formatDate = (date) => {
  if (!date) return 'Não informado';
  return new Date(date).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const getMetricStatus = (metric) => metric?.status || 'unavailable';

const formatMetricValue = (metric) => {
  if (!metric || metric.value === null || metric.value === undefined || metric.status === 'unavailable') {
    return 'Dado indisponível';
  }

  if (metric.unit === 'BRL') return formatCurrency(metric.value);
  if (typeof metric.value === 'number') return formatNumber(metric.value);
  return String(metric.value);
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-black ${statusStyles[status] || statusStyles.unavailable}`}>
    {statusLabels[status] || statusLabels.unavailable}
  </span>
);

const SummaryItem = ({ icon: Icon, title, value, description, status = 'available', details = [] }) => (
  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-800">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-gray-500">{title}</p>
          <p className="mt-1 text-xl font-black leading-tight text-gray-950">{value}</p>
        </div>
      </div>
      <StatusBadge status={status} />
    </div>
    <p className="mt-3 text-sm leading-relaxed text-gray-600">{description}</p>
    {details.length > 0 && (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {details.map((item) => (
          <div key={item.label} className="rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-100">
            <p className="text-[10px] font-black uppercase text-gray-500">{polishText(item.label)}</p>
            <p className="mt-1 text-sm font-black text-gray-950">{polishText(String(item.value))}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

const CitizenSummaryPanel = ({ metrics, ano }) => {
  if (!metrics) return null;

  const sourceName = metrics.totalGastoAno?.sourceName || metrics.proposicoes?.sourceName || 'Fonte não informada';
  const fetchedAt = metrics.totalGastoAno?.fetchedAt || metrics.proposicoes?.fetchedAt;
  const sourcePageUrl = metrics.totalGastoAno?.sourcePageUrl;
  const proposalsComeFromPortal = String(metrics.proposicoes?.sourceName || '').toLowerCase().includes('portal');

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="p-5 lg:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-300 bg-white px-3 py-1 text-xs font-black uppercase text-yellow-900">
              <Scale className="h-4 w-4" />
              Resumo cidadão
            </div>
            <h2 className="text-2xl font-black text-gray-950">Leitura rápida do ano {ano}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700">
              Um resumo curto com os números principais do ano. Faltas, presenças e relatorias são exibidas apenas quando
              aparecem em fonte oficial verificável.
            </p>
          </div>

          {sourcePageUrl && (
            <Button asChild className="bg-yellow-400 text-black hover:bg-yellow-300">
              <Link to={sourcePageUrl}>
                Ver fonte dos gastos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SummaryItem
            icon={WalletCards}
            title="Gastos declarados"
            value={formatMetricValue(metrics.totalGastoAno)}
            status={getMetricStatus(metrics.totalGastoAno)}
            description={
              metrics.totalGastoAno?.status === 'available'
                ? `Total de despesas CEAP retornadas pela fonte oficial para ${ano}.`
                : 'A fonte oficial não retornou despesas suficientes para exibir total com segurança.'
            }
          />

          <SummaryItem
            icon={FileText}
            title="Propostas protocoladas"
            value={formatMetricValue(metrics.proposicoes)}
            status={getMetricStatus(metrics.proposicoes)}
            description={
              proposalsComeFromPortal
                ? 'Número exibido no portal público da Câmara para propostas legislativas de autoria. Não significa aprovação.'
                : 'Quantidade de proposições retornadas pela API como autoria ou assinatura. Não significa aprovação.'
            }
          />

          <SummaryItem
            icon={FileText}
            title="Relatorias encontradas"
            value={formatMetricValue(metrics.relatorias)}
            status={getMetricStatus(metrics.relatorias)}
            description={
              metrics.relatorias?.status === 'available'
                ? 'Número de propostas relatadas exibido no portal público da Câmara. Este número não confirma aprovação.'
                : 'A fonte atual não confirmou relatorias aprovadas com segurança para este ano.'
            }
          />

          <SummaryItem
            icon={CheckCircle2}
            title="Presença em Plenário"
            value={formatMetricValue(metrics.presencaPlenario)}
            status={getMetricStatus(metrics.presencaPlenario)}
            description="Dias em que a Câmara registra presença, falta justificada ou falta não justificada."
            details={metrics.presencaPlenario?.details || []}
          />

          <SummaryItem
            icon={CheckCircle2}
            title="Presença em Comissões"
            value={formatMetricValue(metrics.presencaComissoes)}
            status={getMetricStatus(metrics.presencaComissoes)}
            description="Reuniões em que a Câmara registra presença, falta justificada ou falta não justificada."
            details={metrics.presencaComissoes?.details || []}
          />

          <SummaryItem
            icon={FileText}
            title="Discursos"
            value={formatMetricValue(metrics.discursos)}
            status={getMetricStatus(metrics.discursos)}
            description={
              metrics.discursos?.status === 'available'
                ? 'Discursos em Plenário informados pelo portal público da Câmara ou pela API oficial.'
                : 'A fonte oficial não retornou discursos para este ano.'
            }
          />
        </div>

        <div className="mt-5 rounded-xl border border-yellow-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
            <p className="text-sm leading-relaxed text-gray-600">
              Fonte principal: <strong>{polishText(sourceName)}</strong>. Consulta registrada em{' '}
              <strong>{formatDate(fetchedAt)}</strong>.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CitizenSummaryPanel;
