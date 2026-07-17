import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  ListChecks,
  Loader2,
  RefreshCw,
  ServerCrash,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { runSystemHealthCheck } from '@/services/systemHealth';

const statusConfig = {
  ok: {
    label: 'OK',
    icon: CheckCircle2,
    className: 'border-green-200 bg-green-50 text-green-800',
    iconClass: 'text-green-700',
  },
  warning: {
    label: 'Atenção',
    icon: AlertTriangle,
    className: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    iconClass: 'text-yellow-700',
  },
  empty: {
    label: 'Vazio',
    icon: AlertTriangle,
    className: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    iconClass: 'text-yellow-700',
  },
  error: {
    label: 'Erro',
    icon: XCircle,
    className: 'border-red-200 bg-red-50 text-red-800',
    iconClass: 'text-red-700',
  },
  unknown: {
    label: 'Não verificado',
    icon: Clock,
    className: 'border-slate-200 bg-slate-50 text-slate-700',
    iconClass: 'text-slate-600',
  },
};

const formatDateTime = (date) => {
  if (!date) return 'Sem dado';
  return new Date(date).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const formatCount = (count) =>
  count === null || count === undefined
    ? 'Sem leitura'
    : Number(count).toLocaleString('pt-BR');

const checklistStatusConfig = {
  done: {
    label: 'Pronto',
    className: 'border-green-200 bg-green-50 text-green-800',
    iconClass: 'text-green-700',
    icon: CheckCircle2,
  },
  attention: {
    label: 'Atenção',
    className: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    iconClass: 'text-yellow-700',
    icon: AlertTriangle,
  },
  blocked: {
    label: 'Corrigir',
    className: 'border-red-200 bg-red-50 text-red-800',
    iconClass: 'text-red-700',
    icon: XCircle,
  },
};

const getLaunchChecklist = (health) => {
  if (!health) return [];

  const supabase = health.services.find((item) => item.id === 'supabase-rest');
  const auth = health.services.find((item) => item.id === 'supabase-auth');
  const admin = health.services.find((item) => item.id === 'admin-allowlist');
  const camara = health.services.find((item) => item.id === 'camara-api');
  const senado = health.services.find((item) => item.id === 'senado-api');
  const transparency = health.services.find((item) => item.id === 'portal-transparencia-api');
  const fullCacheYear = health.cache.years.find((item) => item.status === 'ok');
  const partialCacheYear = health.cache.years.find((item) => item.status === 'warning');
  const hasTableError = health.tables.some((table) => table.status === 'error');
  const correctionsTable = health.tables.find((table) => table.name === 'correcoes');
  const metricsTable = health.tables.find((table) => table.name === 'metricas_validadas');

  return [
    {
      id: 'supabase',
      title: 'Banco do Supabase respondendo',
      status: supabase?.status === 'ok' ? 'done' : 'blocked',
      summary: supabase?.status === 'ok'
        ? 'As leituras públicas estão funcionando. Rankings, dados validados e cache podem consultar o banco.'
        : 'O banco não respondeu. Se o projeto estiver pausado no plano gratuito, reative no painel do Supabase.',
      actionLabel: 'Abrir Supabase',
      href: health.config.dashboardUrl || '',
      external: true,
    },
    {
      id: 'admin',
      title: 'Admin liberado para sincronizar',
      status: auth?.status === 'ok' && admin?.status === 'ok' ? 'done' : 'attention',
      summary: auth?.status === 'ok' && admin?.status === 'ok'
        ? 'Sua sessão admin está válida e o e-mail está autorizado em public.admin_users.'
        : 'Entre no admin e confirme se o e-mail logado está autorizado para revisar correções e sincronizar cache.',
      actionLabel: 'Abrir admin',
      href: '/admin',
    },
    {
      id: 'schema',
      title: 'Tabelas principais criadas',
      status: hasTableError ? 'blocked' : 'done',
      summary: hasTableError
        ? 'Uma ou mais tabelas esperadas não responderam. Rode o schema atualizado no SQL Editor do Supabase.'
        : 'As tabelas principais existem e responderam à leitura permitida pelas políticas do Supabase.',
      actionLabel: 'Ver tabelas',
      href: health.config.dashboardUrl ? `${health.config.dashboardUrl}/editor` : '',
      external: true,
    },
    {
      id: 'cache',
      title: 'Cache anual pronto para rankings',
      status: fullCacheYear ? 'done' : partialCacheYear ? 'attention' : 'blocked',
      summary: fullCacheYear
        ? `O ano ${fullCacheYear.year} tem ${formatCount(fullCacheYear.count)} deputados no cache, suficiente para ranking nacional.`
        : partialCacheYear
          ? `O ano ${partialCacheYear.year} tem cache parcial. Use como amostra, não como ranking nacional definitivo.`
          : 'Nenhum ano tem cache suficiente. Sincronize pelo menos um ano completo no painel admin.',
      actionLabel: 'Sincronizar cache',
      href: '/admin',
    },
    {
      id: 'apis',
      title: 'APIs oficiais acessíveis',
      status: camara?.status === 'ok' && senado?.status === 'ok' && transparency?.status === 'ok' ? 'done' : 'attention',
      summary: camara?.status === 'ok' && senado?.status === 'ok' && transparency?.status === 'ok'
        ? 'Câmara, Senado e Portal da Transparência responderam. O site consegue consultar as fontes oficiais integradas.'
        : 'Alguma API oficial não respondeu. O site deve exibir limitação em vez de número inventado.',
      actionLabel: 'Atualizar diagnóstico',
      onRefresh: true,
    },
    {
      id: 'corrections',
      title: 'Fluxo de correções e dados validados',
      status: correctionsTable?.status === 'ok' && metricsTable?.status === 'ok' ? 'done' : 'attention',
      summary: correctionsTable?.status === 'ok' && metricsTable?.status === 'ok'
        ? 'A fila de correções e a página pública de dados validados estão acessíveis conforme as permissões.'
        : 'A leitura da fila privada exige login admin. Confirme antes de divulgar o canal de correções.',
      actionLabel: 'Ver validados',
      href: '/dados-validados',
    },
  ];
};

const getReadinessSummary = (checklist) => {
  const blocked = checklist.filter((item) => item.status === 'blocked').length;
  const attention = checklist.filter((item) => item.status === 'attention').length;
  const done = checklist.filter((item) => item.status === 'done').length;

  if (blocked > 0) {
    return {
      status: 'blocked',
      title: 'Ação necessária antes de divulgar',
      message: `${blocked} ponto(s) precisam ser corrigidos. O site pode funcionar parcialmente, mas rankings e alertas podem ficar incompletos.`,
      done,
      attention,
      blocked,
    };
  }

  if (attention > 0) {
    return {
      status: 'attention',
      title: 'Operação parcial, divulgar com cautela',
      message: `${attention} ponto(s) merecem conferência. O site pode ir ao ar, mas deixe as limitações visíveis.`,
      done,
      attention,
      blocked,
    };
  }

  return {
    status: 'done',
    title: 'Pronto para divulgação inicial',
    message: 'Os pontos operacionais essenciais estão respondendo. Ainda assim, mantenha a página de saúde como rotina antes de campanhas.',
    done,
    attention,
    blocked,
  };
};

const StatusPill = ({ status }) => {
  const config = statusConfig[status] || statusConfig.unknown;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
};

const ServiceCard = ({ check }) => {
  const config = statusConfig[check.status] || statusConfig.unknown;
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-500">Serviço</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">{check.label}</h2>
          </div>
          <Icon className={`h-6 w-6 shrink-0 ${config.iconClass}`} />
        </div>

        <p className="text-sm leading-relaxed text-slate-700">{check.summary}</p>
        {check.detail && <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">{check.detail}</p>}

        <div className="mt-auto flex items-center justify-between gap-3">
          <StatusPill status={check.status} />
          {check.action?.href && (
            <a
              href={check.action.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-yellow-700 hover:underline"
            >
              {check.action.label}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const TableStatusCard = ({ table }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-500">Tabela</p>
          <h3 className="mt-1 font-black text-slate-950">{table.label}</h3>
          <p className="mt-2 text-sm text-slate-600">{table.summary}</p>
        </div>
        <StatusPill status={table.status} />
      </div>
      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <p className="text-xs font-bold uppercase text-slate-500">Registros encontrados</p>
        <p className="text-2xl font-black text-slate-950">{formatCount(table.count)}</p>
      </div>
      {table.detail && <p className="mt-3 text-xs leading-relaxed text-red-700">{table.detail}</p>}
    </CardContent>
  </Card>
);

const CacheYearRow = ({ item }) => {
  const complete = item.count >= 450;

  return (
    <div className="grid grid-cols-1 gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 md:grid-cols-[120px_1fr_180px_140px] md:items-center">
      <div>
        <p className="text-xs font-bold uppercase text-slate-500">Ano</p>
        <p className="text-lg font-black text-slate-950">{item.year}</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">
          {complete
            ? 'Base suficiente para ranking nacional'
            : item.count > 0
              ? 'Base parcial'
              : 'Sem cache sincronizado'}
        </p>
        {item.detail && <p className="mt-1 text-xs text-red-700">{item.detail}</p>}
      </div>
      <div>
        <p className="text-xs font-bold uppercase text-slate-500">Deputados no cache</p>
        <p className="font-black text-slate-950">{formatCount(item.count)}</p>
      </div>
      <StatusPill status={item.status} />
    </div>
  );
};

const LaunchChecklist = ({ checklist, readiness, onRefresh }) => {
  const readinessStyle = checklistStatusConfig[readiness.status] || checklistStatusConfig.attention;
  const ReadinessIcon = readinessStyle.icon;

  return (
    <Card className={`${readinessStyle.className} border-2`}>
      <CardContent className="p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/80">
              <ReadinessIcon className={`h-6 w-6 ${readinessStyle.iconClass}`} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide">Checklist operacional</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">{readiness.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">{readiness.message}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-white/80 px-4 py-3">
              <p className="text-xs font-bold uppercase text-slate-500">Pronto</p>
              <p className="text-2xl font-black text-green-700">{readiness.done}</p>
            </div>
            <div className="rounded-lg bg-white/80 px-4 py-3">
              <p className="text-xs font-bold uppercase text-slate-500">Atenção</p>
              <p className="text-2xl font-black text-yellow-700">{readiness.attention}</p>
            </div>
            <div className="rounded-lg bg-white/80 px-4 py-3">
              <p className="text-xs font-bold uppercase text-slate-500">Corrigir</p>
              <p className="text-2xl font-black text-red-700">{readiness.blocked}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {checklist.map((item) => {
            const config = checklistStatusConfig[item.status] || checklistStatusConfig.attention;
            const Icon = config.icon;

            const action = item.onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                className="text-xs font-black text-yellow-800 hover:underline"
              >
                {item.actionLabel}
              </button>
            ) : item.href ? (
              item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-black text-yellow-800 hover:underline"
                >
                  {item.actionLabel}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <Link to={item.href} className="text-xs font-black text-yellow-800 hover:underline">
                  {item.actionLabel}
                </Link>
              )
            ) : null;

            return (
              <div key={item.id} className="rounded-xl border border-white/70 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconClass}`} />
                    <div>
                      <h3 className="font-black text-slate-950">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.summary}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-black ${config.className}`}>
                    {config.label}
                  </span>
                </div>
                {action && <div className="mt-3 pl-8">{action}</div>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const SystemHealthPage = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHealth = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await runSystemHealthCheck();
      setHealth(result);
    } catch (err) {
      console.error('Erro ao diagnosticar sistema:', err);
      setError('Não foi possível montar o diagnóstico agora.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const overview = useMemo(() => {
    if (!health) return [];

    const supabase = health.services.find((item) => item.id === 'supabase-rest');
    const admin = health.services.find((item) => item.id === 'admin-allowlist');
    const camara = health.services.find((item) => item.id === 'camara-api');

    return [
      {
        label: 'Supabase',
        value: supabase?.status === 'ok' ? 'Ativo' : 'Atenção',
        status: supabase?.status || 'unknown',
        icon: Database,
      },
      {
        label: 'Admin',
        value: admin?.status === 'ok' ? 'Liberado' : 'Verificar',
        status: admin?.status || 'unknown',
        icon: ShieldCheck,
      },
      {
        label: 'Cache anual',
        value: health.cache.status === 'ok' ? 'Pronto' : health.cache.status === 'warning' ? 'Parcial' : 'Vazio',
        status: health.cache.status,
        icon: Activity,
      },
      {
        label: 'API Câmara',
        value: camara?.status === 'ok' ? 'Online' : 'Atenção',
        status: camara?.status || 'unknown',
        icon: ServerCrash,
      },
    ];
  }, [health]);

  const launchChecklist = useMemo(() => getLaunchChecklist(health), [health]);
  const readiness = useMemo(() => getReadinessSummary(launchChecklist), [launchChecklist]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <Helmet>
        <title>Saúde do Sistema - FISCALIZA</title>
        <meta name="description" content="Diagnóstico do Supabase, cache de rankings e APIs oficiais do FISCALIZA." />
      </Helmet>

      <div className="border-b border-yellow-400/20 bg-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-sm font-bold text-yellow-200">
                <ListChecks className="h-4 w-4" />
                Checklist operacional
              </div>
              <h1 className="text-3xl font-black md:text-4xl">Saúde do sistema</h1>
              <p className="mt-3 max-w-3xl text-zinc-300">
                Veja se o banco, o admin, o cache de rankings e as APIs oficiais estão prontos antes de divulgar ou sincronizar dados.
              </p>
            </div>

            <Button onClick={loadHealth} disabled={loading} className="bg-yellow-400 text-black hover:bg-yellow-300">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Atualizar diagnóstico
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-yellow-600" />
          </div>
        )}

        {!loading && error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-5 text-red-800">{error}</CardContent>
          </Card>
        )}

        {!loading && health && (
          <div className="space-y-8">
            <LaunchChecklist checklist={launchChecklist} readiness={readiness} onRefresh={loadHealth} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {overview.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.label}>
                    <CardContent className="flex items-center justify-between gap-4 p-5">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500">{item.label}</p>
                        <p className="mt-1 text-2xl font-black text-slate-950">{item.value}</p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <Icon className="h-6 w-6 text-yellow-700" />
                        <StatusPill status={item.status} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">Resumo rápido</h2>
                    <p className="mt-1 text-sm text-slate-700">
                      Última checagem: {formatDateTime(health.checkedAt)}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      Projeto Supabase: <strong>{health.config.projectRef || 'não identificado'}</strong>
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      Última linha de cache: <strong>{health.cache.latest ? `${health.cache.latest.nome} (${health.cache.latest.ano})` : 'sem dado'}</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {health.config.dashboardUrl && (
                      <a href={health.config.dashboardUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="border-yellow-300 bg-white">
                          Abrir Supabase
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    <Button asChild variant="outline" className="border-yellow-300 bg-white">
                      <Link to="/admin">Abrir admin</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">Última sincronização neste navegador</h2>
                    {health.sync?.latest ? (
                      <>
                        <p className="mt-2 text-sm text-slate-700">
                          Ano <strong>{health.sync.latest.year}</strong> · estado <strong>{health.sync.latest.status}</strong> ·
                          {' '}{formatCount(health.sync.latest.current)} de {formatCount(health.sync.latest.total)} processados.
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          Sucessos: {formatCount(health.sync.latest.success)} · falhas: {formatCount(health.sync.latest.failed)} · atualizado em {formatDateTime(health.sync.latest.updatedAt)}.
                        </p>
                        {health.sync.latest.error && <p className="mt-2 rounded-lg bg-red-50 p-3 text-xs text-red-800">{health.sync.latest.error}</p>}
                        {health.sync.latest.failures?.length > 0 && (
                          <p className="mt-2 text-xs text-slate-600">
                            Falhas recentes: {health.sync.latest.failures.slice(0, 6).map((item) => item.nome).join(', ')}.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">Nenhuma rodada foi registrada neste navegador.</p>
                    )}
                  </div>
                  <Button asChild variant="outline"><Link to="/admin">Retomar no admin</Link></Button>
                </div>
              </CardContent>
            </Card>

            {health.recommendations.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h2 className="text-lg font-black text-slate-950">O que fazer agora</h2>
                  <div className="mt-4 space-y-3">
                    {health.recommendations.map((recommendation) => (
                      <div key={recommendation} className="flex gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <section>
              <h2 className="mb-4 text-xl font-black text-slate-950">Serviços</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {health.services.map((check) => (
                  <ServiceCard key={check.id} check={check} />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950">Cache anual de rankings</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Para ranking nacional confiável, o FISCALIZA exige pelo menos 450 deputados sincronizados no ano.
                  </p>
                </div>
                <Button asChild className="bg-yellow-400 text-black hover:bg-yellow-300">
                  <Link to="/admin">Sincronizar no admin</Link>
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  {health.cache.years.map((item) => (
                    <CacheYearRow key={item.year} item={item} />
                  ))}
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-black text-slate-950">Tabelas do banco</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {health.tables.map((table) => (
                  <TableStatusCard key={table.name} table={table} />
                ))}
              </div>
            </section>

            <Card>
              <CardContent className="p-5 text-sm leading-relaxed text-slate-600">
                <h2 className="mb-2 text-lg font-black text-slate-950">Como ler esta página</h2>
                <p>
                  Esta tela não altera dados. Ela apenas testa leituras públicas, sessão admin salva no navegador e conexão com APIs oficiais.
                  Se o Supabase estiver pausado no plano gratuito, várias checagens aparecem como erro até você clicar em <strong>Resume project</strong> no painel do Supabase.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemHealthPage;
