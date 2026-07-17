import React, { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, Loader2, MapPinned, RefreshCw } from 'lucide-react';
import { getAllDeputyAmendments, getDeputyAmendments } from '@/services/amendments';
import { Button } from '@/components/ui/button';
import AmendmentHealthContextPanel from '@/components/AmendmentHealthContextPanel';

const formatCurrency = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (value) => value ? new Date(value).toLocaleString('pt-BR') : 'Não consultado';

const AmendmentsPanel = ({ deputyName, year }) => {
  const [result, setResult] = useState({ status: 'loading', records: [] });
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [coverageProgress, setCoverageProgress] = useState(null);

  useEffect(() => {
    if (!deputyName || !year) return undefined;
    const controller = new AbortController();
    setResult({ status: 'loading', records: [] });
    getDeputyAmendments({ name: deputyName, year, signal: controller.signal }).then(setResult).catch(() => null);
    return () => controller.abort();
  }, [deputyName, year]);

  const loadExpandedCoverage = async () => {
    const controller = new AbortController();
    setCoverageLoading(true);
    setCoverageProgress(null);
    try {
      const expanded = await getAllDeputyAmendments({
        name: deputyName,
        year,
        signal: controller.signal,
        maxPages: 20,
        onProgress: setCoverageProgress,
      });
      setResult(expanded);
    } finally {
      setCoverageLoading(false);
    }
  };

  if (result.status === 'loading') {
    return <div className="flex min-h-48 items-center justify-center rounded-lg border bg-white text-sm text-gray-600"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Consultando emendas no Portal da Transparência...</div>;
  }

  if (result.status !== 'available') {
    const isUnconfigured = result.status === 'unconfigured';
    return (
      <section className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-800" />
          <div>
            <h2 className="text-lg font-black text-gray-950">Emendas: {isUnconfigured ? 'integração aguardando chave gratuita' : 'dados não encontrados agora'}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-700">
              {isUnconfigured
                ? 'A chave gratuita do Portal da Transparência precisa ser configurada somente no servidor da Vercel. Ela nunca deve ser colocada em uma variável VITE_.'
                : 'O FISCALIZA não recebeu registros confirmáveis para este nome e ano. Nenhum valor foi estimado.'}
            </p>
            {result.sourceUrl && <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 font-bold text-blue-700 hover:underline">Consultar diretamente no Portal da Transparência <ExternalLink className="h-4 w-4" /></a>}
          </div>
        </div>
      </section>
    );
  }

  const summary = result.summary;
  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-yellow-800">Destino do dinheiro público</p>
            <h2 className="mt-1 text-2xl font-black text-gray-950">Emendas parlamentares em {year}</h2>
            <p className="mt-2 text-sm text-gray-700">
              {result.coverage === 'complete'
                ? `Cobertura ampliada concluída em ${result.pagesFetched} página(s) da API.`
                : 'Recorte inicial da API por nome do autor. “Pago” não significa, sozinho, impacto social comprovado.'}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <span className="rounded-full border border-yellow-300 bg-white px-3 py-1 text-xs font-black text-yellow-900">
              {result.coverage === 'complete' ? 'Cobertura concluída' : 'Cobertura parcial'}
            </span>
            <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline">Fonte oficial <ExternalLink className="h-4 w-4" /></a>
            {result.coverage !== 'complete' && (
              <Button type="button" size="sm" variant="outline" disabled={coverageLoading} onClick={loadExpandedCoverage}>
                {coverageLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Ampliar cobertura
              </Button>
            )}
            {coverageProgress && <p className="text-xs text-gray-600">Página {coverageProgress.page}: {coverageProgress.records} registros únicos.</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Registros no recorte', summary.totalRecords.toLocaleString('pt-BR')],
          ['Empenhado no recorte', formatCurrency(summary.committed)],
          ['Liquidado no recorte', formatCurrency(summary.liquidated)],
          ['Pago no recorte', formatCurrency(summary.paid)],
        ].map(([label, value]) => <div key={label} className="rounded-lg border bg-white p-4"><p className="text-xs font-bold uppercase text-gray-500">{label}</p><p className="mt-1 text-xl font-black text-gray-950">{value}</p></div>)}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-5">
          <h3 className="flex items-center gap-2 font-black text-gray-950"><MapPinned className="h-5 w-5 text-yellow-700" /> Localidades do recorte por valor pago</h3>
          <div className="mt-4 space-y-3">
            {summary.topLocations.map((location) => <div key={location.name} className="flex items-start justify-between gap-3 border-b pb-3 text-sm"><span className="font-semibold text-gray-700">{location.name}</span><strong className="shrink-0">{formatCurrency(location.paid)}</strong></div>)}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <h3 className="font-black text-gray-950">Áreas do recorte por valor pago</h3>
          <div className="mt-4 space-y-3">
            {summary.topFunctions.map((item) => <div key={item.name} className="flex items-start justify-between gap-3 border-b pb-3 text-sm"><span className="font-semibold text-gray-700">{item.name}</span><strong className="shrink-0">{formatCurrency(item.paid)}</strong></div>)}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <h3 className="font-black text-gray-950">Emendas encontradas</h3>
          <div className="mt-4 divide-y">
            {result.records.slice(0, 10).map((item, index) => (
              <article key={item.code || `${item.number}-${index}`} className="py-3 first:pt-0">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold text-gray-950">{item.number || item.code || 'Número não informado'} · {item.location}</p>
                    <p className="text-xs text-gray-600">{item.functionName}{item.subfunction ? ` · ${item.subfunction}` : ''}</p>
                    {item.favored && <p className="mt-1 text-xs text-gray-500">Favorecido: {item.favored}</p>}
                    {item.object && <p className="mt-1 line-clamp-2 text-xs text-gray-500">Objeto: {item.object}</p>}
                  </div>
                  <p className="shrink-0 text-sm font-black text-green-800">Pago: {formatCurrency(item.paid)}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">Consultado em {formatDate(result.fetchedAt)}. {result.coverage === 'complete' ? 'A paginação terminou ao encontrar uma página vazia.' : 'Use “Ampliar cobertura” para percorrer mais páginas sem exceder o limite gratuito definido pelo FISCALIZA.'}</p>
        </div>
      </div>

      <AmendmentHealthContextPanel amendments={result.records} year={year} />
    </section>
  );
};

export default AmendmentsPanel;
