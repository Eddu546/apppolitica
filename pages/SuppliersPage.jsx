import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Building2, Database, Loader2, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/legislative-logic';
import { DEFAULT_LEGISLATIVE_YEAR, LEGISLATIVE_YEARS } from '@/lib/legislative-years';
import {
  buildSupplierNetwork,
  fetchDeputyYearSummaries,
  getAnnualSummaryBaseStatus,
  parseSummarySuppliers,
} from '@/services/annualSummaries';

const formatTaxId = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 14) return value || 'Documento não informado';
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

const SuppliersPage = () => {
  const [year, setYear] = useState(DEFAULT_LEGISLATIVE_YEAR);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchDeputyYearSummaries(year)
      .then((result) => {
        if (active) setSummaries(result.data || []);
      })
      .catch(() => {
        if (active) {
          setSummaries([]);
          setError('Não foi possível carregar o cache anual de fornecedores agora.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [year]);

  const network = useMemo(() => buildSupplierNetwork(summaries), [summaries]);
  const summariesWithSuppliers = useMemo(
    () => summaries.filter((summary) => parseSummarySuppliers(summary).length > 0).length,
    [summaries]
  );
  const filtered = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('pt-BR');
    if (!normalized) return network;
    return network.filter((supplier) =>
      supplier.name.toLocaleLowerCase('pt-BR').includes(normalized)
      || String(supplier.taxId || '').includes(normalized.replace(/\D/g, ''))
      || supplier.deputies.some((deputy) => deputy.name.toLocaleLowerCase('pt-BR').includes(normalized))
    );
  }, [network, search]);
  const baseStatus = getAnnualSummaryBaseStatus(summaries);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Helmet><title>Rede de fornecedores - FISCALIZA</title></Helmet>
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <Building2 className="mt-1 h-10 w-10 text-yellow-600" />
            <div>
              <h1 className="text-3xl font-black text-gray-950">Rede de fornecedores da CEAP</h1>
              <p className="mt-2 max-w-4xl text-gray-600">
                Descubra quais fornecedores aparecem nas despesas parlamentares e quais deputados registraram pagamentos.
                Concentração é um sinal para leitura das notas, não uma acusação.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase text-yellow-800">Cobertura do cache</p>
                <h2 className="mt-1 text-xl font-black text-gray-950">{baseStatus.label}</h2>
                <p className="mt-1 text-sm text-gray-700">
                  {formatNumber(summariesWithSuppliers)} de {formatNumber(summaries.length)} resumos possuem a nova lista de fornecedores.
                  Caches antigos precisam ser sincronizados novamente para aparecer aqui.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {LEGISLATIVE_YEARS.map((option) => (
                  <Button key={option} size="sm" variant={year === option ? 'default' : 'outline'} onClick={() => setYear(option)}>
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-xs font-bold uppercase text-gray-500">Fornecedores encontrados</p><p className="mt-1 text-2xl font-black">{formatNumber(network.length)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs font-bold uppercase text-gray-500">Deputados com detalhamento</p><p className="mt-1 text-2xl font-black">{formatNumber(summariesWithSuppliers)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs font-bold uppercase text-gray-500">Origem</p><p className="mt-1 font-black">Despesas CEAP da Câmara</p></CardContent></Card>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar fornecedor, CNPJ ou deputado..."
                className="w-full rounded-md border border-gray-300 py-2.5 pl-9 pr-3"
              />
            </div>
          </CardContent>
        </Card>

        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-10 w-10 animate-spin text-yellow-600" /></div>
        ) : filtered.length ? (
          <div className="space-y-3">
            {filtered.slice(0, 100).map((supplier, index) => (
              <Card key={supplier.id}>
                <CardContent className="p-5">
                  <div className="grid gap-4 lg:grid-cols-[60px_1fr_180px_150px] lg:items-center">
                    <div className="text-2xl font-black text-gray-400">#{index + 1}</div>
                    <div>
                      <h2 className="font-black text-gray-950">{supplier.name}</h2>
                      <p className="mt-1 text-xs text-gray-500">{formatTaxId(supplier.taxId)}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {supplier.deputies.slice(0, 6).map((deputy) => (
                          <Link key={`${supplier.id}-${deputy.id}`} to={`/politico/${deputy.id}?ano=${year}`} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-yellow-100">
                            {deputy.name} · {formatCurrency(deputy.value)}
                          </Link>
                        ))}
                        {supplier.deputies.length > 6 && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500">+ {supplier.deputies.length - 6}</span>}
                      </div>
                    </div>
                    <div><p className="text-xs font-bold uppercase text-gray-500">Valor no recorte</p><p className="mt-1 text-lg font-black">{formatCurrency(supplier.value)}</p></div>
                    <div><p className="flex items-center gap-1 text-xs font-bold uppercase text-gray-500"><Users className="h-3.5 w-3.5" /> Deputados</p><p className="mt-1 text-lg font-black">{formatNumber(supplier.deputyCount)}</p><p className="text-xs text-gray-500">{formatNumber(supplier.records)} registros</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-white p-10 text-center text-gray-600">
            <Database className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-3 font-bold text-gray-950">Nenhum fornecedor disponível neste recorte.</p>
            <p className="mt-1 text-sm">Sincronize o ano novamente no painel administrativo para preencher a nova coluna de fornecedores.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuppliersPage;

