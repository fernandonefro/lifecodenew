// ============================================================================
// Seed sintético do Lifecode (A5).
// LGPD: DADOS 100% FICTÍCIOS — nomes inventados e CPFs INVÁLIDOS (dígitos
// repetidos reprovam no cálculo de verificação). NUNCA use dados reais aqui.
//
// Idempotente: remove o tenant DEMO (cascade apaga tudo que depende dele) e
// recria do zero. Rode com: pnpm db:seed  (ou pnpm --filter @lifecode/database db:seed)
// ============================================================================
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// --- Carrega DATABASE_URL do .env da raiz se não estiver no ambiente ---------
// (O Prisma Client, ao contrário do CLI, não lê .env automaticamente.)
function ensureDatabaseUrl() {
  if (process.env.DATABASE_URL) return;
  const here = dirname(fileURLToPath(import.meta.url)); // packages/database/prisma
  const candidates = [resolve(here, '../../../.env'), resolve(here, '../.env')];
  for (const p of candidates) {
    try {
      const txt = readFileSync(p, 'utf8');
      const m = txt.match(/^DATABASE_URL=(.+)$/m);
      if (m) {
        process.env.DATABASE_URL = m[1].trim();
        return;
      }
    } catch {
      /* arquivo ausente — tenta o próximo */
    }
  }
}
ensureDatabaseUrl();

const prisma = new PrismaClient();

const TENANT_CODE = 'DEMO-001';
// bcrypt de 'Lifecode@123' — senha única de desenvolvimento para todos os usuários.
const PASSWORD_HASH = '$2b$10$h7YDJjRphy/DpiwEW6EDz.V68dwdg1Bvvav5F6/nKhWtxp/vjsZUe';
const BASE = new Date('2026-08-13T12:00:00.000Z');
const hoursAgo = (h) => new Date(BASE.getTime() - h * 3600_000);

// Perfis de paciente (fictícios). scenario define severidade da última leitura.
const PATIENTS = [
  { first: 'ana',      name: 'Ana Beatriz Souza',      gender: 'F', dob: '1968-03-12', dm: 'TYPE_2', cpf: '111.111.111-11', scenario: 'P0_HYPO',  last: 45,  tier: 'TIER_1_HIGH',     hba1c: 9.8 },
  { first: 'joao',     name: 'João Pedro Alves',       gender: 'M', dob: '1955-11-02', dm: 'TYPE_1', cpf: '222.222.222-22', scenario: 'P0_HYPER', last: 340, tier: 'TIER_1_HIGH',     hba1c: 11.2 },
  { first: 'carlos',   name: 'Carlos Eduardo Lima',    gender: 'M', dob: '1972-07-25', dm: 'TYPE_2', cpf: '333.333.333-33', scenario: 'P1_HYPER', last: 262, tier: 'TIER_2_MODERATE', hba1c: 8.4 },
  { first: 'fernanda', name: 'Fernanda Costa Ribeiro', gender: 'F', dob: '1980-01-18', dm: 'TYPE_2', cpf: '444.444.444-44', scenario: 'P1_HYPO',  last: 62,  tier: 'TIER_2_MODERATE', hba1c: 7.9 },
  { first: 'beatriz',  name: 'Beatriz Rocha Nunes',    gender: 'F', dob: '1963-09-30', dm: 'TYPE_2', cpf: '555.555.555-55', scenario: 'P1_HYPER', last: 281, tier: 'TIER_2_MODERATE', hba1c: 8.1 },
  { first: 'mariana',  name: 'Mariana Ferreira Dias',  gender: 'F', dob: '1990-05-14', dm: 'TYPE_2', cpf: '666.666.666-66', scenario: 'NORMAL',   last: 112, tier: 'TIER_3_LOW',      hba1c: 6.3 },
  { first: 'rafael',   name: 'Rafael Gomes Teixeira',  gender: 'M', dob: '1985-12-07', dm: 'TYPE_1', cpf: '777.777.777-77', scenario: 'NORMAL',   last: 128, tier: 'TIER_3_LOW',      hba1c: 6.8 },
  { first: 'lucas',    name: 'Lucas Martins Pereira',  gender: 'M', dob: '1978-02-21', dm: 'TYPE_2', cpf: '888.888.888-88', scenario: 'NORMAL',   last: 96,  tier: 'TIER_3_LOW',      hba1c: 6.1 },
];

