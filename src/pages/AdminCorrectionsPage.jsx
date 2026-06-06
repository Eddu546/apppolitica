import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { BarChart3, CheckCircle2, Loader2, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  buildDeputyAnnualExpenseSummary,
  getLoggedAdminEmail,
  testAnnualSummaryWriteAccess,
  upsertDeputyYearSummary,
} from '@/services/annualSummaries';
import { getAllDeputadosList, getDeputadoDespesas } from '@/services/camara';
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

const AdminCorrectionsPage = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [session, setSession] = useState(() => getAdminSession());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('todos');
  const [syncYear, setSyncYear] = useState('2024');
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');
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
    const confirmed = window.confirm(
      `Sincronizar despesas de todos os deputados em ${syncYear}? Isso usa apenas APIs gratuitas, mas pode demorar alguns minutos.`
    );
    if (!confirmed) return;

    setSyncing(true);
    setSyncMessage('');
    setSyncError('');
    setSyncProgress({ current: 0, total: 0, success: 0, failed: 0 });

    try {
      setSyncMessage('Testando permissão de escrita no Supabase...');
      await testAnnualSummaryWriteAccess();
      setSyncMessage('Permissão confirmada. Buscando lista oficial de deputados...');

      const deputados = await getAllDeputadosList();
      setSyncProgress({ current: 0, total: deputados.length, success: 0, failed: 0 });
      setSyncMessage('Sincronização em andamento. Pode levar alguns minutos.');

      let success = 0;
      let failed = 0;
      let firstError = '';

      for (let index = 0; index < deputados.length; index += 1) {
        const deputado = deputados[index];
        try {
          const despesas = await getDeputadoDespesas(deputado.id, syncYear);
          const summary = buildDeputyAnnualExpenseSummary({ deputado, despesas, ano: syncYear });
          await upsertDeputyYearSummary(summary);
          success += 1;
        } catch (error) {
          console.error('Erro ao sincronizar deputado:', deputado.nome, error);
          if (!firstError) firstError = `${deputado.nome}: ${error.message}`;
          failed += 1;
        }

        setSyncProgress({ current: index + 1, total: deputados.length, success, failed });
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      setSyncMessage(`Sincronização concluída: ${success} resumos salvos, ${failed} falhas.`);
      if (firstError) {
        setSyncError(`Primeiro erro encontrado: ${firstError}`);
      }
    } catch (error) {
      console.error('Erro na sincronização anual:', error);
      setSyncMessage('');
      setSyncError(error.message || 'Não foi possível iniciar a sincronização. Confira Supabase, login admin e APIs oficiais.');
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
                    Sincroniza despesas anuais da Câmara para o Supabase. Depois disso, os perfis conseguem mostrar média nacional, média estadual e ranking com base real.
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
                  {['2023', '2024', '2025', '2026'].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <Button onClick={syncAnnualSummaries} disabled={syncing}>
                  {syncing ? 'Sincronizando...' : 'Sincronizar ano'}
                </Button>
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
                  </>
                )}
                {syncMessage && <p className="mt-3">{syncMessage}</p>}
                {syncError && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                    {syncError}
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
