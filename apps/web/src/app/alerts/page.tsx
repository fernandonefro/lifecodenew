'use client';

import React, { useCallback, useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

type Alert = {
  id: string;
  severity: string;
  status: string;
  title: string;
  message: string;
  patientName: string;
  glucoseValue: number | null;
  unit: string;
  dueDate: string;
};

const SEVERITY_LABEL: Record<string, string> = {
  P0: 'P0 - EMERGÊNCIA',
  P1: 'P1 - ALTO RISCO',
  P2: 'P2 - LACUNA DE CUIDADO',
  P3: 'P3 - ACOMPANHAMENTO',
};

const DISPOSITIONS = [
  { value: 'PATIENT_CONTACTED_STABLE', label: 'Paciente contatado — estável' },
  { value: 'EMERGENCY_SERVICES_DISPATCHED', label: 'Serviço de emergência acionado' },
  { value: 'ESCALATED_TO_PHYSICIAN', label: 'Escalado ao médico' },
  { value: 'FALSE_ALARM', label: 'Alarme falso' },
  { value: 'OTHER', label: 'Outro' },
];

export default function AlertsQueuePage() {
  const [token, setToken] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('lifecode_token'));
    setTenantId(localStorage.getItem('lifecode_tenant'));
  }, []);

  if (!token || !tenantId) {
    return <LoginForm onAuth={(t, tn) => { setToken(t); setTenantId(tn); }} />;
  }
  return <Queue token={token} tenantId={tenantId} onLogout={() => {
    localStorage.removeItem('lifecode_token');
    localStorage.removeItem('lifecode_tenant');
    setToken(null);
  }} />;
}

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
        <h1 className="text-2xl font-black text-slate-900 mb-1">Portal Clínico Lifecode</h1>
        <p className="text-slate-500 text-sm mb-6">Fila de atendimento de alertas</p>
        {error && <div className="mb-4 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tenant ID</label>
        <input value={tenantId} onChange={(e) => setTenantId(e.target.value)} required
          placeholder="UUID da operadora"
          className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg text-slate-900" />
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
          className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg text-slate-900" />
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
          className="w-full mb-6 px-3 py-2 border border-slate-300 rounded-lg text-slate-900" />
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg disabled:opacity-50">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

function Queue({ token, tenantId, onLogout }: { token: string; tenantId: string; onLogout: () => void }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Alert | null>(null); // alerta no modal

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${token}`, 'X-Tenant-ID': tenantId, 'Content-Type': 'application/json' }),
    [token, tenantId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/alerts`, { headers: authHeaders() });
      if (res.status === 401) return onLogout();
      setAlerts(await res.json());
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, onLogout]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Fila de Alertas Clínicos</h1>
          <p className="text-slate-600 mt-1">Alertas ativos ordenados por urgência (P0 no topo).</p>
        </div>
        <button onClick={onLogout} className="text-sm text-slate-500 hover:text-slate-800">Sair</button>
      </div>

      {loading ? (
        <div className="text-slate-500 font-medium">Carregando fila...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Severidade</th>
                <th className="px-5 py-3">Paciente</th>
                <th className="px-5 py-3">Glicemia</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Nenhum alerta ativo na fila.</td></tr>
              )}
              {alerts.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${a.severity === 'P0' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {SEVERITY_LABEL[a.severity] || a.severity}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{a.patientName}</td>
                  <td className="px-5 py-4 text-slate-900 font-bold">
                    {a.glucoseValue != null ? `${a.glucoseValue} ${a.unit}` : '—'}
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-sm">{a.status}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => setActive(a)}
                      className="bg-slate-900 hover:bg-black text-white text-sm font-bold px-4 py-2 rounded-lg">
                      Assumir Caso
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active && (
        <AlertModal alert={active} authHeaders={authHeaders} onClose={() => setActive(null)}
          onResolved={() => { setActive(null); load(); }} />
      )}
    </div>
  );
}

function AlertModal({
  alert, authHeaders, onClose, onResolved,
}: {
  alert: Alert;
  authHeaders: () => Record<string, string>;
  onClose: () => void;
  onResolved: () => void;
}) {
  const [assumed, setAssumed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [disposition, setDisposition] = useState(DISPOSITIONS[0].value);
  const [notes, setNotes] = useState('');

  async function assume() {
    setError(''); setBusy(true);
    try {
      const res = await fetch(`${API}/alerts/${alert.id}/assume`, { method: 'PATCH', headers: authHeaders() });
      if (res.status === 409) {
        setError('Alerta já está sendo tratado por outro profissional');
        return;
      }
      if (!res.ok) throw new Error('Não foi possível assumir o alerta.');
      setAssumed(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function resolve() {
    setError(''); setBusy(true);
    try {
      const res = await fetch(`${API}/alerts/${alert.id}/resolve`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ disposition, notes }),
      });
      if (!res.ok) throw new Error('Não foi possível fechar o alerta.');
      onResolved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <h2 className="text-xl font-black text-slate-900 mb-1">Atendimento de Alerta Clínico</h2>
        <p className="text-slate-500 text-sm mb-5">{SEVERITY_LABEL[alert.severity] || alert.severity}</p>

        <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-200">
          <p className="text-sm text-slate-600">Paciente</p>
          <p className="font-bold text-slate-900">{alert.patientName}</p>
          <p className="text-sm text-slate-600 mt-2">Glicemia registrada</p>
          <p className="font-black text-2xl text-red-600">
            {alert.glucoseValue != null ? `${alert.glucoseValue} ${alert.unit}` : '—'}
          </p>
          <p className="text-sm text-slate-600 mt-2">{alert.message}</p>
        </div>

        {error && <div className="mb-4 text-sm font-bold text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

        {!assumed ? (
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 border border-slate-300 text-slate-700 font-bold py-2.5 rounded-lg">
              Fechar
            </button>
            <button onClick={assume} disabled={busy}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg disabled:opacity-50">
              Assumir este Alerta Agora
            </button>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Conduta clínica</label>
            <select value={disposition} onChange={(e) => setDisposition(e.target.value)}
              className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg text-slate-900">
              {DISPOSITIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas do atendimento</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full mb-5 px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
              placeholder="Descreva a conduta realizada..." />
            <button onClick={resolve} disabled={busy}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg disabled:opacity-50">
              Concluir Atendimento e Fechar Alerta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
