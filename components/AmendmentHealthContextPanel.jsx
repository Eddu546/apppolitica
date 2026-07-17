import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ExternalLink, Loader2 } from 'lucide-react';
import { fetchMunicipalHealthContext } from '@/services/healthContext';

const formatNumber = (value) =>
  value === null || value === undefined
    ? 'Dado indisponível'
    : Number(value).toLocaleString('pt-BR');

const AmendmentHealthContextPanel = ({ amendments = [], year }) => {
  const municipalityCodes = useMemo(
    () => amendments.map((item) => item.municipalityCode).filter(Boolean),
    [amendments]
  );
  const locations = useMemo(() => new Map(
    amendments
      .filter((item) => item.municipalityCode)
      .map((item) => [String(item.municipalityCode), item.location])
  ), [amendments]);
  const [result, setResult] = useState({ status: 'loading', data: [] });

  useEffect(() => {
    let active = true;
    if (!municipalityCodes.length) {
      setResult({ status: 'unavailable', data: [], reason: 'municipality-code-missing' });
      return undefined;
    }
    setResult({ status: 'loading', data: [] });
    fetchMunicipalHealthContext({ municipalityCodes, year })
      .then((response) => {
        if (active) setResult(response);
      });
    return () => {
      active = false;
    };
  }, [municipalityCodes, year]);

  if (result.status === 'loading') {
    return <div className="flex items-center rounded-lg border bg-white p-4 text-sm text-gray-600"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando contexto municipal de saúde...</div>;
  }

  if (result.status !== 'available') {
    return (
      <section className="rounded-lg border border-blue-100 bg-blue-50 p-5">
        <h3 className="flex items-center gap-2 font-black text-blue-950"><Activity className="h-5 w-5" /> Contexto de saúde do destino</h3>
        <p className="mt-2 text-sm leading-6 text-blue-900">
          {result.reason === 'municipality-code-missing'
            ? 'A resposta das emendas não trouxe código IBGE suficiente para cruzar o município com a base CNES.'
            : 'A integração está preparada, mas o resumo municipal do CNES ainda não foi importado no Supabase. Nenhum impacto em saúde foi estimado.'}
        </p>
        <a href="https://basedosdados.org/dataset/354d6d98-bc09-4e22-a58a-e4eac3a5283c" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-blue-800 hover:underline">
          Abrir base CNES <ExternalLink className="h-4 w-4" />
        </a>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-blue-100 bg-blue-50 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-blue-800">Contexto, não causalidade</p>
          <h3 className="mt-1 text-xl font-black text-blue-950">Estrutura de saúde nos municípios encontrados</h3>
          <p className="mt-2 text-sm leading-6 text-blue-900">Estes números descrevem a rede local na competência disponível. Eles não provam que a emenda criou leitos, unidades ou equipes.</p>
        </div>
        <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-blue-800 hover:underline">Fonte CNES <ExternalLink className="h-4 w-4" /></a>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {result.data.map((item) => (
          <article key={`${item.cod_municipio}-${item.ano_mes}`} className="rounded-lg border border-blue-100 bg-white p-4">
            <p className="font-black text-gray-950">{locations.get(String(item.cod_municipio)) || item.nome_municipio || item.cod_municipio}</p>
            <p className="mt-1 text-xs text-gray-500">Competência: {item.ano_mes || 'não informada'}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div><p className="text-lg font-black">{formatNumber(item.estabelecimentos)}</p><p className="text-[10px] uppercase text-gray-500">Estabelecimentos</p></div>
              <div><p className="text-lg font-black">{formatNumber(item.leitos)}</p><p className="text-[10px] uppercase text-gray-500">Leitos</p></div>
              <div><p className="text-lg font-black">{formatNumber(item.equipes_saude)}</p><p className="text-[10px] uppercase text-gray-500">Equipes</p></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AmendmentHealthContextPanel;

