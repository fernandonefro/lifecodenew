# ADR-0002 — Motor de regras clínicas: taxonomia, governança e avaliadores puros

- **Status:** Proposto (estrutura implementada como INERTE; nenhuma regra nova ativada).
- **Data:** 2026-08-15
- **Decisores:** Engenharia + Produto. Pendências: Comitê Clínico e responsável regulatório.
- **Sucede/estende:** [ADR-0001](./ADR-0001-taxonomia-alertas.md) (não substitui; o histórico do ADR-0001 é preservado).
- **Escopo:** implementação estrutural em `packages/shared/src/clinical-rules/`. NÃO altera o
  comportamento clínico legado ativo em produção.

## 1. Contexto do conflito anterior

Coexistiam **duas semânticas de P2/P3**: o enum `alert-severity.enum.ts` documentava
`P2 = "lacuna de cuidado"`, `P3 = "oportunidade"` (tipo clínico), enquanto o motor órfão
`clinical_engine/clinical_rules_engine.ts` usava P2/P3 como severidade glicêmica em tempo real
(hiperglicemia sustentada; TIR "no alvo"). O motor real de produção
(`apps/api/src/modules/observations/glucose.service.ts::evaluateGlucoseAlertRules`) só emitia P0/P1.
Havia ainda dois conjuntos de golden cases (4 vivos em `@lifecode/shared`; 5 órfãos em `clinical_engine/`,
não buildados/testados) e dois `schema.prisma`.

## 2. Decisão: separar domínio, subtipo e prioridade

- `priority` (P0–P3) = **exclusivamente** prioridade operacional/SLA. Nunca diagnóstico.
- `alertDomain` (canônico, 3 valores): `CLINICAL | DEVICE | CARE_MANAGEMENT`.
- `alertSubtype` carrega o significado clínico; `CARE_GAP`/`OPPORTUNITY` são **subtipos** de
  `CARE_MANAGEMENT`, não domínios.
- Eixos são **ortogonais**. Fonte única em `@lifecode/shared/clinical-rules`.

## 3. CareGap como fonte da verdade

Lacunas assistenciais vivem no modelo `CareGap`. Um alerta `CARE_MANAGEMENT/CARE_GAP` **referencia**
a lacuna (`careGapId` / `sourceEntityType` + `sourceEntityId`), sem duplicar o estado clínico.

## 4. TIR longitudinal

TIR é métrica **longitudinal individual**, janela padrão **14 dias**, exigindo **≥70% de dados válidos**.
Abaixo disso, não abrir care gap de TIR (insuficiência de dados é tratada à parte). Uma leitura isolada
70–180 mg/dL **apenas é armazenada** — nunca gera P3 nem "TIR normal". Metas candidatas (DRAFT): TIR>70%
padrão; TIR>50% idoso/alto risco. Gestação **excluída** da primeira versão.

## 5. Data gap é DEVICE

Ausência de dados de CGM → `alertDomain: DEVICE`, `alertSubtype: CGM_DATA_GAP` (nunca evento clínico).
Sem configuração confiável por dispositivo, a detecção permanece `DISABLED`. Falha global vira incidente
técnico agregado, não alerta por paciente. Durações são **derivadas no backend** a partir de timestamps —
nunca aceitas do cliente.

## 6. Hipoglicemia em níveis 1, 2 e 3

- Nível 1: ≥54 e <70 mg/dL. Nível 2: <54 mg/dL. Nível 3: evento grave com necessidade de ajuda de
  terceiros, independente do valor.
- Precedência **LEVEL3 > LEVEL2 > LEVEL1**; se nível 3, não emitir 1/2 como incidentes independentes.
- A regra legada `CLIN-HYPO-SEVERE` é marcada como **semanticamente imprecisa** (cobre nível 2 e 3),
  sem reescrever histórico, apontando para as sucessoras DRAFT `CLIN-HYPO-LEVEL2`/`CLIN-HYPO-LEVEL3`.

## 7. `SUSPECTED_DKA` (nunca "diagnóstico de DKA")

O software não mede acidose. Usa-se `CLIN-DKA-SUSPECTED` / `alertSubtype: SUSPECTED_DKA`. Não exige
glicemia >300 (DKA pode ocorrer com glicemia menor, especialmente com SGLT2). Precedência
**SUSPECTED_DKA > HYPERGLYCEMIA_MARKED > HYPERGLYCEMIA_SUSTAINED**. Parâmetros candidatos (DRAFT):
beta-OHB ≥3 mmol/L; cetona urinária ≥2+; ou hiperglicemia com vômitos/dor abdominal/dispneia/sonolência/
confusão.