const STAFF = [
  { role: 'NAVEGADOR',          email: 'navegador@demo.lifecode.local', name: 'Núria Enfermeira (Navegadora)' },
  { role: 'MEDICO',             email: 'medico@demo.lifecode.local',    name: 'Dr. Marcos Endocrinologista' },
  { role: 'GESTOR_CLINICA',     email: 'gestor@demo.lifecode.local',    name: 'Gabriela Gestora Clínica' },
  { role: 'ANALISTA_OPERADORA', email: 'analista@demo.lifecode.local',  name: 'Otávio Analista da Operadora' },
];

function alertFor(scenario, value) {
  switch (scenario) {
    case 'P0_HYPO':
      return { severity: 'P0', title: `Alerta Clínico P0: Glicemia ${value} mg/dL`,
        message: `Hipoglicemia grave (${value} mg/dL) com alteração de consciência. Ação imediata.`, dueOffsetH: 0 };
    case 'P0_HYPER':
      return { severity: 'P0', title: `Alerta Clínico P0: Glicemia ${value} mg/dL`,
        message: `Hiperglicemia severa (${value} mg/dL) com sinais de cetose. Ação imediata.`, dueOffsetH: 0 };
    case 'P1_HYPER':
      return { severity: 'P1', title: `Alerta Clínico P1: Glicemia ${value} mg/dL`,
        message: `Hiperglicemia expressiva (${value} mg/dL). Contatar paciente no SLA.`, dueOffsetH: 4 };
    case 'P1_HYPO':
      return { severity: 'P1', title: `Alerta Clínico P1: Glicemia ${value} mg/dL`,
        message: `Hipoglicemia moderada (${value} mg/dL). Contatar paciente no SLA.`, dueOffsetH: 4 };
    default:
      return null;
  }
}

