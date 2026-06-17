import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Scale,
  ShieldAlert,
  Vote,
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

const SummaryItem = ({ icon: Icon, title, value, description, status = 'available' }) => (
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
  </div>
);

const getTopCategory = (metrics) => metrics?.totalGastoAno?.breakdown?.categorias?.[0] || null;

const buildLimitations = ({ metrics, expenseComparison, attentionPoints }) => {
  const limitations = [];

  if (metrics?.presenca?.status === 'unavailable') {
    limitations.push('O perfil não calcula faltas nem presença percentual sem denominador oficial seguro.');
  }

  if (metrics?.relatorias?.status === 'unavailable') {
    limitations.push('Relatorias e pareceres ficam indisponíveis enquanto a fonte atual não confirmar parlamentar, comissão, data e resultado.');
  }

  if (metrics?.votacoesNominais?.status !== 'available') {
    limitations.push('Votações aparecem como recorte relevante; ausência de registro não é tratada como falta.');
  }

  if (expenseComparison?.status === 'unavailable') {
    limitations.push('Comparação nacional depende do cache anual completo no Supabase.');
  }

  if (attentionPoints?.some((point) => point.type === 'missing_expense_data')) {
    limitations.push('Ausência de despesa no resumo precisa ser checada na fonte; não é conclusão automática.');
  }

  return limitations.slice(0, 5);
};

const CitizenSummaryPanel = ({ metrics, attentionPoints = [], expenseComparison, ano }) => {
  if (!metrics) return null;

  const topCategory = getTopCategory(metrics);
  const topSupplier = metrics.maiorFornecedor?.breakdown;
  const voteBreakdown = metrics.votacoesNominais?.breakdown || {};
  const limitations = buildLimitations({ metrics, expenseComparison, attentionPoints });
  const sourceName = metrics.totalGastoAno?.sourceName || metrics.proposicoes?.sourceName || 'Fonte não informada';
  const fetchedAt = metrics.totalGastoAno?.fetchedAt || metrics.proposicoes?.fetchedAt;
  const sourcePageUrl = metrics.totalGastoAno?.sourcePageUrl;
  const attentionHigh = attentionPoints.filter((point) => point.level === 'high').length;
  const attentionMedium = attentionPoints.filter((point) => point.level === 'medium').length;

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
              Este resumo traduz os indicadores auditáveis do perfil. Ele não substitui a leitura dos cards e não afirma
              irregularidade, presença, falta ou relatoria quando a fonte oficial não sustenta essa conclusão.
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
            title="Gasto declarado"
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
            title="Propostas encontradas"
            value={formatMetricValue(metrics.proposicoes)}
            status={getMetricStatus(metrics.proposicoes)}
            description="Quantidade de proposições retornadas pela API como autoria ou assinatura. Não significa aprovação."
          />

          <SummaryItem
            icon={Vote}
            title="Votações relevantes"
            value={formatMetricValue(metrics.votacoesNominais)}
            status={getMetricStatus(metrics.votacoesNominais)}
            description={
              voteBreakdown.total
                ? `Recorte com ${formatNumber(voteBreakdown.sim || 0)} voto(s) Sim e ${formatNumber(voteBreakdown.nao || 0)} voto(s) Não registrados.`
                : 'Nenhuma votação relevante com voto nominal foi encontrada neste recorte.'
            }
          />

          <SummaryItem
            icon={WalletCards}
            title="Principal categoria"
            value={topCategory ? polishText(topCategory.name) : 'Dado indisponível'}
            status={topCategory ? 'available' : 'unavailable'}
            description={topCategory ? `${formatCurrency(topCategory.value)} somados nesta categoria.` : 'Não há categoria suficiente para cálculo.'}
          />

          <SummaryItem
            icon={FileText}
            title="Maior fornecedor"
            value={topSupplier?.name ? polishText(topSupplier.name) : 'Dado indisponível'}
            status={topSupplier?.name ? 'available' : 'unavailable'}
            description={topSupplier?.value ? `${formatCurrency(topSupplier.value)} somados neste fornecedor.` : 'Não há fornecedor suficiente para cálculo.'}
          />

          <SummaryItem
            icon={ShieldAlert}
            title="Pontos que merecem atenção"
            value={attentionPoints.length ? formatNumber(attentionPoints.length) : 'Nenhum sinal automático'}
            status={attentionPoints.length ? 'partial' : 'available'}
            description={
              attentionPoints.length
                ? `${attentionHigh} alto(s) e ${attentionMedium} médio(s). São sinais de triagem, não acusações.`
                : 'Nenhum critério automático de triagem foi acionado neste perfil para o ano.'
            }
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-xl border border-yellow-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
              <div>
                <h3 className="font-black text-gray-950">Fonte e data</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  Fonte principal: <strong>{polishText(sourceName)}</strong>. Consulta registrada em{' '}
                  <strong>{formatDate(fetchedAt)}</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-yellow-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" />
              <div>
                <h3 className="font-black text-gray-950">Limitações importantes</h3>
                {limitations.length ? (
                  <ul className="mt-2 space-y-1 text-sm leading-relaxed text-gray-600">
                    {limitations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    Não há limitação adicional além das observações dos cards detalhados abaixo.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CitizenSummaryPanel;
