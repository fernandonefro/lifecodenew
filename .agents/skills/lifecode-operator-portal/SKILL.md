---
name: lifecode-operator-portal
description: Especificação técnica, contratos FHIR e componentes Next.js para o Portal da Operadora do projeto Lifecode (US-21 e US-22).
---

# Portal da Operadora (US-21 + US-22) - Lifecode SaMD

Este guia e conjunto de contratos cobrem a implementação do **Portal da Operadora** para gestão populacional, estratificação de risco e monitoramento de lacunas de cuidado no ecossistema Lifecode.

## 1. Mapeamento de Entidades e Estratificação

### Tiers de Risco Clínico (DM2)
- **`TIER_3_HIGH_RISK`**: HbA1c > 9.0%, eventos de hipoglicemia grave recorrentes (alertas P0/P1 recentes), doença renal do diabetes (eGFR < 45 mL/min/1.73m² ou albuminúria > 300 mg/g) ou complicações vasculares ativas.
- **`TIER_2_MODERATE_RISK`**: HbA1c entre 7.5% e 9.0%, controle errático ou ausência de exames periódicos nos últimos 6 meses.
- **`TIER_1_LOW_RISK`**: HbA1c < 7.5%, adesão ao plano individualizado (> 80%) e exames de rastreio em dia.

### Lacunas de Cuidado Monitoradas (Care Gaps)
1. **HbA1c Vencida**: > 6 meses sem registro válido (LOINC `4548-4`).
2. **Avaliação Renal Pendente**: Ausência de eGFR e Relação Albuminúria/Creatinina (RAC) em 12 meses (LOINC `33914-3` / `14957-5`).
3. **Avaliação Oftalmológica (Fundo de Olho)**: > 12 meses sem rastreio registrado (CPT `92250`).
4. **Exame dos Pés / Risco Neuropático**: > 12 meses sem avaliação documentada.
5. **Acompanhamento Médico Periódico**: > 4 meses sem consulta/teleconsulta registrada.

---

## 2. Contratos e Schemas Zod (`@lifecode/shared`)

### `packages/shared/src/schemas/operator-portal.schema.ts`
```typescript
import { z } from 'zod';

export enum RiskTier {
  TIER_3_HIGH = 'TIER_3_HIGH',
  TIER_2_MODERATE = 'TIER_2_MODERATE',
  TIER_1_LOW = 'TIER_1_LOW'
}

export enum CareGapType {
  HBA1C_OVERDUE = 'HBA1C_OVERDUE',
  RENAL_SCREENING_PENDING = 'RENAL_SCREENING_PENDING',
  RETINOPATHY_SCREENING_PENDING = 'RETINOPATHY_SCREENING_PENDING',
  FOOT_EXAM_PENDING = 'FOOT_EXAM_PENDING',
  CONSULTATION_OVERDUE = 'CONSULTATION_OVERDUE'
}

export const operatorMetricsFilterSchema = z.object({
  tenantId: z.string().uuid().optional(),
  riskTier: z.nativeEnum(RiskTier).optional(),
  gapType: z.nativeEnum(CareGapType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type OperatorMetricsFilterDTO = z.infer<typeof operatorMetricsFilterSchema>;
```

---

## 3. Endpoints NestJS Analytics (`apps/api/src/modules/analytics/`)

- **Service**: [`OperatorAnalyticsService`](file:///C:/Users/fernando/.gemini/antigravity/scratch/lifecode/apps/api/src/modules/analytics/operator-analytics.service.ts)
- **Controller**: [`OperatorAnalyticsController`](file:///C:/Users/fernando/.gemini/antigravity/scratch/lifecode/apps/api/src/modules/analytics/operator-analytics.controller.ts)
- **Endpoint**: `GET /api/v1/operator/analytics/overview` (Protegido por RBAC para `ANALISTA_OPERADORA`, `GESTOR_CLINICA` e `ADMIN`).

```typescript
// Exemplo de resposta agregada do endpoint
{
  "population": {
    "totalPatients": 12450,
    "activePatients30Days": 10582,
    "activationRatePercent": 85
  },
  "riskTiers": {
    "highRisk": 870,
    "moderateRisk": 3112,
    "lowRisk": 8468
  },
  "careGapsSummary": [
    { "gapType": "HBA1C_OVERDUE", "count": 1240 },
    { "gapType": "RENAL_SCREENING_PENDING", "count": 850 },
    { "gapType": "RETINOPATHY_SCREENING_PENDING", "count": 620 },
    { "gapType": "CONSULTATION_OVERDUE", "count": 410 }
  ]
}
```

---

## 4. Componente Frontend Next.js (`apps/web/src/app/(operator)/dashboard/page.tsx`)

A interface do Portal da Operadora permite aos gestores de saúde:
- Visualizar os KPIs superiores de engajamento populacional.
- Acompanhar as barras visuais de distribuição por Tiers de Risco (US-21).
- Priorizar e disparar campanhas para resolução de lacunas de cuidado vencidas (US-22).
