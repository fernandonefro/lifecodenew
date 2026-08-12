import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Lifecode - Plataforma de Gestão do Diabetes',
  description: 'Software como Dispositivo Médico (SaMD) para gestão assistencial e populacional do diabetes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
