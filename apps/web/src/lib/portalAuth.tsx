'use client';

import React, { useState } from 'react';

// Base da API (mesma origem em prod via proxy; em dev aponta para :3000).
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Chaves compartilhadas com o Portal de Alertas (login único no navegador).
const TOKEN_KEY = 'lifecode_token';
const TENANT_KEY = 'lifecode_tenant';

export function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
}
export function getTenant(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem(TENANT_KEY) : null;
}
export function isAuthed(): boolean {
  return Boolean(getToken() && getTenant());
}
export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TENANT_KEY);
}
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  const tenant = getTenant();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenant) headers['X-Tenant-ID'] = tenant;
  return headers;
}

/** Formulário de login reutilizável entre os portais. */
export function LoginForm({ onAuth, subtitle }: { onAuth: () => void; subtitle?: string }) {
  const [tenantId, setTenantId] = useState('');
  const [email, setEmail] = useState('analista@demo.lifecode.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, email, password }),
      });
      if (!res.ok) throw new Error('Credenciais inválidas ou Tenant incorreto.');
      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(TENANT_KEY, tenantId);
      onAuth();
    } catch (err: any) {
      setError(err.message || 'Falha no login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <form onSubmit={submit} className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
        <h1 className="text-2xl font-black text-slate-900 mb-1">Lifecode</h1>
        <p className="text-slate-500 text-sm mb-6">{subtitle || 'Acesso ao portal'}</p>
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
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg disabled:opacity-50">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
