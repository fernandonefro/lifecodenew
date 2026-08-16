# ADR-0001 — Taxonomia de Alertas: Prioridade Operacional desacoplada de Domínio Clínico

- **Status:** Direção **aprovada** (Produto). Detalhes clínicos e regulatórios: pendentes (ver §Governança e §Questões em aberto).
- **Data:** 2026-08-14
- **Decisores:** Produto, Engenharia
- **Pendências externas:** decisão clínica (limiares/SLA/golden cases) e enquadramento regulatório.
- **Relacionado:** [Matriz do Comitê](../committee/matriz-governanca-regras-alertas.md)
- **Nota de escopo:** este ADR **não** implementa nada. Não altera banco, schema, DTO, motor clínico,
  enums, migrações, golden cases ou comportamento de produção. A preparação técnica ("etapa C inerte")
  será decidida separadamente **após** a revisão deste documento.

## Contexto

A base atual mistura dois eixos conceituais sob um único campo de severidade:

- `packages/shared/src/enums/alert-severity.enum.ts` documenta `P2_GAP = "lacuna de cuidado"` e
  `P3_OPPORTUNITY = "oportunidade"`, tratando a **prioridade** como se fosse o **tipo clínico** do alerta.
- `clinical_engine/clinical_rules_engine.ts` (classe `LifecodeClinicalRulesEngine`, **não** ligada ao fluxo
  NestJS) usa P2/P3 como **severidade glicêmica em tempo real** (hiperglicemia sustentada; "Time in Range").

São semânticas **incompatíveis**. O motor que roda em produção
(`apps/api/src/modules/observations/glucose.service.ts`, `evaluateGlucoseAlertRules`) só emite **P0/P1**.

## Decisão

1. **`priority` (P0 | P1 | P2 | P3) significa EXCLUSIVAMENTE prioridade operacional / SLA** — nunca o
   tipo ou o significado clínico do alerta.

2. Modelar eixos **ortogonais** por alerta:

   | Campo | Valores | Papel |
   |---|---|---|
   | `priority` | `P0` \| `P1` \| `P2` \| `P3` | urgência operacional / SLA |
   | `alertDomain` | `CLINICAL` \| `DEVICE` \| `CARE_MANAGEMENT` | natureza do alerta |
   | `alertSubtype` | ex.: `CARE_GAP`, `OPPORTUNITY` (dentro de `CARE_MANAGEMENT`) | especialização do domínio |
   | `ruleCode` | string (ex.: `CLIN-HYPO-SEVERE`) | regra clínica/operacional específica |
   | `ruleVersion` | SemVer (ex.: `1.0.0`) | versão da regra que disparou |
   | **contexto de risco** | `riskProfileCode` + `riskProfileVersion` (snapshot) | perfil de risco usado **no momento da decisão** |

3. **`alertDomain` tem apenas três valores: `CLINICAL`, `DEVICE`, `CARE_MANAGEMENT`.**
   `CARE_GAP` e `OPPORTUNITY` **não** são domínios concorrentes — são **subtipos** dentro de
   `CARE_MANAGEMENT` (`alertSubtype`).

4. **Fonte-da-verdade de lacunas de cuidado = modelo `CareGap` existente.** Um `Alert` **não** duplica o
   care gap; quando um alerta de gestão de cuidado for necessário, ele **referencia** o `CareGap` de origem —
   via `careGapId` (ou par genérico `sourceEntityType` = `CARE_GAP` + `sourceEntityId`). O `Alert` carrega
   apenas o roteamento/priorização; o dado clínico do gap vive no `CareGap`.

5. **Contexto de risco versionado (snapshot).** Em vez de um `patientRiskProfile` mutável, o alerta guarda
   `riskProfileCode` + `riskProfileVersion` capturados no instante da avaliação. O perfil do paciente pode
   mudar depois; o alerta preserva **rastreabilidade** sobre o contexto que motivou a decisão.

6. **Time in Range (TIR) é uma métrica longitudinal INDIVIDUAL do paciente**, calculada tipicamente em
   janela de **10–14 dias**, idealmente com **≥ 70% de dados válidos** na janela. **Não** é métrica de tempo
   real e **não** é "populacional" por definição — embora possa **posteriormente alimentar** a gestão
   populacional. Uma leitura isolada entre **70–180 mg/dL não é TIR e não emite P3**: é apenas **armazenada**.
   Se o TIR individual ficar abaixo da meta individual, isso pode gerar um item de `CARE_MANAGEMENT`
   (subtipo `CARE_GAP`/`OPPORTUNITY`), materializado como `CareGap` (§4).

