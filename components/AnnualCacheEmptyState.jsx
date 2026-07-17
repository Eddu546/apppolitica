import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Database, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const copyByContext = {
  rankings: {
    title: 'Ranking sem base sincronizada',
    description:
      'Para mostrar ranking nacional com responsabilidade, o FISCALIZA precisa ter os resumos anuais de despesas salvos no Supabase para o ano escolhido.',
    result:
      'Depois da sincronização, esta página passa a comparar deputados por gasto total, média mensal, categorias sensíveis e filtros de estado ou partido.',
  },
  attention: {
    title: 'Pontos de atenção sem base sincronizada',
    description:
      'Os alertas dependem dos resumos anuais de despesas. Sem essa base, o site não deve sugerir concentração de gasto, gasto acima da média ou padrão fora da curva.',
    result:
      'Depois da sincronização, esta página passa a listar sinais de triagem com fonte oficial e explicação do cálculo.',
  },
};

const AnnualCacheEmptyState = ({ year, context = 'rankings', message = '', onRetry }) => {
  const copy = copyByContext[context] || copyByContext.rankings;

  return (
    <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-6 text-left shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-black">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-yellow-800">Ano consultado: {year}</p>
            <h2 className="mt-1 text-xl font-black text-gray-950">{copy.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700">{copy.description}</p>
            {message && <p className="mt-2 text-sm font-semibold text-yellow-900">{message}</p>}
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700">{copy.result}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button asChild className="bg-yellow-400 text-black hover:bg-yellow-300">
            <Link to="/admin">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Abrir admin
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-yellow-300 bg-white text-gray-900 hover:bg-yellow-100">
            <Link to="/saude">Ver saúde</Link>
          </Button>
          {onRetry && (
            <Button type="button" variant="outline" onClick={onRetry} className="border-gray-300 bg-white text-gray-900">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar de novo
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-yellow-200 bg-white p-3">
          <p className="text-xs font-bold uppercase text-gray-500">1. Entrar no painel</p>
          <p className="mt-1 text-sm text-gray-700">Use seu login admin já configurado no Supabase.</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-white p-3">
          <p className="text-xs font-bold uppercase text-gray-500">2. Sincronizar faltantes</p>
          <p className="mt-1 text-sm text-gray-700">Escolha o ano {year} e rode o modo recomendado: apenas faltantes.</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-white p-3">
          <p className="text-xs font-bold uppercase text-gray-500">3. Publicar com cautela</p>
          <p className="mt-1 text-sm text-gray-700">A página só vira ranking confiável quando a base chega perto dos 513 deputados.</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2 rounded-lg border border-yellow-200 bg-white p-3 text-xs text-yellow-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          O FISCALIZA prefere não mostrar ranking vazio como se fosse conclusão. Se a API oficial ou o Supabase falhar,
          a página informa a limitação em vez de inventar número.
        </p>
      </div>
    </div>
  );
};

export default AnnualCacheEmptyState;
