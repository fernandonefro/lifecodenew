# Matriz de Regras Clínicas/Operacionais — Preenchimento pelo Comitê Clínico

> **Objetivo:** para cada regra, o Comitê preenche os campos clínicos. Regras `DRAFT`/`DISABLED` **não** são
> emitidas em produção. As regras legadas já rodam hoje e estão documentadas **a partir do código** apenas
> para calibração — **não** representam parâmetros clinicamente validados e **não** devem ter seu
> comportamento alterado sem novo ciclo de aprovação + testes.
>
> **Regras da taxonomia (ADR-0001):** `priority` = só prioridade operacional/SLA. `alertDomain` ∈
> {`CLINICAL`, `DEVICE`, `CARE_MANAGEMENT`}; `CARE_GAP`/`OPPORTUNITY` são **subtipos** de `CARE_MANAGEMENT`.
> Lacunas de cuidado têm o **`CareGap` como fonte-da-verdade** — o alerta apenas o referencia
> (`careGapId`/`sourceEntityType`+`sourceEntityId`). TIR é **métrica longitudinal individual** (10–14 dias,
> idealmente ≥70% de dados válidos), **não** de tempo real; 70–180 mg/dL isolado é só armazenado.
> CGM offline = `DEVICE/CGM_DATA_GAP`. Durações são **derivadas no backend**. Contexto de risco é um
> **snapshot versionado** (`riskProfileCode` + `riskProfileVersion`). Enquadramento regulatório: **pendente
> de avaliação do responsável regulatório**.

## Campos de cada regra

`ruleCode` · `alertDomain` · `alertSubtype` · população elegível · condição de entrada · condição de saída ·
janela temporal · repetição · sintomas/modificadores · `priority` · SLA de reconhecimento · SLA de
intervenção · escalonamento · mensagem ao paciente · ação da equipe · racional clínico · referência ·
aprovador (UUID) · versão · contexto de risco (`riskProfileCode`/`riskProfileVersion`) ·
golden cases positivos · golden cases negativos · `deploymentStatus` · `governanceStatus`.

Legenda: ⬜ = a preencher pelo Comitê. `[código]` = comportamento **implantado** (não validado), extraído do
código atual apenas como referência.

---

## A. Regras legadas em produção (referência — `LEGACY_ACTIVE_UNREVIEWED`, revisão prioritária)

> ⚠️ **Não validadas por esta governança.** `deploymentStatus: ACTIVE`,
> `governanceStatus: LEGACY_UNREVIEWED`. Ver "Riscos clínicos legados" no ADR-0001.

### RULE `CLIN-HYPO-SEVERE`
- alertDomain: `CLINICAL` · alertSubtype: —
- população elegível: ⬜
- condição de entrada: `[glicemia < 54 mg/dL]` **ou** `[confusão/alteração de consciência]`
- condição de saída: ⬜ · janela temporal: `[leitura pontual]` · repetição: ⬜
- sintomas/modificadores: `[confusionOrAlteredConsciousness]`
- priority: `[P0]`
- SLA de reconhecimento: `[imediato — dueDate = agora]` · SLA de intervenção: ⬜ · escalonamento: ⬜
- mensagem ao paciente: `["Valor crítico detectado (…). Orientação de emergência disparada…"]`
- ação da equipe: ⬜ · racional clínico: ⬜ (neuroglicopenia iminente) · referência: ⬜ · aprovador: ⬜
- versão: `1.0.0` · contexto de risco: ⬜
- golden (+): `GOLDEN-01` (42 mg/dL + confusão) · golden (−): ⬜
- deploymentStatus: `ACTIVE` · governanceStatus: `LEGACY_UNREVIEWED`

### RULE `CLIN-HYPO-LEVEL1`
- alertDomain: `CLINICAL`
- condição de entrada: `[54–69 mg/dL]`
- priority: `[P1]` · SLA de reconhecimento: `[+4h — SLA genérico, ver risco legado #1]`
- mensagem ao paciente: `["Alteração glicêmica expressiva (…). Revisar plano…"]`
- versão: `1.0.0` · golden (+): `GOLDEN-02`
- deploymentStatus: `ACTIVE` · governanceStatus: `LEGACY_UNREVIEWED`
- demais campos clínicos: ⬜

### RULE `CLIN-HYPER-KETONE`
- alertDomain: `CLINICAL`
- condição de entrada: `[> 300 mg/dL com vômito/cetona OU confusão]`
- priority: `[P0]` · SLA de reconhecimento: `[imediato]`
- versão: `1.0.0` · golden (+): `GOLDEN-03`
- deploymentStatus: `ACTIVE` · governanceStatus: `LEGACY_UNREVIEWED`
- demais campos clínicos: ⬜

