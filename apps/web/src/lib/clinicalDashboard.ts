// Lógica pura do Dashboard Médico (V3.5). Sem React, sem I/O — testável isolada.
//
// PRINCÍPIO: o frontend NÃO infere, pontua nem reclassifica nada clínico. Ele
// apenas decodifica o papel do usuário (para o gate de acesso, espelhando o
// backend) e normaliza os NÚMEROS já calculados pelo backend para exibição.

export const ALLOWED_ROLES = ['MEDICO', 'NAVEGADOR', 'GESTOR_CLINICA', 'ADMIN'] as const;
export type AllowedRole = (typeof ALLOWED_ROLES)[number];

export type Severity = 'P0' | 'P1' | 'P2' | 'P3';

export interface DashboardModel {
  totalPatients: number;
  alerts: {
    open: number;
    inProgress: number;
    resolved: number;
    overdue: number;
    active: number;
    bySeverity: Record<Severity, number>;
  };
  careGaps: { overdue: number; scheduled: number; closed: number };
  activity: { observationsLast7Days: number };
  generatedAt: string | null;
}

/** Papéis autorizados a ver o Dashboard Médico (espelha o RolesGuard do backend). */
export function canAccessDashboard(role: string | null | undefined): boolean {
  return !!role && (ALLOWED_ROLES as readonly string[]).includes(role);
}

/** Decodifica o payload de um JWT e devolve o `role` (ou null se inválido). */
export function decodeJwtRole(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
    const payload = JSON.parse(json);
    return typeof payload?.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

const num = (v: unknown): number => (typeof v === 'number' && isFinite(v) ? v : 0);

/** Normaliza a resposta da API num modelo estável (zeros por padrão), sem inferência. */
export function normalizeDashboard(raw: any): DashboardModel {
  const a = raw?.alerts ?? {};
  const sev = a?.bySeverity ?? {};
  const g = raw?.careGaps ?? {};
  return {
    totalPatients: num(raw?.totalPatients),
    alerts: {
      open: num(a.open),
      inProgress: num(a.inProgress),
      resolved: num(a.resolved),
      overdue: num(a.overdue),
      active: num(a.active),
      bySeverity: { P0: num(sev.P0), P1: num(sev.P1), P2: num(sev.P2), P3: num(sev.P3) },
    },
    careGaps: { overdue: num(g.overdue), scheduled: num(g.scheduled), closed: num(g.closed) },
    activity: { observationsLast7Days: num(raw?.activity?.observationsLast7Days) },
    generatedAt: typeof raw?.generatedAt === 'string' ? raw.generatedAt : null,
  };
}

/** Verdadeiro quando não há absolutamente nenhum dado operacional para exibir. */
export function isEmptyDashboard(m: DashboardModel): boolean {
  const { alerts: al, careGaps: cg } = m;
  return (
    m.totalPatients === 0 &&
    al.open + al.inProgress + al.resolved + al.overdue === 0 &&
    cg.overdue + cg.scheduled + cg.closed === 0 &&
    m.activity.observationsLast7Days === 0
  );
}

export const SEVERITY_META: Record<Severity, { label: string; short: string; emphasis: boolean }> = {
  P0: { label: 'P0 — Emergência', short: 'P0', emphasis: true },
  P1: { label: 'P1 — Alto risco', short: 'P1', emphasis: true },
  P2: { label: 'P2 — Lacuna de cuidado', short: 'P2', emphasis: false },
  P3: { label: 'P3 — Acompanhamento', short: 'P3', emphasis: false },
};
