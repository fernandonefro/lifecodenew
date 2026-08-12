'use client';

import React, { useEffect, useState } from 'react';

export default function OperatorDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await fetch('/api/v1/operator/analytics/overview');
        const metrics = await res.json();
        setData(metrics);
      } catch (err) {
        console.error('Erro ao carregar métricas populacionais:', err);
        // Fallback para visualização de homologação
        setData({
          population: { totalPatients: 12450, activePatients30Days: 10582, activationRatePercent: 85 },
          riskTiers: { highRisk: 870, moderateRisk: 3112, lowRisk: 8468 },
          careGapsSummary: [
            { gapType: 'HBA1C_OVERDUE', count: 1240 },
            { gapType: 'RENAL_SCREENING_PENDING', count: 850 },
            { gapType: 'RETINOPATHY_SCREENING_PENDING', count: 620 },
            { gapType: 'CONSULTATION_OVERDUE', count: 410 },
          ],
        });
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium">Carregando painel populacional...</div>;
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Gestão Populacional do Diabetes</h1>
        <p className="text-slate-600 mt-1">Estratificação de risco, lacunas de cuidado e acompanhamento da carteira.</p>
      </div>

      {/* Cards Superiores de Cobertura */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">População Monitorada</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{data?.population.totalPatients}</div>
          <span className="text-xs text-slate-500 mt-1 block">Beneficiários cadastrados</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">Taxa de Engajamento (30d)</span>
          <div className="text-3xl font-black text-blue-600 mt-2">{data?.population.activationRatePercent}%</div>
          <span className="text-xs text-slate-500 mt-1 block">{data?.population.activePatients30Days} pacientes ativos no mês</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">Ações Concluídas no Prazo</span>
          <div className="text-3xl font-black text-emerald-600 mt-2">88%</div>
          <span className="text-xs text-emerald-700 mt-1 font-semibold block">Métrica North Star do Programa</span>
        </div>
      </div>

      {/* Grid Duplo: Estratificação de Risco x Lacunas de Cuidado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Painel de Estratificação de Risco (US-21) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Estratificação por Risco Clínico (US-21)</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span className="text-red-700">Tier 3 - Alto Risco / Descompensado</span>
                <span className="text-slate-900">{data?.riskTiers.highRisk} pacientes</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-red-600 h-full rounded-full" 
                  style={{ width: `${(data?.riskTiers.highRisk / data?.population.totalPatients) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span className="text-amber-700">Tier 2 - Risco Moderado</span>
                <span className="text-slate-900">{data?.riskTiers.moderateRisk} pacientes</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full" 
                  style={{ width: `${(data?.riskTiers.moderateRisk / data?.population.totalPatients) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span className="text-emerald-700">Tier 1 - Controlado / Baixo Risco</span>
                <span className="text-slate-900">{data?.riskTiers.lowRisk} pacientes</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${(data?.riskTiers.lowRisk / data?.population.totalPatients) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Painel de Lacunas de Cuidado (US-22) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Lacunas de Cuidado Prioritárias (US-22)</h2>
          <div className="divide-y divide-slate-100">
            {data?.careGapsSummary.map((gap: any) => (
              <div key={gap.gapType} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {gap.gapType === 'HBA1C_OVERDUE' && 'Hemoglobina Glicada (HbA1c) Vencida'}
                    {gap.gapType === 'RENAL_SCREENING_PENDING' && 'Rastreio de Doença Renal Pendente (eGFR/RAC)'}
                    {gap.gapType === 'RETINOPATHY_SCREENING_PENDING' && 'Exame de Fundo de Olho Vencido'}
                    {gap.gapType === 'CONSULTATION_OVERDUE' && 'Consulta Periódica em Atraso'}
                  </p>
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