async function main() {
  console.log('→ Limpando tenant DEMO anterior (cascade)...');
  await prisma.tenant.deleteMany({ where: { code: TENANT_CODE } });

  console.log('→ Criando tenant...');
  const tenant = await prisma.tenant.create({
    data: { name: 'Operadora Demonstração Lifecode', code: TENANT_CODE, active: true },
  });

  console.log('→ Criando equipe clínica/operadora...');
  for (const s of STAFF) {
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: s.email,
        passwordHash: PASSWORD_HASH,
        fullName: s.name,
        role: s.role,
        active: true,
      },
    });
  }

  console.log('→ Criando pacientes, consentimentos, observações e alertas...');
  let alertsCount = 0;
  let obsCount = 0;

  for (const p of PATIENTS) {
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `${p.first}@demo.lifecode.local`,
        passwordHash: PASSWORD_HASH,
        fullName: p.name,
        cpf: p.cpf, // INVÁLIDO de propósito (LGPD/dev)
        role: 'PACIENTE',
        active: true,
        // Consentimento LGPD + TCLE capturado
        consentLogs: {
          create: [
            { scope: 'TCLE_TERMS_OF_SERVICE', ipAddress: '203.0.113.10', userAgent: 'seed/1.0', signatureHash: `sig-tcle-${p.first}` },
            { scope: 'PRIVACY_POLICY_LGPD',   ipAddress: '203.0.113.10', userAgent: 'seed/1.0', signatureHash: `sig-lgpd-${p.first}` },
          ],
        },
        patient: {
          create: {
            tenantId: tenant.id,
            mrn: `MRN-${p.first.toUpperCase()}`,
            birthDate: new Date(p.dob),
            gender: p.gender,
            diabetesType: p.dm,
            emergencyContactName: 'Contato Fictício',
            emergencyContactPhone: '+55 11 90000-0000',
          },
        },
      },
      include: { patient: true },
    });
    const patientId = user.patient.id;

    // Histórico de observações (últimas leituras); a última reflete o cenário.
    const history = [
      { v: 118, h: 72 },
      { v: 105, h: 48 },
      { v: 134, h: 24 },
      { v: p.last, h: 2 },
    ];
    let idx = 0;
    for (const obs of history) {
      idx += 1;
      const created = await prisma.clinicalObservation.create({
        data: {
          tenantId: tenant.id,
          patientId,
          externalEventId: `seed-${p.first}-obs-${idx}`,
          value: obs.v,
          unit: 'mg/dL',
          sourceType: 'CAPILLARY',
          validationStatus: 'VALIDATED',
          measuredAt: hoursAgo(obs.h),
          metadata: JSON.stringify({ seeded: true }),
        },
      });
      obsCount += 1;

      // Gera alerta apenas para a última leitura, conforme o cenário.
      if (obs.h === 2) {
        const a = alertFor(p.scenario, obs.v);
        if (a) {
          await prisma.alert.create({
            data: {
              tenantId: tenant.id,
              patientId,
              observationId: created.id,
              severity: a.severity,
              status: 'OPEN',
              title: a.title,
              message: a.message,
              dueDate: new Date(BASE.getTime() + a.dueOffsetH * 3600_000),
            },
          });
          alertsCount += 1;
        }
      }
    }

    // Estratificação de risco
    await prisma.riskStratification.create({
      data: {
        tenantId: tenant.id,
        patientId,
        tier: p.tier,
        riskScore: p.tier === 'TIER_1_HIGH' ? 85 : p.tier === 'TIER_2_MODERATE' ? 55 : 20,
        hba1cValue: p.hba1c,
        tirPercentage: p.tier === 'TIER_1_HIGH' ? 42 : p.tier === 'TIER_2_MODERATE' ? 61 : 78,
      },
    });
  }

  // Lacunas de cuidado (care gaps) em alguns pacientes de maior risco
  const gapPatients = await prisma.patient.findMany({
    where: { tenantId: tenant.id },
    take: 3,
    orderBy: { createdAt: 'asc' },
  });
  for (const gp of gapPatients) {
    await prisma.careGap.create({
      data: {
        tenantId: tenant.id,
        patientId: gp.id,
        gapType: 'HBA1C_OVERDUE',
        title: 'HbA1c em atraso',
        description: 'Exame de HbA1c vencido há mais de 90 dias.',
        loincCode: '4548-4',
        dueDate: hoursAgo(24 * 30),
        status: 'OVERDUE',
      },
    });
  }

  // Métrica populacional do mês corrente (para o dashboard da operadora)
  const tier1 = PATIENTS.filter((p) => p.tier === 'TIER_1_HIGH').length;
  const tier2 = PATIENTS.filter((p) => p.tier === 'TIER_2_MODERATE').length;
  const tier3 = PATIENTS.filter((p) => p.tier === 'TIER_3_LOW').length;
  await prisma.populationMetric.create({
    data: {
      tenantId: tenant.id,
      periodMonth: '2026-08',
      totalBeneficiaries: PATIENTS.length,
      tier1Count: tier1,
      tier2Count: tier2,
      tier3Count: tier3,
      erVisitsCount: 1,
      hospitalizationsCount: 0,
      erRatePerThousand: (1000 * 1) / PATIENTS.length,
      inpatientRatePerThousand: 0,
    },
  });

  console.log('\n✅ Seed concluído:');
  console.log(`   Tenant: ${tenant.name} (${TENANT_CODE})`);
  console.log(`   Equipe: ${STAFF.length} usuários | Pacientes: ${PATIENTS.length}`);
  console.log(`   Observações: ${obsCount} | Alertas abertos: ${alertsCount}`);
  console.log(`   Care gaps: ${gapPatients.length} | Métrica populacional: 2026-08`);
  console.log('\n   Login de dev (todos): senha "Lifecode@123"');
  console.log('   Ex.: navegador@demo.lifecode.local / ana@demo.lifecode.local');
}

main()
  .catch((e) => {
    console.error('ERRO no seed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
