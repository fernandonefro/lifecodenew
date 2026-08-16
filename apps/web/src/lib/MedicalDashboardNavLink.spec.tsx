import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MedicalDashboardNavLink } from './MedicalDashboardNavLink';

// next/link vira um <a> simples no ambiente de teste.
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
}));

function fakeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '');
  return `${b64({ alg: 'HS256' })}.${b64(payload)}.sig`;
}

describe('MedicalDashboardNavLink — visibilidade por papel', () => {
  beforeEach(() => localStorage.clear());

  it('aparece para papéis autorizados', async () => {
    for (const role of ['MEDICO', 'NAVEGADOR', 'GESTOR_CLINICA', 'ADMIN']) {
      localStorage.setItem('lifecode_token', fakeJwt({ role }));
      const { unmount } = render(<MedicalDashboardNavLink />);
      expect(await screen.findByTestId('nav-medical-dashboard')).toHaveAttribute('href', '/medical-dashboard');
      unmount();
    }
  });

  it('NÃO aparece para papéis não autorizados nem sem sessão', async () => {
    for (const token of [fakeJwt({ role: 'PACIENTE' }), fakeJwt({ role: 'ANALISTA_OPERADORA' }), null]) {
      localStorage.clear();
      if (token) localStorage.setItem('lifecode_token', token);
      const { container, unmount } = render(<MedicalDashboardNavLink />);
      await waitFor(() => {}); // deixa o efeito rodar
      expect(screen.queryByTestId('nav-medical-dashboard')).toBeNull();
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });
});
