// Sessão do paciente no app mobile.
//
// Em produção, popular via fluxo de login (setSession) e persistir com
// expo-secure-store. Aqui mantemos em memória com fallback de variáveis de
// ambiente EXPO_PUBLIC_* para desenvolvimento — NUNCA hardcode de token.
// Antes, o hook usava `Bearer MOCK_JWT_TOKEN` fixo e não enviava X-Tenant-ID.

let token: string | null = process.env.EXPO_PUBLIC_DEV_TOKEN ?? null;
let tenantId: string | null = process.env.EXPO_PUBLIC_TENANT_ID ?? null;
let patientId: string | null = process.env.EXPO_PUBLIC_PATIENT_ID ?? null;

export function setSession(s: { token: string; tenantId: string; patientId?: string }) {
  token = s.token;
  tenantId = s.tenantId;
  if (s.patientId) patientId = s.patientId;
}

export function clearSession() {
  token = null;
  tenantId = null;
  patientId = null;
}

export function getPatientId(): string | null {
  return patientId;
}

/** Cabeçalhos autenticados e com tenant obrigatório (multi-tenancy). */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  return headers;
}
