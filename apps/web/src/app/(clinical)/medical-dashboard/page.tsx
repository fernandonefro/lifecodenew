'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  DashboardModel,
  Severity,
  SEVERITY_META,
  canAccessDashboard,
  decodeJwtRole,
  isEmptyDashboard,
  normalizeDashboard,
} from '@/lib/clinicalDashboard';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

type ViewState = 'loading' | 'ready' | 'empty' | 'error' | 'denied';

export default function MedicalDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem('lifecode_token'));
    setTenantId(localStorage.getItem('lifecode_tenant'));
    setReady(true);
  }, []);

  if (!ready) return null; // evita flash antes de ler o localStorage

  if (!token || !tenantId) {
    return (
      <LoginForm
        onAuth={(t, tn) => {
          setToken(t);
          setTenantId(tn);
        }}
      />
    );
  }

  return (
    <Dashboard
      token={token}
      tenantId={tenantId}
      onLogout={() => {
        localStorage.removeItem('lifecode_token');
        localStorage.removeItem('lifecode_tenant');
        setToken(null);
      }}
    />
  );
}

function Dashboard({
  token,
  tenantId,
  onLogout,
}: {
  token: string;
  tenantId: string;
  onLogout: () => void;
}) {
  const role = decodeJwtRole(token);
  const allowed = canAccessDashboard(role);

  const [state, setState] = useState<ViewState>(allowed ? 'loading' : 'denied');
  const [model, setModel] = useState<DashboardModel | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch(`${API}/analytics/clinical-dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json',
        },
      });
      if (res.status === 401) return onLogout();
      if (res.status === 403) return setState('denied');
      if (!res.ok) return setState('error');
      const data = normalizeDashboard(await res.json());
      setModel(data);
      setState(isEmptyDashboard(data) ? 'empty' : 'ready');
    } catch {
      setState('error');
    }
  }, [token, tenantId, onLogout]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Dashboard Médico</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Visão operacional da carteira — leitura rápida e priorização.
            </p>
          </div>
          <button onClick={onLogout} className="text-sm font-semibold text-slate-500 hover:text-slate-900">
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {state === 'denied' && <DeniedState role={role} />}
        {state === 'loading' && <LoadingState />}
        {state === 'error' && <ErrorState onRetry={load} />}
        {state === 'empty' && <EmptyState onRefresh={load} />}
        {state === 'ready' && model && <DashboardContent model={model} onRefresh={load} />}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conteúdo (estado "ready")
// ---------------------------------------------------------------------------

function DashboardContent({ model, onRefresh }: { model: DashboardModel; onRefresh: () => void }) {
  const { alerts, careGaps, activity } = model;
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500" data-testid="generated-at">
          {model.generatedAt ? `Atualizado em ${new Date(model.generatedAt).toLocaleString('pt-BR')}` : 'Atualizado agora'}
        </p>
        <button
          onClick={onRefresh}
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          Atualizar
        </button>
      </div>

      {/* Linha de KPIs principais */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Pacientes na carteira" value={model.totalPatients} testId="kpi-patients" />
        <Kpi
          label="Alertas ativos"
          value={alerts.active}
          testId="kpi-alerts-active"
          tone={alerts.active > 0 ? 'warn' : 'neutral'}
        />
        <Kpi
          label="Alertas vencidos"
          value={alerts.overdue}
          testId="kpi-alerts-overdue"
          tone={alerts.overdue > 0 ? 'danger' : 'neutral'}
          hint="Prazo (SLA) já expirado"
        />
        <Kpi
          label="Leituras (7 dias)"
          value={activity.observationsLast7Days}
          testId="kpi-activity"
        />
      </section>

      {/* Estado da fila + severidade */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Fila de alertas" subtitle="Estado atual dos alertas da carteira">
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Abertos" value={alerts.open} testId="stat-open" />
            <MiniStat label="Em andamento" value={alerts.inProgress} testId="stat-inprogress" />
            <MiniStat label="Resolvidos" value={alerts.resolved} testId="stat-resolved" />
          </div>
        </Panel>

        <Panel title="Distribuição por gravidade" subtitle="Somente alertas ativos (não resolvidos)">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['P0', 'P1', 'P2', 'P3'] as Severity[]).map((s) => (
              <SeverityStat key={s} severity={s} value={alerts.bySeverity[s]} />
            ))}
          </div>
        </Panel>
      </section>

      {/* Lacunas de cuidado */}
      <section>
        <Panel title="Lacunas de cuidado" subtitle="Exames e consultas por situação">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniStat
              label="Vencidas"
              value={careGaps.overdue}
              testId="gap-overdue"
              tone={careGaps.overdue > 0 ? 'danger' : 'neutral'}
            />
            <MiniStat label="Agendadas" value={careGaps.scheduled} testId="gap-scheduled" />
            <MiniStat label="Encerradas" value={careGaps.closed} testId="gap-closed" />
          </div>
        </Panel>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Blocos visuais
// ---------------------------------------------------------------------------

function Kpi({
  label,
  value,
  hint,
  testId,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  hint?: string;
  testId?: string;
  tone?: 'neutral' | 'warn' | 'danger';
}) {
  const toneCls =
    tone === 'danger'
      ? 'border-red-200 bg-red-50'
      : tone === 'warn'
      ? 'border-amber-200 bg-amber-50'
      : 'border-slate-200 bg-white';
  const numCls =
    tone === 'danger' ? 'text-red-700' : tone === 'warn' ? 'text-amber-700' : 'text-slate-900';
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneCls}`} data-testid={testId}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-4xl font-black tabular-nums ${numCls}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function MiniStat({
  label,
  value,
  testId,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  testId?: string;
  tone?: 'neutral' | 'danger';
}) {
  const numCls = tone === 'danger' && value > 0 ? 'text-red-700' : 'text-slate-900';
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center" data-testid={testId}>
      <p className={`text-3xl font-black tabular-nums ${numCls}`}>{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function SeverityStat({ severity, value }: { severity: Severity; value: number }) {
  const meta = SEVERITY_META[severity];
  const emphasized = meta.emphasis && value > 0;
  const cls = emphasized
    ? severity === 'P0'
      ? 'border-red-300 bg-red-50 text-red-800'
      : 'border-amber-300 bg-amber-50 text-amber-800'
    : 'border-slate-100 bg-slate-50 text-slate-700';
  return (
    <div className={`rounded-xl border p-4 text-center ${cls}`} data-testid={`sev-${severity}`}>
      <p className="text-3xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide">{meta.short}</p>
      <p className="text-[10px] text-slate-500 leading-tight">{meta.label.split('—')[1]?.trim()}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Estados
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="animate-pulse space-y-6" data-testid="state-loading">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="h-40 rounded-2xl bg-slate-200" />
      <span className="sr-only">Carregando indicadores…</span>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
      data-testid="state-error"
    >
      <h2 className="text-lg font-bold text-red-800">Não foi possível carregar os indicadores</h2>
      <p className="mt-1 text-sm text-red-700">
        Houve uma falha ao consultar o servidor. Verifique a conexão e tente novamente.
      </p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white p-10 text-center"
      data-testid="state-empty"
    >
      <h2 className="text-lg font-bold text-slate-800">Nenhum dado operacional ainda</h2>
      <p className="mt-1 text-sm text-slate-500">
        Não há pacientes, alertas ou lacunas de cuidado registrados para esta operadora.
      </p>
      <button
        onClick={onRefresh}
        className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
      >
        Atualizar
      </button>
    </div>
  );
}

function DeniedState({ role }: { role: string | null }) {
  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white p-10 text-center"
      data-testid="state-denied"
    >
      <h2 className="text-lg font-bold text-slate-800">Acesso negado</h2>
      <p className="mt-1 text-sm text-slate-500">
        Seu perfil{role ? ` (${role})` : ''} não tem permissão para o Dashboard Médico. Este
        painel é restrito às equipes clínica e de navegação.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login (mesmo padrão dos demais portais)
// ---------------------------------------------------------------------------

function LoginForm({ onAuth }: { onAuth: (token: string, tenantId: string) => void }) {
  const [tenantId, setTenantId] = useState('');
  const [email, setEmail] = useState('navegador@demo.lifecode.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, email, password }),
      });
      if (!res.ok) throw new Error('Credenciais inválidas ou Tenant incorreto.');
      const data = await res.json();
      localStorage.setItem('lifecode_token', data.accessToken);
      localStorage.setItem('lifecode_tenant', tenantId);
      onAuth(data.accessToken, tenantId);
    } catch (err: any) {
      setError(err.message || 'Falha no login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <form onSubmit={submit} className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
        <h1 className="text-2xl font-black text-slate-900 mb-1">Dashboard Médico</h1>
        <p className="text-slate-500 text-sm mb-6">Acesso das equipes clínica e de navegação</p>
        {error && <div className="mb-4 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tenant ID</label>
        <input
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          required
          placeholder="UUID da operadora"
          className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
        />
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
        />
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-6 px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