## 8. Preservação do legado

As 4 regras legadas (`CLIN-HYPO-SEVERE`, `CLIN-HYPO-LEVEL1`, `CLIN-HYPER-KETONE`, `CLIN-HYPER-MARKED`,
todas v1.0.0) permanecem `deploymentStatus: ACTIVE` + `governanceStatus: LEGACY_UNREVIEWED`. Códigos não
são renomeados; histórico não é reescrito. Campos `deprecatedByRuleCode`/`deprecatedByRuleVersion`/
`legacySemanticAlias` registram a sucessão. O motor de produção não foi alterado.

## 9. Lifecycle de aprovação

`deploymentStatus` (`DISABLED | SHADOW | ACTIVE`) e `governanceStatus`
(`DRAFT | LEGACY_UNREVIEWED | CLINICALLY_APPROVED | REGULATORY_ASSESSED | TECHNICALLY_VALIDATED |
RELEASE_APPROVED | RETIRED`) são dimensões independentes. Emissão em produção exige
`ACTIVE && RELEASE_APPROVED`, **exceto** a allowlist legada (`ACTIVE && LEGACY_UNREVIEWED`), que é fixa e
imutável — nenhuma regra futura pode usá-la. Aprovações são `RuleApproval` auditáveis (tipo, aprovador
autenticado, decisão, racional, timestamp), nunca UUID solto.

## 10. Riscos aceitos temporariamente

- SLA genérico de P1 = +4h (inclusive 54–69 mg/dL) no motor legado.
- `>250` isolado gera P1 no legado, sem duração/repetição/contexto.
- Ausência de golden case dedicado para `CLIN-HYPER-MARKED` legado.
- Regra legada `CLIN-HYPO-SEVERE` conflaciona nível 2 e nível 3.
Todos preservados para não alterar produção sem aprovação; exigem revisão prioritária do Comitê.

## 11. Plano de migração (SHADOW → ativação)

1. Reconciliar/substituir o schema versionado legado (ver §12/§14 e `versioned_clinical_rule_schema.v2.json`).
2. Ligar o novo motor ao fluxo NestJS **apenas em SHADOW** (registro desidentificado, sem efeito),
   no ponto documentado abaixo.
3. Provar por teste ausência de efeitos colaterais.
4. Comitê preenche a matriz; regras passam por `CLINICALLY_APPROVED → REGULATORY_ASSESSED →
   TECHNICALLY_VALIDATED → RELEASE_APPROVED`.
5. Só então `deploymentStatus: ACTIVE`, uma regra por vez (habilitação por `ruleCode`+`ruleVersion`),
   com kill switch global.

**Ponto exato da futura integração SHADOW:** dentro de
`apps/api/src/modules/observations/glucose.service.ts::ingestGlucose`, após a persistência da observação
(`tx.clinicalObservation.create`) e **em paralelo** ao `evaluateGlucoseAlertRules` legado — chamar os
avaliadores puros + `evaluateRuleUnderGovernance` apenas para produzir registro SHADOW, sem tocar na criação
de `Alert`. Enquanto as regras forem DRAFT/DISABLED, `emit` é sempre `false` (garantido por teste).

## 12. Rollback

Como nada novo é ativado, o rollback é trivial: as adições são inertes e removíveis sem afetar produção.
Se a integração SHADOW for adicionada e apresentar qualquer efeito, basta remover a chamada SHADOW — o
caminho legado permanece intacto. O kill switch global desliga toda avaliação sob esta governança.

## 13. Decisões clínicas ainda pendentes (Comitê) e regulatórias

**Comitê Clínico:** limiares/janelas/repetição definitivos; metas individuais de TIR/TBR/TAR; SLAs de
reconhecimento×intervenção; escalonamento; mensagens ao paciente (ramificadas); aprovadores; golden cases
aprovados; tratamento do caso nível 3 com valor não-hipoglicêmico; parâmetros de DKA.
**Responsável regulatório:** enquadramento Anvisa (RDC 657/2022) e classe IEC 62304 — `regulatoryAssessmentStatus:
PENDING`. **NÃO** classificar automaticamente como IEC 62304 Classe C nem preencher `anvisaClearanceHash`.

## Referências

ADA Standards of Care 2026 (Sec. 6); International Consensus on Time in Range; Hyperglycemic Crises in
Adults 2024; Diretrizes SBD; Anvisa RDC 657/2022 / SaMD. Parâmetros OPERACIONAIS de duração são decisões de
produto (DRAFT), não exigências diretas dessas diretrizes.
