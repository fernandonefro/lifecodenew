'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { API_BASE, getAuthHeaders, isAuthed, logout, LoginForm } from '../../../lib/portalAuth';

const GAP_LABEL: Record<string, string> = {
  HBA1C_OVERDUE: 'Hemoglobina Glicada (HbA1c) Vencida',
  EGFR_OVERDUE: 'Rastreio de Doença Renal Pendente (eGFR/RAC)',
  RETINA_EXAM_OVERDUE: 'Exame de Fundo de Olho Vencido',
  FOOT_EXAM_OVERDUE: 'Exame dos Pés Vencido',
  PHYSICIAN_VISIT_OVERDUE: 'Consulta Periódica em Atraso',
};

export default function OperatorDashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuthed(isAuthed());
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!authed) {
    return <LoginForm subtitle="Portal da Operadora — Gestão Populacional" onAuth={() => setAuthed(true)} />;
  }
  return <Dashboard onLogout={() => { logout(); setAuthed(false); }} />;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/operator/analytics/overview`, { headers: getAuthHeaders() });
      if (res.status === 401) return onLogout();
      if (!res.ok) throw new Error('Falha ao carregar as métricas populacionais.');
      setData(await res.json());
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com a API.');
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium bg-slate-50 min-h-screen">Carregando painel populacional...</div>;
  }
  if (error) {
    return (
      <div className="p-12 text-center bg-slate-50 min-h-screen">
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button onClick={load} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold">Tentar novamente</button>
      </div>
    );
  }

  const total = data?.population?.totalPatients || 0;
  const pctWidth = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Gestão Populacional do Diabetes</h1>
          <p className="text-slate-600 mt-1">Estratificação de risco, lacunas de cuidado e acompanhamento da carteira — dados em tempo real.</p>
        </div>
        <button onClick={onLogout} className="text-sm text-slate-500 hover:text-slate-800">Sair</button>
      </div>

      {/* Cards de cobertura */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">População Monitorada</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{data?.population?.totalPatients}</div>
          <span className="text-xs text-slate-500 mt-1 block">Beneficiários cadastrados</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">Taxa de Engajamento (30d)</span>
          <div className="text-3xl font-black text-blue-600 mt-2">{data?.population?.activationRatePercent}%</div>
          <span className="text-xs text-slate-500 mt-1 block">{data?.population?.activePatients30Days} pacientes ativos no mês</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">Lacunas de Cuidado Ativas</span>
          <div className="text-3xl font-black text-emerald-600 mt-2">
            {(data?.careGapsSummary || []).reduce((acc: number, g: any) => acc + (g.count || 0), 0)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Pendências abertas na carteira</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Estratificação de risco (US-21) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Estratificação por Risco Clínico (US-21)</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span className="text-red-700">Tier 1 - Alto Risco / Descompensado</span>
                <span className="text-slate-900">{data?.riskTiers?.highRisk} pacientes</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-red-600 h-full rounded-full" style={{ width: `${pctWidth(data?.riskTiers?.highRisk || 0)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span className="text-amber-700">Tier 2 - Risco Moderado</span>
                <span className="text-slate-900">{data?.riskTiers?.moderateRisk} pacientes</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pctWidth(data?.riskTiers?.moderateRisk || 0)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span className="text-emerald-700">Tier 3 - Controlado / Baixo Risco</span>
                <span className="text-slate-900">{data?.riskTiers?.lowRisk} pacientes</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pctWidth(data?.riskTiers?.lowRisk || 0)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Lacunas de cuidado (US-22) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Lacunas de Cuidado Prioritárias (US-22)</h2>
          <div className="divide-y divide-slate-100">
            {(data?.careGapsSummary || []).length === 0 && (
              <p className="py-4 text-sm text-slate-400">Nenhuma lacuna de cuidado ativa.</p>
            )}
            {(data?.careGapsSummary || []).map((gap: any) => (
              <div key={gap.gapType} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-slate-800">{GAP_LABEL[gap.gapType] || gap.gapType}</p>
                  <span className="text-xs text-slate-500">Ação recomendada via campanha automática</span>
                </div>
                <span className="px-3 py-1 bg-red-50 text-red-700 font-extrabold text-xs rounded-full">
                  {gap.count} pendências
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