7. **Perda de conexão do CGM → `alertDomain = DEVICE`, `ruleCode = CGM_DATA_GAP`.** Jamais evento glicêmico.

8. `sustainedDurationMinutes` e `sensorDisconnectionMinutes` são **derivados no backend** a partir do
   histórico e dos timestamps. **Não** são aceitos do cliente como fonte primária.

9. `trendArrow` e `IOB` são **modificadores opcionais futuros** e **não** bloqueiam a v1.

10. **O comportamento de produção atual (P0/P1) é preservado integralmente** até aprovação clínica e testes
    verdes. Nenhuma mudança de severidade/SLA vigente.

11. **Enquadramento regulatório = "pendente de avaliação do responsável regulatório".**
    **Não** declarar IEC 62304 Classe C automaticamente e **não** preencher `anvisaClearanceHash`.

## Governança e ciclo de vida das regras

As regras hoje em produção **não** são classificadas retroativamente como `ACTIVE_PRODUCTION` desta
governança — elas estão **implantadas**, mas ainda **não** passaram pela aprovação formal deste processo.
Registrar dois eixos independentes de status:

| Eixo | Valores (mínimos) | Regras atuais (P0/P1) |
|---|---|---|
| `deploymentStatus` | `DISABLED` \| `SHADOW` \| `ACTIVE` | `ACTIVE` |
| `governanceStatus` | `LEGACY_UNREVIEWED` \| `DRAFT` \| `CLINICALLY_APPROVED` \| (estados futuros) | `LEGACY_UNREVIEWED` |

As definições completas desses estados e a razão de serem **duas dimensões independentes** estão na seção
"Bloqueio da etapa C" abaixo. Rótulo combinado para as regras legadas: **`LEGACY_ACTIVE_UNREVIEWED`**
(= `deploymentStatus: ACTIVE` + `governanceStatus: LEGACY_UNREVIEWED`).

Regras candidatas novas (P2/P3 e outras) nascem `deploymentStatus: DISABLED` +
`governanceStatus: DRAFT` e só passam a `SHADOW`/`ACTIVE` após aprovação clínica + golden cases.

## Modelo de ativação (proposta para o futuro — não implementar agora)

Evitar uma única flag acoplada ao nome "P2P3". Em vez disso:

- **Kill switch global** (ex.: `CLINICAL_ENGINE_RULES_ENABLED`) que, desligado, impede a avaliação de
  **qualquer** regra sob esta governança — mecanismo de emergência.
- **Ativação granular por regra**, chaveada por **`ruleCode` + `ruleVersion`** (ex.: um registro/allowlist
  de regras habilitadas, com a versão exata). Assim uma regra específica pode ser ligada/desligada sem afetar
  as demais, e a versão ativa fica rastreável.
- Uma regra só é avaliada se: kill switch global ligado **E** `(ruleCode, ruleVersion)` habilitada **E**
  `deploymentStatus = ACTIVE` **E** `governanceStatus = CLINICALLY_APPROVED`.

## Bloqueio da etapa C: reconciliação do schema de regras versionadas

O arquivo `clinical_engine/versioned_clinical_rule_schema.json` é **legado e incompatível** com a governança
proposta neste ADR. Registra-se, de forma explícita, que:

- **É bloqueante:** **nenhuma** regra nova deve ser implementada ou ativada por esse schema **antes** da sua
  reconciliação ou substituição. Isso inclui a etapa C inerte — ela **não** pode prosseguir enquanto o schema
  não for reconciliado.
- **`governanceStatus` e `deploymentStatus` são dimensões diferentes e independentes** — o schema legado
  colapsa ambas em um único campo `status`, o que é insuficiente.
- **`deploymentStatus`** deve prever, no mínimo:
  - `DISABLED` — regra não avaliada;
  - `SHADOW` — regra avaliada e registrada para observação, **sem** efeito no paciente/fila;
  - `ACTIVE` — regra em efeito pleno.
