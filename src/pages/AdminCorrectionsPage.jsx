import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, CheckCircle2, Loader2, LogOut, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  buildDeputyAnnualExpenseSummary,
  fetchDeputyYearSummaries,
  getLoggedAdminEmail,
  testAnnualSummaryWriteAccess,
  upsertDeputyYearSummary,
} from '@/services/annualSummaries';
import { getAllDeputadosList, getDeputadoDespesas } from '@/services/camara';
import {
  fetchDeputadoPortalYearSummaries,
  upsertDeputadoPortalResumoCache,
} from '@/services/camaraPortal';
import { DEFAULT_LEGISLATIVE_YEAR, LEGISLATIVE_YEARS } from '@/lib/legislative-years';
import {
  fetchCorrections,
  getAdminSession,
  isCorrectionsDatabaseConfigured,
  publishValidatedMetric,
  signInAdmin,
  signOutAdmin,
  updateCorrectionStatus,
} from '@/services/corrections';

const statusLabels = {
  pendente: 'Pendente',
  em_analise: 'Em análise',
  validado: 'Validado',
  recusado: 'Recusado',
};

const DEFAULT_SYNC_PROGRESS = { current: 0, total: 0, success: 0, failed: 0, skipped: 0 };

const getFailureStorageKey = (year) => `fiscaliza_sync_failures_${year}`;
const getRunStorageKey = (year) => `fiscaliza_sync_run_${year}`;

const readStoredSyncFailures = (year) => {
  if (typeof window === 'undefined') return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(getFailureStorageKey(year)) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveStoredSyncFailures = (year, failures) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getFailureStorageKey(year), JSON.stringify(failures));
};

const clearStoredSyncFailures = (year) => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(getFailureStorageKey(year));
};

const readStoredSyncRun = (year) => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(getRunStorageKey(year)) || 'null');
  } catch {
    return null;
  }
};

const saveStoredSyncRun = (year, payload) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getRunStorageKey(year), JSON.stringify({
    year,
    updatedAt: new Date().toISOString(),
    ...payload,
  }));
};

const getSyncModeLabel = (mode) => {
  if (mode === 'all') return 'Reprocessar tudo';
  if (mode === 'failed') return 'Tentar falhas';
  return 'Apenas faltantes';
};

const getSyncButtonLabel = (mode) => {
  if (mode === 'all') return 'Reprocessar ano';
  if (mode === 'failed') return 'Tentar falhas';
  return 'Sincronizar faltantes';
};

const getSyncConfirmationMessage = ({ mode, year, failureCount }) => {
  if (mode === 'all') {
    return `Reprocessar todos os deputados em ${year}? Isso atualiza ou sobrescreve os resumos já salvos e pode demorar alguns minutos.`;
  }

  if (mode === 'failed') {
    return `Tentar novamente ${failureCount} falha(s) do ano ${year}? Deputados já salvos fora dessa lista não serão reprocessados.`;
  }

  return `Sincronizar apenas deputados faltantes em ${year}? O FISCALIZA vai pular quem já está salvo no Supabase.`;
};

const AdminCorrectionsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [session, setSession] = useState(() => getAdminSession());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('todos');
  const [syncYear, setSyncYear] = useState(DEFAULT_LEGISLATIVE_YEAR);
  const [syncMode, setSyncMode] = useState('missing');
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(DEFAULT_SYNC_PROGRESS);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');
  const [savedSummaryCount, setSavedSummaryCount] = useState(null);
  const [savedPortalSummaryCount, setSavedPortalSummaryCount] = useState(null);
  const [lastFailures, setLastFailures] = useState(() => readStoredSyncFailures(DEFAULT_LEGISLATIVE_YEAR));
  const adminEmail = getLoggedAdminEmail();

  const loadCorrections = async () => {
    setLoading(true);
    setMessage('');
    try {
      const result = await fetchCorrections();
      if (result.ok) {
        setItems(result.data);
      } else {
        setMessage('Configure o Supabase antes de carregar a fila.');
      }
    } catch (error) {
      console.error('Erro ao carregar correções:', error);
      setMessage('Não foi possível ler a tabela correções. Confira as políticas RLS no Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) loadCorrections();
  }, [session]);

  useEffect(() => {
    setLastFailures(readStoredSyncFailures(syncYear));
    if (!session) return;

    let ignore = false;
    setSavedSummaryCount(null);
    setSavedPortalSummaryCount(null);

    Promise.all([
      fetchDeputyYearSummaries(syncYear).catch(() => ({ data: [] })),
      fetchDeputadoPortalYearSummaries(syncYear).catch(() => ({ data: [] })),
    ])
      .then(([expenseResult, portalResult]) => {
        if (ignore) return;
        setSavedSummaryCount(expenseResult.data?.length ?? 0);
        setSavedPortalSummaryCount(portalResult.data?.length ?? 0);
      })
      .catch(() => {
        if (ignore) return;
        setSavedSummaryCount(null);
        setSavedPortalSummaryCount(null);
      });

    return () => {
      ignore = true;
    };
  }, [session, syncYear]);

  useEffect(() => {
    const interruptedRun = readStoredSyncRun(syncYear);
    if (interruptedRun?.status === 'running') {
      setSyncMessage(
        `A última rodada foi interrompida em ${interruptedRun.current || 0} de ${interruptedRun.total || 0}. Use “Apenas faltantes” para continuar a partir dos resumos que chegaram ao Supabase.`
      );
      setSyncProgress({
        ...DEFAULT_SYNC_PROGRESS,
        current: Number(interruptedRun.current || 0),
        total: Number(interruptedRun.total || 0),
        success: Number(interruptedRun.success || 0),
        failed: Number(interruptedRun.failed || 0),
      });
    }
  }, [syncYear]);

  useEffect(() => {
    if (!syncing) return undefined;
    const warnBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [syncing]);

  const filteredItems = useMemo(() => {
    if (filter === 'todos') return items;
    return items.filter((item) => item.status === filter);
  }, [items, filter]);

  const login = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await signInAdmin(credentials);
      if (result.ok) {
        setSession(result.session);
        setCredentials({ email: '', password: '' });
        if (location.state?.from) navigate(location.state.from, { replace: true });
      }
      setMessage('');
    } catch (error) {
      console.error('Erro no login admin:', error);
      setMessage('Login falhou. Confira e-mail, senha e configuração do Supabase Auth.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOutAdmin();
    setSession(null);
    setItems([]);
  };

  const changeStatus = async (item, status) => {
    setMessage('');
    try {
      await updateCorrectionStatus(item.id, {
        status,
        observacao_publica: item.observacao_publica,
        observacao_interna: item.observacao_interna,
      });
      await loadCorrections();
      setMessage('Status atualizado.');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setMessage('Não foi possível atualizar. Confira as políticas RLS.');
    }
  };

  const validateAndPublish = async (item) => {
    setMessage('');
    try {
      await publishValidatedMetric(item);
      await loadCorrections();
      setMessage('Dado validado e publicado na área pública.');
    } catch (error) {
      console.error('Erro ao publicar métrica validada:', error);
      setMessage('Não foi possível publicar. Confira se a tabela metricas_validadas e as políticas RLS foram criadas.');
    }
  };

  const syncAnnualSummaries = async () => {
    const storedFailures = readStoredSyncFailures(syncYear);
    if (syncMode === 'failed' && storedFailures.length === 0) {
      setSyncError('Não há falhas salvas para tentar novamente neste ano.');
      return;
    }

    const confirmed = window.confirm(
      getSyncConfirmationMessage({ mode: syncMode, year: syncYear, failureCount: storedFailures.length })
    );
    if (!confirmed) return;

    setSyncing(true);
    setSyncMessage('');
    setSyncError('');
    setSyncProgress(DEFAULT_SYNC_PROGRESS);

    try {
      setSyncMessage('Testando permissão de escrita no Supabase...');
      await testAnnualSummaryWriteAccess();
      setSyncMessage('Permissão confirmada. Buscando lista oficial de deputados...');

      const deputados = await getAllDeputadosList();
      const [existingResult, existingPortalResult] = await Promise.all([
        fetchDeputyYearSummaries(syncYear).catch(() => ({ data: [] })),
        fetchDeputadoPortalYearSummaries(syncYear).catch(() => ({ data: [] })),
      ]);
      const savedIds = new Set((existingResult.data || []).map((summary) => String(summary.deputado_id)));
      const savedPortalIds = new Set(
        (existingPortalResult.data || []).map((summary) => String(summary.deputado_id ?? summary.deputadoId))
      );
      const failedIds = new Set(storedFailures.map((failure) => String(failure.id)));
      const targetDeputies = deputados.filter((deputado) => {
        const deputyId = String(deputado.id || deputado?.ultimoStatus?.id || '');
        if (syncMode === 'all') return true;
        if (syncMode === 'failed') return failedIds.has(deputyId);
        return !savedIds.has(deputyId) || !savedPortalIds.has(deputyId);
      });
      const skipped = syncMode === 'missing' ? deputados.length - targetDeputies.length : 0;

      setSavedSummaryCount(savedIds.size);
      setSavedPortalSummaryCount(savedPortalIds.size);
      setSyncProgress({ ...DEFAULT_SYNC_PROGRESS, total: targetDeputies.length, skipped });
      saveStoredSyncRun(syncYear, {
        status: 'running',
        mode: syncMode,
        current: 0,
        total: targetDeputies.length,
        success: 0,
        failed: 0,
        failures: [],
      });

      if (targetDeputies.length === 0) {
        saveStoredSyncRun(syncYear, {
          status: 'completed',
          mode: syncMode,
          current: 0,
          total: 0,
          success: 0,
          failed: 0,
          skipped,
          completedAt: new Date().toISOString(),
        });
        setSyncMessage(
          syncMode === 'failed'
            ? 'Nenhum deputado da lista de falhas foi encontrado na lista oficial atual.'
            : 'Nada a sincronizar: todos os deputados encontrados já têm resumo salvo para este ano.'
        );
        clearStoredSyncFailures(syncYear);
        setLastFailures([]);
        return;
      }

      setSyncMessage(
        `Sincronização em andamento no modo "${getSyncModeLabel(syncMode)}". Pode levar alguns minutos.`
      );

      let success = 0;
      let failed = 0;
      let portalSuccess = 0;
      let portalFailed = 0;
      let firstError = '';
      let firstPortalError = '';
      let portalCacheDisabledReason = '';
      const failures = [];

      for (let index = 0; index < targetDeputies.length; index += 1) {
        const deputado = targetDeputies[index];
        const deputyId = String(deputado.id || deputado?.ultimoStatus?.id || '');
        const needsExpenseSummary = syncMode !== 'missing' || !savedIds.has(deputyId);
        const needsPortalSummary = syncMode !== 'missing' || !savedPortalIds.has(deputyId);
        let expenseReady = !needsExpenseSummary;
        let portalReady = !needsPortalSummary;

        try {
          if (needsExpenseSummary) {
            const despesas = await getDeputadoDespesas(deputado.id, syncYear);
            const summary = buildDeputyAnnualExpenseSummary({ deputado, despesas, ano: syncYear });
            await upsertDeputyYearSummary(summary);
            expenseReady = true;
          }

          if (needsPortalSummary && !portalCacheDisabledReason) {
            try {
              const portalResult = await upsertDeputadoPortalResumoCache({ deputado, ano: syncYear });
              if (!portalResult?.ok) {
                throw new Error(portalResult?.reason || 'Cache do portal nao confirmado.');
              }
              portalReady = true;
              portalSuccess += 1;
            } catch (portalError) {
              console.warn('Resumo do portal nao foi salvo:', deputado.nome, portalError);
              portalFailed += 1;
              if (!firstPortalError) firstPortalError = `${deputado.nome}: ${portalError.message}`;

              const normalizedPortalError = String(portalError.message || '').toLowerCase();
              const isSchemaOrPermissionError =
                (normalizedPortalError.includes('relation') && normalizedPortalError.includes('does not exist')) ||
                normalizedPortalError.includes('row-level security') ||
                normalizedPortalError.includes('permission denied') ||
                normalizedPortalError.includes('missing-config');

              if (isSchemaOrPermissionError) {
                portalCacheDisabledReason = portalError.message || 'Cache do portal indisponivel.';
              } else {
                throw portalError;
              }
            }
          }
          if (expenseReady && portalReady) success += 1;
        } catch (error) {
          console.error('Erro ao sincronizar deputado:', deputado.nome, error);
          if (!firstError) firstError = `${deputado.nome}: ${error.message}`;
          failures.push({
            id: String(deputado.id || deputado?.ultimoStatus?.id || ''),
            nome: deputado.nome || deputado?.ultimoStatus?.nomeEleitoral || 'Deputado sem nome',
            partido: deputado.siglaPartido || deputado?.ultimoStatus?.siglaPartido || '',
            uf: deputado.siglaUf || deputado?.ultimoStatus?.siglaUf || '',
            error: error.message || 'Falha desconhecida',
            failedAt: new Date().toISOString(),
          });
          failed += 1;
        }

        const progress = { current: index + 1, total: targetDeputies.length, success, failed, skipped };
        setSyncProgress(progress);
        saveStoredSyncRun(syncYear, {
          status: 'running',
          mode: syncMode,
          ...progress,
          currentDeputy: deputado.nome,
          failures: failures.slice(-20),
        });
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      if (failures.length > 0) {
        saveStoredSyncFailures(syncYear, failures);
        setLastFailures(failures);
      } else {
        clearStoredSyncFailures(syncYear);
        setLastFailures([]);
      }

      const [refreshedExpenses, refreshedPortal] = await Promise.all([
        fetchDeputyYearSummaries(syncYear).catch(() => ({ data: [] })),
        fetchDeputadoPortalYearSummaries(syncYear).catch(() => ({ data: [] })),
      ]);
      setSavedSummaryCount(refreshedExpenses.data?.length ?? null);
      setSavedPortalSummaryCount(refreshedPortal.data?.length ?? null);
      setSyncMessage(
        `Sincronização concluída: ${success} deputados ficaram com gastos e resumo do portal completos, ${portalSuccess} resumos do portal atualizados, ${failed} falhas${
          skipped ? `, ${skipped} já estavam salvos e foram pulados` : ''
        }.`
      );
      saveStoredSyncRun(syncYear, {
        status: failed ? 'completed_with_errors' : 'completed',
        mode: syncMode,
        current: targetDeputies.length,
        total: targetDeputies.length,
        success,
        failed,
        skipped,
        failures: failures.slice(-20),
        completedAt: new Date().toISOString(),
      });
      if (portalCacheDisabledReason) {
        setSyncMessage((message) =>
          message.replace(/\.$/, ', cache do portal pulado ate atualizar o Supabase.')
        );
      }
      if (firstError) {
        setSyncError(`Primeiro erro encontrado: ${firstError}`);
      } else if (firstPortalError) {
        setSyncError(
          `Os gastos foram sincronizados, mas o cache do portal ${portalCacheDisabledReason ? 'foi pausado automaticamente' : `teve ${portalFailed} falha(s)`}. Primeiro erro: ${firstPortalError}. Rode o schema.sql atualizado no Supabase quando puder.`
        );
      }
    } catch (error) {
      console.error('Erro na sincronização anual:', error);
      setSyncMessage('');
      setSyncError(error.message || 'Não foi possível iniciar a sincronização. Confira Supabase, login admin e APIs oficiais.');
      saveStoredSyncRun(syncYear, {
        status: 'failed',
        mode: syncMode,
        ...syncProgress,
        error: error.message || 'Falha desconhecida',
      });
    } finally {
      setSyncing(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Helmet><title>Admin - FISCALIZA</title></Helmet>
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <ShieldCheck className="w-10 h-10 text-blue-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Painel de revisão</h1>
            <p className="text-sm text-gray-600 mb-5">
              Entre com um usuário criado no Supabase Auth para revisar correções enviadas.
            </p>
            <form onSubmit={login} className="space-y-4">
              <input
                type="email"
                value={credentials.email}
                onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
                placeholder="E-mail"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <input
                type="password"
                value={credentials.password}
                onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                placeholder="Senha"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            {message && <p className="mt-4 text-sm text-red-600">{message}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Helmet><title>Admin Correções - FISCALIZA</title></Helmet>
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Fila de correções</h1>
              <p className="text-gray-600 mt-1">Revise evidências antes de publicar qualquer dado validado.</p>
            </div>
            <Button variant="outline" onClick={loadCorrections}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>

          {!isCorrectionsDatabaseConfigured && (
            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              Supabase não configurado no .env.local.
            </div>
          )}
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            Ao validar, o dado é publicado na página pública de métricas validadas, sempre com a fonte informada.
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/saude"><Activity className="mr-2 h-4 w-4" /> Saúde do sistema</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/auditoria-dados"><Activity className="mr-2 h-4 w-4" /> Auditar KPIs</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/dados-validados"><CheckCircle2 className="mr-2 h-4 w-4" /> Dados validados</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/corrigir"><Send className="mr-2 h-4 w-4" /> Enviar correção</Link></Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-2 mb-5">
          {['todos', 'pendente', 'em_analise', 'validado', 'recusado'].map((status) => (
            <Button key={status} variant={filter === status ? 'default' : 'outline'} size="sm" onClick={() => setFilter(status)}>
              {status === 'todos' ? 'Todos' : statusLabels[status]}
            </Button>
          ))}
        </div>

        {message && (
          <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            {message}
          </div>
        )}

        <Card className="mb-6 border-blue-100">
          <CardContent className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <BarChart3 className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Cache gratuito de rankings</h2>
                  <p className="text-sm text-gray-600 max-w-3xl">
                    Sincroniza despesas anuais e o resumo oficial do portal da Câmara para o Supabase. Depois disso, rankings e perfis carregam mais rápido e fazem menos chamadas diretas à Câmara.
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    E-mail logado no painel: <strong>{adminEmail || 'não identificado'}</strong>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <select
                  value={syncYear}
                  onChange={(event) => setSyncYear(event.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  disabled={syncing}
                >
              {LEGISLATIVE_YEARS.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <select
                  value={syncMode}
                  onChange={(event) => setSyncMode(event.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  disabled={syncing}
                >
                  <option value="missing">Apenas faltantes</option>
                  <option value="failed">Tentar falhas</option>
                  <option value="all">Reprocessar tudo</option>
                </select>
                <Button onClick={syncAnnualSummaries} disabled={syncing || (syncMode === 'failed' && lastFailures.length === 0)}>
                  {syncing ? 'Sincronizando...' : getSyncButtonLabel(syncMode)}
                </Button>
                {lastFailures.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      clearStoredSyncFailures(syncYear);
                      setLastFailures([]);
                      if (syncMode === 'failed') setSyncMode('missing');
                    }}
                    disabled={syncing}
                  >
                    Limpar falhas
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase text-gray-500">Resumos de gastos</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {savedSummaryCount === null ? 'Consultando...' : savedSummaryCount}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase text-gray-500">Resumos para a nota</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {savedPortalSummaryCount === null ? 'Consultando...' : savedPortalSummaryCount}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase text-gray-500">Falhas guardadas</p>
                <p className="mt-1 text-lg font-bold text-gray-900">{lastFailures.length}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase text-gray-500">Modo recomendado</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  Apenas faltantes, para economizar chamadas e tempo.
                </p>
              </div>
            </div>

            {(syncing || syncProgress.total > 0 || syncMessage || syncError) && (
              <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700">
                {syncProgress.total > 0 && (
                  <>
                    <div className="flex justify-between mb-2">
                      <span>{syncProgress.current} de {syncProgress.total} deputados</span>
                      <span>{syncProgress.success} salvos / {syncProgress.failed} falhas</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${Math.round((syncProgress.current / syncProgress.total) * 100)}%` }}
                      />
                    </div>
                    {syncProgress.skipped > 0 && (
                      <p className="mt-2 text-xs text-gray-500">
                        {syncProgress.skipped} deputados já estavam salvos e foram pulados nesta rodada.
                      </p>
                    )}
                  </>
                )}
                {syncMessage && <p className="mt-3">{syncMessage}</p>}
                {syncError && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                    {syncError}
                  </div>
                )}
                {lastFailures.length > 0 && !syncing && (
                  <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-yellow-900">
                    <p className="font-semibold">Falhas salvas para retentativa:</p>
                    <p className="mt-1 text-xs">
                      {lastFailures.slice(0, 6).map((failure) => failure.nome).join(', ')}
                      {lastFailures.length > 6 ? ` e mais ${lastFailures.length - 6}` : ''}.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900">{item.parlamentar}</h2>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{item.cargo}</span>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{statusLabels[item.status]}</span>
                      </div>
                      <p className="text-sm text-gray-700"><strong>Métrica:</strong> {item.metrica} / {item.ano}</p>
                      <p className="text-sm text-gray-700"><strong>Valor informado:</strong> {item.valor_informado}</p>
                      <p className="text-sm text-gray-700"><strong>Contato:</strong> {item.nome} ({item.email})</p>
                      <a className="text-sm text-blue-600 hover:underline break-all" href={item.fonte_url} target="_blank" rel="noopener noreferrer">
                        {item.fonte_url}
                      </a>
                      {item.observacoes && <p className="text-sm text-gray-600">{item.observacoes}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Button size="sm" variant="outline" onClick={() => changeStatus(item, 'em_analise')}>Em análise</Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => validateAndPublish(item)}
                        disabled={item.status === 'validado'}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Validar e publicar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => changeStatus(item, 'recusado')}>Recusar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredItems.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
                Nenhuma correção encontrada para este filtro.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCorrectionsPage;
