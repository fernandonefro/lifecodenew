import React from 'react';

export default function OperatorPortalPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* HEADER DO PORTAL DA OPERADORA */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Portal da Operadora & Gestão de Saúde Populacional</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Estratificação da Carteira & Lacunas de Cuidado</h1>
          <p className="text-sm text-slate-400 mt-1">Conformidade US-21 & US-22 • 12.450 Beneficiários Ativos com Diabetes</p>
        </div>

        <div className="flex items-center gap-3">
          <select className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-xl px-4 py-2.5 font-medium">
            <option>Carteira: Plano de Saúde Global (12.450 Vidas)</option>
            <option>Região: São Paulo - SP</option>
            <option>Região: Rio de Janeiro - RJ</option>
          </select>
          <button className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition">
            Exportar Relatório ANS
          </button>
        </div>
      </header>

      {/* 🌟 SEÇÃO 1: INDICADORES POPULACIONAIS DE QUALIDADE & UTILIZAÇÃO / 1.000 (US-22) */}
      <section className="mb-10 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Indicadores de Utilização & Sinistralidade (por 1.000 Beneficiários/Ano)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CARD 1: IDAS AO PA / 1.000 */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Idas ao Pronto Atendimento</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">-15.2% vs 2025</span>
            </div>
            <div className="flex items-baseline gap-2 my-2">
              <span className="text-4xl font-extrabold text-white">142.5</span>
              <span className="text-xs text-slate-400">/ 1.000 vidas/ano</span>
            </div>
            <p className="text-xs text-slate-400">Anterior: 168.0 / 1.000 vidas (Redução de 317 atendimentos desnecessários em PA).</p>
          </div>

          {/* CARD 2: INTERNAÇÕES CAD/EHH / 1.000 */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Internações por Cetoacidosis / Coma</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">-25.7% vs 2025</span>
            </div>
            <div className="flex items-baseline gap-2 my-2">
              <span className="text-4xl font-extrabold text-emerald-400">18.2</span>
              <span className="text-xs text-slate-400">/ 1.000 vidas/ano</span>
            </div>
            <p className="text-xs text-slate-400">Anterior: 24.5 / 1.000 (78 internações graves evitadas pelo monitoramento P0/P1).</p>
          </div>

          {/* CARD 3: ECONOMIA ANUAL ESTIMADA */}
          <div className="rounded-3xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-300">Custo Assistencial Evitado (ROI)</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500 text-slate-950">Value-Based</span>
            </div>
            <div className="flex items-baseline gap-2 my-2">
              <span className="text-3xl font-extrabold text-white">R$ 185.000</span>
              <span className="text-xs text-emerald-400">/ mês</span>
            </div>
            <p className="text-xs text-emerald-300/80">Economia projetada de R$ 2.22M/ano para a operadora.</p>
          </div>
        </div>
      </section>

      {/* 🌟 SEÇÃO 2: ESTRATIFICAÇÃO DE RISCO POPULACIONAL (TIERS DE JORNADA) */}
      <section className="mb-10 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Estratificação Dinâmica por Tiers de Risco Fisiológico</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TIER 1: ALTO RISCO */}
          <div className="rounded-3xl bg-slate-900 border-2 border-red-500/80 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 bg-red-600 text-white font-extrabold text-xs rounded-full uppercase tracking-wider flex items-center gap-1.5">
                🔴 Tier 1: Alto Risco
              </span>
              <span className="text-2xl font-extrabold text-red-500">7.0%</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">870 Pacientes</h3>
            <p className="text-xs text-slate-400 mb-4">HbA1c &gt; 9.0% ou TIR &lt; 50% ou histórico recente de internação por CAD/PA.</p>
            <button className="w-full py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 font-bold text-xs rounded-xl border border-red-500/40 transition">
              Ver Fila de Gestão Intensiva (Navegador)
            </button>
          </div>

          {/* TIER 2: RISCO MÉDIO */}
          <div className="rounded-3xl bg-slate-900 border border-amber-500/60 p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-full uppercase tracking-wider flex items-center gap-1.5">
                🟡 Tier 2: Risco Médio
              </span>
              <span className="text-2xl font-extrabold text-amber-400">25.0%</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">3.112 Pacientes</h3>
            <p className="text-xs text-slate-400 mb-4">HbA1c 7.5% - 9.0% ou presença de pelo menos 1 lacuna de cuidado vencida.</p>
            <button className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 transition">
              Disparar Agendamentos Preventivos
            </button>
          </div>

          {/* TIER 3: CONTROLADO / BAIXO RISCO */}
          <div className="rounded-3xl bg-slate-900 border border-emerald-500/50 p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold text-xs rounded-full uppercase tracking-wider flex items-center gap-1.5">
                🟢 Tier 3: Controlado
              </span>
              <span className="text-2xl font-extrabold text-emerald-400">68.0%</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">8.468 Pacientes</h3>
            <p className="text-xs text-slate-400 mb-4">HbA1c &lt; 7.5% e TIR ≥ 70% mantido sem hipoglicemias. Exames preventivos em dia.</p>
            <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition">
              Monitoramento Passivo
            </button>
          </div>
        </div>
      </section>

      {/* 🌟 SEÇÃO 3: MONITORAMENTO DE LACUNAS DE CUIDADO (CARE GAPS) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Monitoramento de Lacunas de Cuidado (Exames & Consultas Vencidas)</h2>
            <p className="text-xs text-slate-400">Identificação proativa para prevenção de retinopatia, nefropatia e pé diabético.</p>
          </div>
          <button className="px-3 py-2 bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs font-semibold rounded-xl text-slate-300">
            Filtrar Apenas Vencidos &gt; 30 Dias
          </button>
        </div>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold">Paciente</th>
                <th className="px-6 py-4 font-bold">Exame / Lacuna de Cuidado</th>
                <th className="px-6 py-4 font-bold">Protocolo LOINC/CPT</th>
                <th className="px-6 py-4 font-bold">Data Vencimento</th>
                <th className="px-6 py-4 font-bold">Dias de Atraso</th>
                <th className="px-6 py-4 font-bold text-right">Ação Proativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-800/40 transition">
                <td className="px-6 py-4 font-bold text-white">Maria Oliveira</td>
                <td className="px-6 py-4 font-medium text-red-400">Hemoglobina Glicada (HbA1c) Vencida</td>
                <td className="px-6 py-4 font-mono text-slate-400">LOINC 4548-4</td>
                <td className="px-6 py-4 text-slate-400">15/06/2026</td>
                <td className="px-6 py-4 font-bold text-red-500">55 Dias</td>
                <td className="px-6 py-4 text-right">
                  <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition">
                    Agendar Exame
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/40 transition">
                <td className="px-6 py-4 font-bold text-white">Roberto Alves</td>
                <td className="px-6 py-4 font-medium text-amber-400">Rastreio de Nefropatia (eGFR & Albuminúria)</td>
                <td className="px-6 py-4 font-mono text-slate-400">LOINC 33914-3</td>
                <td className="px-6 py-4 text-slate-400">01/07/2026</td>
                <td className="px-6 py-4 font-bold text-amber-400">39 Dias</td>
                <td className="px-6 py-4 text-right">
                  <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition">
                    Agendar Exame
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/40 transition">
                <td className="px-6 py-4 font-bold text-white">Carla Souza</td>
                <td className="px-6 py-4 font-medium text-amber-400">Mapeamento de Retina (Fundo de Olho)</td>
                <td className="px-6 py-4 font-mono text-slate-400">CPT 92250</td>
                <td className="px-6 py-4 text-slate-400">10/07/2026</td>
                <td className="px-6 py-4 font-bold text-amber-400">30 Dias</td>
                <td className="px-6 py-4 text-right">
                  <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition">
                    Agendar Consulta
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
