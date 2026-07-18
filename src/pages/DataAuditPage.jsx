import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { AlertTriangle, CheckCircle2, DatabaseZap, ExternalLink, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { buildKpiAuditRows, summarizeKpiAudit } from '@/lib/kpi-audit';
import { buildMandateContext } from '@/lib/mandate-context';
import { buildDeputadoMetrics } from '@/lib/legislative-logic';
import { LEGISLATIVE_YEARS, DEFAULT_LEGISLATIVE_YEAR } from '@/lib/legislative-years';
import {
  getAllDeputadosList,
  getDeputadoDespesas,
  getDeputadoDiscursos,
  getDeputadoEventos,
  getDeputadoHistorico,
  getDeputadoInfo,
  getDeputadoProposicoes,
  getDeputadoVotacoes,
} from '@/services/camara';
import { getDeputadoPortalResumo } from '@/services/camaraPortal';

const statusLabel = {
  match: 'Confere',
  review: 'Revisar diferença',
  different_definition: 'Definição diferente',
  unavailable: 'Sem comparação',
};

const DataAuditPage = () => {
  const [deputies, setDeputies] = useState([]);
  const [query, setQuery] = useState('');
  const [year, setYear] = useState(DEFAULT_LEGISLATIVE_YEAR);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllDeputadosList().then(setDeputies).catch(() => setError('Não foi possível carregar a lista oficial de deputados.'));
  }, []);

  const selected = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    return deputies.find((item) => String(item.nome || '').toLocaleLowerCase('pt-BR') === normalized)
      || deputies.find((item) => String(item.nome || '').toLocaleLowerCase('pt-BR').includes(normalized));
  }, [deputies, query]);

  const runAudit = async () => {
    if (!selected) {
      setError('Escolha um deputado sugerido pela lista.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [info, proposicoes, despesas, eventos, discursos, votacoes, portalSummary, history] = await Promise.all([
        getDeputadoInfo(selected.id),
        getDeputadoProposicoes(selected.id, year),
        getDeputadoDespesas(selected.id, year),
        getDeputadoEventos(selected.id, year),
        getDeputadoDiscursos(selected.id, year),
        getDeputadoVotacoes(selected.id, year).catch(() => []),
        getDeputadoPortalResumo(selected.id, year).catch(() => null),
        getDeputadoHistorico(selected.id).catch(() => []),
      ]);
      const metrics = buildDeputadoMetrics({ proposicoes, despesas, eventos, discursos, votacoes, portalResumo: portalSummary, deputadoId: selected.id, ano: year });
      const rows = buildKpiAuditRows({ metrics, raw: { proposicoes, despesas, eventos, discursos, votacoes }, portalSummary });
      setResult({ info, rows, summary: summarizeKpiAudit(rows), mandate: buildMandateContext({ history, year }) });
    } catch (auditError) {
      setError('A auditoria não terminou porque uma fonte oficial falhou. Nenhum resultado parcial foi tratado como confirmação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Helmet><title>Auditoria de dados - FISCALIZA</title></Helmet>
      <div className="border-b bg-white"><div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase text-yellow-700">Ferramenta administrativa</p>
        <h1 className="mt-1 text-3xl font-black text-gray-950">Auditoria Câmara x FISCALIZA</h1>
        <p className="mt-2 max-w-3xl text-gray-600">Compara valores e, principalmente, as definições usadas em cada fonte. Diferença de escopo não é rotulada como erro.</p>
      </div></div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card><CardContent className="grid gap-3 p-5 md:grid-cols-[1fr_auto_auto]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} list="audit-deputies" placeholder="Nome do deputado" className="w-full rounded-md border py-2.5 pl-9 pr-3" /><datalist id="audit-deputies">{deputies.map((item) => <option key={item.id} value={item.nome} />)}</datalist></div>
          <select value={year} onChange={(event) => setYear(event.target.value)} className="rounded-md border px-3">{LEGISLATIVE_YEARS.map((item) => <option key={item}>{item}</option>)}</select>
          <Button onClick={runAudit} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}Auditar</Button>
        </CardContent></Card>
        {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        {result && <div className="mt-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-4">
            {[['Confere', result.summary.match], ['Revisar', result.summary.review], ['Definição diferente', result.summary.different_definition], ['Sem comparação', result.summary.unavailable]].map(([label, value]) => <Card key={label}><CardContent className="p-4"><p className="text-xs font-bold uppercase text-gray-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></CardContent></Card>)}
          </div>
          <div className={`rounded-lg border p-4 ${result.mandate.isPartial ? 'border-yellow-300 bg-yellow-50' : 'bg-white'}`}><p className="font-black">Contexto do mandato: {result.mandate.status}</p><p className="mt-1 text-sm text-gray-600">{result.mandate.activeDays === null ? 'Dias em exercício não calculáveis com segurança.' : `${result.mandate.activeDays} dias em exercício confirmados no ano.`}</p></div>
          <div className="space-y-3">{result.rows.map((row) => <Card key={row.id}><CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_150px_150px]">
            <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-black">{row.label}</h2><span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${row.status === 'match' ? 'border-green-200 bg-green-50 text-green-800' : 'border-yellow-200 bg-yellow-50 text-yellow-900'}`}>{row.status === 'match' ? <CheckCircle2 className="mr-1 inline h-3 w-3" /> : <AlertTriangle className="mr-1 inline h-3 w-3" />}{statusLabel[row.status]}</span></div><p className="mt-2 text-sm text-gray-600">FISCALIZA: {row.fiscalizaMethod || 'Método não informado'}</p><p className="mt-1 text-sm text-gray-600">Fonte comparada: {row.officialMethod}</p>{row.sourceUrl && <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-blue-700">Abrir fonte <ExternalLink className="h-4 w-4" /></a>}</div>
            <div><p className="text-xs font-bold uppercase text-gray-500">FISCALIZA</p><p className="mt-1 text-2xl font-black">{row.fiscalizaValue ?? 'Indisponível'}</p></div>
            <div><p className="text-xs font-bold uppercase text-gray-500">Oficial comparado</p><p className="mt-1 text-2xl font-black">{row.officialValue ?? 'Indisponível'}</p></div>
          </CardContent></Card>)}</div>
        </div>}
      </div>
    </div>
  );
};

export default DataAuditPage;
