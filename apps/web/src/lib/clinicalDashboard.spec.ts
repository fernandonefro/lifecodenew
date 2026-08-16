import {
  ALLOWED_ROLES,
  canAccessDashboard,
  decodeJwtRole,
  isEmptyDashboard,
  normalizeDashboard,
} from './clinicalDashboard';

// Monta um JWT falso (header.payload.signature) com o payload informado.
function fakeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
}

describe('clinicalDashboard — autorização por papel', () => {
  it('permite papéis clínicos e de navegação', () => {
    for (const r of ALLOWED_ROLES) expect(canAccessDashboard(r)).toBe(true);
  });

  it('nega paciente, cuidador, analista de operadora e nulos', () => {
    for (const r of ['PACIENTE', 'CUIDADOR', 'ANALISTA_OPERADORA', '', null, undefined]) {
      expect(canAccessDashboard(r as any)).toBe(false);
    }
  });

  it('decodeJwtRole extrai o role do payload', () => {
    expect(decodeJwtRole(fakeJwt({ role: 'MEDICO', tenantId: 't1' }))).toBe('MEDICO');
    expect(decodeJwtRole(fakeJwt({ sub: 'x' }))).toBeNull();
    expect(decodeJwtRole('lixo')).toBeNull();
    expect(decodeJwtRole(null)).toBeNull();
  });
});

describe('clinicalDashboard — normalização (sem inferência)', () => {
  it('preenche zeros quando a resposta é parcial/ausente', () => {
    const m = normalizeDashboard({ totalPatients: 10, alerts: { open: 3 } });
    expect(m.totalPatients).toBe(10);
    expect(m.alerts.open).toBe(3);
    expect(m.alerts.overdue).toBe(0);
    expect(m.alerts.bySeverity).toEqual({ P0: 0, P1: 0, P2: 0, P3: 0 });
    expect(m.careGaps).toEqual({ overdue: 0, scheduled: 0, closed: 0 });
    expect(m.activity.observationsLast7Days).toBe(0);
  });

  it('preserva exatamente os números do backend (não recalcula)', () => {
    const raw = {
      totalPatients: 120,
      alerts: { open: 5, inProgress: 2, resolved: 11, overdue: 3, active: 7, bySeverity: { P0: 1, P1: 4, P2: 2, P3: 0 } },
      careGaps: { overdue: 8, scheduled: 3, closed: 0 },
      activity: { observationsLast7Days: 42 },
      generatedAt: '2026-08-15T00:00:00.000Z',
    };
    expect(normalizeDashboard(raw)).toEqual(raw);
  });

  it('isEmptyDashboard detecta ausência total de dados', () => {
    expect(isEmptyDashboard(normalizeDashboard({}))).toBe(true);
    expect(isEmptyDashboard(normalizeDashboard({ totalPatients: 1 }))).toBe(false);
    expect(isEmptyDashboard(normalizeDashboard({ activity: { observationsLast7Days: 1 } }))).toBe(false);
  });
});