### RULE `CLIN-HYPER-MARKED`
- alertDomain: `CLINICAL`
- condição de entrada: `[> 250 mg/dL isolado]` — ⚠️ **sem duração/repetição/contexto (risco legado #2)**
- priority: `[P1]`
- ⚠️ **sem golden case dedicado hoje (risco legado #3)** — candidato a novo golden (+/−)
- versão: `1.0.0`
- deploymentStatus: `ACTIVE` · governanceStatus: `LEGACY_UNREVIEWED`
- demais campos clínicos: ⬜

---

## B. Regras candidatas (DRAFT / DISABLED — inertes até aprovação)

### RULE `CLIN-HYPER-SUSTAINED`
- alertDomain: `CLINICAL` · alertSubtype: —
- população elegível: ⬜
- condição de entrada: ⬜ *(candidato: 180–250 mg/dL)*
- condição de saída: ⬜ *(candidato: < 180 mg/dL por N min)*
- janela temporal: ⬜ *(candidato: sustentado > ___ min — **derivado no backend**)*
- repetição: ⬜ *(re-emitir a cada ___ h? suprimir duplicados na janela?)*
- sintomas/modificadores: ⬜ *(trend/IOB = futuros, não bloqueiam v1)*
- priority: ⬜ *(candidato P2)*
- SLA de reconhecimento: ⬜ · SLA de intervenção: ⬜ · escalonamento: ⬜
- mensagem ao paciente: ⬜ · ação da equipe: ⬜ · racional clínico: ⬜ · referência: ⬜ *(ADA/SBD ____)*
- aprovador (UUID): ⬜ · versão: `0.1.0-DRAFT` · contexto de risco: ⬜
- golden (+): ⬜ · golden (−): ⬜
- deploymentStatus: `DISABLED` · governanceStatus: `DRAFT`

### RULE `DEVICE-CGM-DATA-GAP`
- alertDomain: `DEVICE` · alertSubtype: —
- população elegível: ⬜ *(pacientes com CGM ativo)*
- condição de entrada: ⬜ *(candidato: sem leitura há > ___ min — **derivado** de `sensorDisconnectionMinutes`)*
- condição de saída: ⬜ *(reconexão do sensor)* · janela temporal: ⬜ · repetição: ⬜
- priority: ⬜ *(candidato P2 ou P3 — decidir se gap de dado é urgência operacional)*
- SLA de reconhecimento: ⬜ · SLA de intervenção: ⬜ · escalonamento: ⬜
- mensagem ao paciente: ⬜ *("Aproxime o celular do sensor / verifique o Bluetooth")*
- ação da equipe: ⬜ · racional clínico: ⬜ *(perda de observabilidade, não evento glicêmico)*
- referência: ⬜ · aprovador (UUID): ⬜ · versão: `0.1.0-DRAFT` · contexto de risco: ⬜
- golden (+): ⬜ · golden (−): ⬜
- deploymentStatus: `DISABLED` · governanceStatus: `DRAFT`

### RULE `CAREMGMT-TIR-BELOW-TARGET`
- alertDomain: `CARE_MANAGEMENT` · alertSubtype: `CARE_GAP` *(ou `OPPORTUNITY` — decidir)*
- **fonte-da-verdade:** modelo **`CareGap`** — o alerta **referencia** o gap (`careGapId`), **não** o duplica
- população elegível: ⬜
- condição de entrada: ⬜ *(TIR individual em janela **10–14 dias** < meta individual ___%,
  com **≥ 70% de dados válidos** na janela)*
- condição de saída: ⬜ · janela temporal: `10–14 dias` *(longitudinal individual, **não** tempo real)*
- repetição: ⬜ *(semanal?)*
- priority: ⬜ *(candidato P3)*
- SLA de reconhecimento: ⬜ · SLA de intervenção: ⬜ · escalonamento: ⬜
- mensagem ao paciente: ⬜ · ação da equipe: ⬜ · racional clínico: ⬜ · referência: ⬜
- aprovador (UUID): ⬜ · versão: `0.1.0-DRAFT` · contexto de risco: ⬜
- golden (+): ⬜ · golden (−): ⬜
- deploymentStatus: `DISABLED` · governanceStatus: `DRAFT`

---

## Pontos que exigem decisão clínica (checklist do Comitê)

- [ ] **Revisão prioritária dos riscos clínicos legados** (SLA +4h genérico incl. 54–69 mg/dL; `>250` isolado
      sem duração/contexto; falta de golden para `CLIN-HYPER-MARKED`).
- [ ] Limiares, janelas e repetição de cada regra DRAFT.
- [ ] Meta individual de TIR e mínimo de dados válidos (≥70%?) na janela de 10–14 dias.
- [ ] Definição dos `riskProfileCode` e versionamento do contexto de risco.
- [ ] SLA de reconhecimento × intervenção por prioridade; canais/tempos de escalonamento.
- [ ] Subtipos de `CARE_MANAGEMENT` (`CARE_GAP` × `OPPORTUNITY`) e mapeamento para `CareGap.gapType`.
- [ ] Independência priority × domain (ex.: um `DEVICE` pode ser P1?).
- [ ] Mensagens ao paciente e ações da equipe por regra.
- [ ] Enquadramento regulatório (classe IEC 62304, ANVISA) — **responsável regulatório**.
- [ ] Aprovador (UUID de médico) por regra.
- [ ] Golden cases positivos e negativos — **pré-requisito para tocar `golden-cases.data.ts`**.
