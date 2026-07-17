import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, CheckCircle2, ExternalLink, FileSearch, Info, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { buildDeputyKpiVerificationRows, summarizeVerificationCoverage } from '@/lib/kpi-verification';
import { polishText } from '@/lib/display-text';
import { formatCurrency, formatNumber } from '@/lib/legislative-logic';

const badgeStyles = {
  comparable: 'border-green-200 bg-green-50 text-green-800',
  different_scope: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  external_check: 'border-blue-200 bg-blue-50 text-blue-800',
};

const badgeIcons = {
  comparable: CheckCircle2,
  different_scope: ArrowLeftRight,
  external_check: FileSearch,
};

const formatValue = (row) => {
  if (row.fiscalizaValue === null || row.fiscalizaValue === undefined) return 'Dado indisponível';
  if (row.fiscalizaMetricId === 'totalGastoAno') return formatCurrency(row.fiscalizaValue);
  if (typeof row.fiscalizaValue === 'number') return formatNumber(row.fiscalizaValue);
  return String(row.fiscalizaValue);
};

const VerificationRow = ({ row }) => {
  const Icon = badgeIcons[row.status] || Info;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-gray-950">{row.label}</h3>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-black ${badgeStyles[row.status] || badgeStyles.external_check}`}>
              <Icon className="h-3 w-3" />
              {row.badge}
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-gray-950">{formatValue(row)}</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{polishText(row.method)}</p>
          <p className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs leading-relaxed text-yellow-900">
            {polishText(row.warning)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          {row.internalSourceUrl && (
            <Button asChild variant="outline" className="justify-center border-gray-200">
              <Link to={row.internalSourceUrl}>
                Fonte no FISCALIZA
                <FileSearch className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
          {row.officialUrl && (
            <Button asChild className="justify-center bg-yellow-400 text-black hover:bg-yellow-300">
              <a href={row.officialUrl} target="_blank" rel="noopener noreferrer">
                Conferir na Câmara
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const KpiVerificationPanel = ({ deputyId, year, metrics }) => {
  const rows = useMemo(
    () => buildDeputyKpiVerificationRows({ deputyId, year, metrics }),
    [deputyId, metrics, year]
  );
  const coverage = useMemo(() => summarizeVerificationCoverage(rows), [rows]);

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-black uppercase text-blue-900">
              <ShieldCheck className="h-4 w-4" />
              Conferência de consistência
            </div>
            <h2 className="text-2xl font-black text-gray-950">Compare o FISCALIZA com a Câmara</h2>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-gray-700">
              Esta área mostra quais números podem ser conferidos diretamente, quais dependem de busca externa no portal
              e quais usam uma regra diferente. Ela existe para evitar que dois indicadores parecidos sejam tratados como
              se fossem a mesma coisa.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-blue-100">
              <p className="text-lg font-black text-green-700">{coverage.comparable}</p>
              <p className="text-[10px] font-black uppercase text-gray-500">Comparáveis</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-blue-100">
              <p className="text-lg font-black text-yellow-700">{coverage.differentScope}</p>
              <p className="text-[10px] font-black uppercase text-gray-500">Regra diferente</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-blue-100">
              <p className="text-lg font-black text-blue-700">{coverage.externalCheck}</p>
              <p className="text-[10px] font-black uppercase text-gray-500">Externos</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-2">
          {rows.map((row) => (
            <VerificationRow key={row.id} row={row} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default KpiVerificationPanel;
