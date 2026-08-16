import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MedicalDashboardPage from './page';

function fakeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
}

const OK = (body: any) => ({ ok: true, status: 200, json: async () => body });

const FULL = {
  totalPatients: 120,
  alerts: { open: 5, inProgress: 2, resolved: 11, overdue: 3, active: 7, bySeverity: { P0: 1, P1: 4, P2: 2, P3: 0 } },
  careGaps: { overdue: 8, scheduled: 3, closed: 0 },
  activity: { observationsLast7Days: 42 },
  generatedAt: '2026-08-15T12:00:00.000Z',
};
const EMPTY = {
  totalPatients: 0,
  alerts: { open: 0, inProgress: 0, resolved: 0, overdue: 0, active: 0, bySeverity: { P0: 0, P1: 0, P2: 0, P3: 0 } },
  careGaps: { overdue: 0, scheduled: 0, closed: 0 },
  activity: { observationsLast7Days: 0 },
  generatedAt: '2026-08-15T12:00:00.000Z',
};

function authAs(role: string) {
  localStorage.setItem('lifecode_token', fakeJwt({ role, tenantId: 't1' }));
  localStorage.setItem('lifecode_tenant', 't1');
}

describe('MedicalDashboardPage (V3.5 UI)', () => {
  beforeEach(() => {
    localStorage.clear();
    (global.fetch as any) = jest.fn();
  });

  it('sem sessão: exibe o formulário de login e NÃO chama a API', async () => {
    render(<MedicalDashboardPage />);
    expect(await screen.findByRole('button', { name: /entrar/i })).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('papel não autorizado: exibe "Acesso negado" e NÃO chama a API', async () => {
    authAs('PACIENTE');
    render(<MedicalDashboardPage />);
    expect(await screen.findByTestId('state-denied')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('papel clínico + dados: renderiza KPIs, severidade e lacunas', async () => {
    authAs('MEDICO');
    (global.fetch as jest.Mock).mockResolvedValueOnce(OK(FULL));
    render(<MedicalDashboardPage />);

    const patients = await screen.findByTestId('kpi-patients');
    expect(patients).toHaveTextContent('120');
    expect(screen.getByTestId('kpi-alerts-active')).toHaveTextContent('7');
    expect(screen.getByTestId('kpi-alerts-overdue')).toHaveTextContent('3');
    expect(screen.getByTestId('kpi-activity')).toHaveTextContent('42');
    expect(screen.getByTestId('sev-P0')).toHaveTextContent('1');
    expect(screen.getByTestId('sev-P1')).toHaveTextContent('4');
    expect(screen.getByTestId('gap-overdue')).toHaveTextContent('8');
    expect(screen.getByTestId('stat-resolved')).toHaveTextContent('11');

    // Chamou o endpoint correto com header de tenant (isolamento multi-tenant).
    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toMatch(/\/analytics\/clinical-dashboard$/);
    expect(opts.headers['X-Tenant-ID']).toBe('t1');
    expect(opts.headers.Authorization).toMatch(/^Bearer /);
  });

  it('resposta vazia (tudo zero): exibe o estado de ausência de dados', async () => {
    authAs('NAVEGADOR');
    (global.fetch as jest.Mock).mockResolvedValueOnce(OK(EMPTY));
    render(<MedicalDashboardPage />);
    expect(await screen.findByTestId('state-empty')).toBeInTheDocument();
  });

  it('403 do backend: exibe "Acesso negado"', async () => {
    authAs('MEDICO');
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) });
    render(<MedicalDashboardPage />);
    expect(await screen.findByTestId('state-denied')).toBeInTheDocument();
  });

  it('falha da API (rede/500): exibe o estado de erro com botão de retry', async () => {
    authAs('GESTOR_CLINICA');
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network down'));
    render(<MedicalDashboardPage />);
    expect(await screen.findByTestId('state-error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });
});