- **`governanceStatus`** deve distinguir, no mínimo:
  - `LEGACY_UNREVIEWED` — implantada, ainda não revisada por esta governança;
  - `DRAFT` — proposta, em elaboração;
  - `CLINICALLY_APPROVED` — aprovada pelo Comitê Clínico;
  - além de estados futuros (ex.: `DEPRECATED`, `SUSPENDED`) conforme necessário.
- **`samdSafetyClass` não pode ser presumida nem preenchida** antes da avaliação do responsável regulatório
  (o schema legado sugere um enum de classe, mas seu preenchimento aqui seria indevido).
- **A reconciliação/substituição do schema é uma tarefa própria e anterior** a qualquer alteração de banco,
  migração ou motor clínico. Ordem obrigatória: **(1)** reconciliar/substituir o schema versionado →
  **(2)** etapa C inerte (colunas/enums atrás de kill switch + habilitação por `ruleCode`/`ruleVersion`) →
  **(3)** regras clínicas aprovadas.

## Plano de compatibilidade com os enums atuais

- **`AlertSeverity` mantém os valores `P0..P3`.** A coluna `alerts.severity` é `String` e `alerts.service.ts`
  ordena a fila por `SEVERITY_RANK = { P0:0, P1:1, P2:2, P3:3 }`. Portanto **apenas os comentários** do enum
  seriam corrigidos (de "GAP/OPPORTUNITY" para "prioridade operacional"); **nenhum valor muda**. Consumidores
  (`apps/web/src/app/alerts/page.tsx`, `apps/mobile/src/components/PriorityCard.tsx`) seguem funcionando.
- Um enum aditivo `AlertDomain` (`CLINICAL | DEVICE | CARE_MANAGEMENT`) e o `alertSubtype` seriam
  introduzidos; os campos `alertDomain`, `alertSubtype`, `ruleCode`, `ruleVersion`, `riskProfileCode`,
  `riskProfileVersion` e a referência ao `CareGap` entrariam como **nullable** — linhas existentes ficam `NULL`.
- `CARE_MANAGEMENT` **referencia** o `CareGap`, não o duplica (§4).

> Estas mudanças de schema/enums descrevem a **intenção**; sua execução é a etapa C inerte, ainda **não
> autorizada**.

## Riscos clínicos legados (registro explícito — NÃO validados)

Os comportamentos abaixo estão **implantados hoje** e serão **temporariamente preservados** para evitar
alteração não aprovada. **Não** representam parâmetros clinicamente validados e **exigem revisão prioritária
do Comitê Clínico**:

1. **SLA genérico de P1 = +4h**, aplicado inclusive a **hipoglicemia de 54–69 mg/dL** — faixa que pode
   justificar reconhecimento/intervenção mais rápidos que 4 horas.
2. **`> 250 mg/dL isoladamente → P1`**, **sem** considerar duração, repetição, contexto (jejum/pós-prandial)
   ou tendência.
3. **Ausência de golden case específico para `CLIN-HYPER-MARKED`** (a regra `> 250` não tem caso de
   verificação dedicado hoje).

## Consequências

**Positivas**
- Prioridade e significado clínico deixam de colidir; P2/P3 podem ser introduzidos sem reinterpretar P0/P1.
- `CareGap` como fonte-da-verdade evita dupla verdade sobre lacunas de cuidado.
- Snapshot de risco versionado dá rastreabilidade da decisão.
- Ativação granular por `ruleCode/ruleVersion` + kill switch reduz risco na futura ativação.

**Negativas / dívidas**
- Débito: o `prisma/schema.prisma` na **raiz** está desatualizado (o `Alert` lá não tem os campos de fila).
  O canônico é `packages/database/prisma/schema.prisma`. Precisa ser reconciliado/removido.
- Os riscos clínicos legados acima permanecem ativos até a revisão do Comitê.

## Questões em aberto (decisão clínica/produto)

Ver a matriz preenchível em [docs/committee/matriz-governanca-regras-alertas.md](../committee/matriz-governanca-regras-alertas.md):
limiares/janelas/repetição por regra; meta individual de TIR e mínimo de dados válidos; definição dos
`riskProfileCode`/versões; SLAs de reconhecimento × intervenção; escalonamento; mensagens ao paciente;
enquadramento regulatório; aprovador (UUID); golden cases (+/−); e a **revisão prioritária dos riscos
legados** acima.
