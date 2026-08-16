'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { canAccessDashboard, decodeJwtRole } from './clinicalDashboard';

/**
 * Link de navegação para o Dashboard Médico — visível APENAS para papéis
 * autorizados (MEDICO/NAVEGADOR/GESTOR_CLINICA/ADMIN). É um gate de UI: a
 * autorização real é sempre feita pelo backend (RolesGuard). Renderiza nada
 * quando não há sessão ou o papel não é autorizado.
 */
export function MedicalDashboardNavLink({ className }: { className?: string }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('lifecode_token');
    setAllowed(canAccessDashboard(decodeJwtRole(token)));
  }, []);

  if (!allowed) return null;

  return (
    <Link
      href="/medical-dashboard"
      data-testid="nav-medical-dashboard"
      className={
        className ||
        'px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition text-sm'
      }
    >
      Dashboard Médico
    </Link>
  );
}
