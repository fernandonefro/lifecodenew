import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6 text-center">
      <h1 className="text-4xl font-extrabold mb-4">Plataforma Lifecode SaMD</h1>
      <p className="text-slate-400 max-w-md mb-8">
        Sistema de gestão por exceção do diabetes, com monitoramento contínuo, triagem de emergência e analytics populacional.
      </p>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition text-sm"
        >
          Portal da Operadora (US-21/22)
        </Link>
        <a
          href="/portal-profissional.html"
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition text-sm"
        >
          Portal Profissional (Carteira)
        </a>
      </div>
    </div>
  );
}
