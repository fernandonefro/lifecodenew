# CONVERSAS E CONTEXTO — Memória da Sessão de Scaffolding

> Este arquivo captura tudo que ficou apenas no histórico da conversa e não está documentado em código.  
> É essencial para o Claude Code entender o raciocínio por trás das escolhas e os limites do que foi feito.

---

## 1. Contexto de Negócio e Decisões de Escopo

### O que é o produto (em palavras do dono)
O Lifecode é uma plataforma de **gestão de pacientes crônicos de alto risco** — o foco inicial é **diabetes mellitus tipo 2 (DM2)**. O modelo de negócio é B2B: a operadora de saúde ou clínica contrata a plataforma para monitorar a carteira de pacientes com diabetes.

O diferencial do produto é o **circuito assistencial fechado**:
1. Paciente registra glicemia no app mobile
2. Motor de regras detecta emergência (P0: hipoglicemia grave)
3. Alerta vai para a fila de uma equipe de navegadores/enfermeiros
4. Navegador assume o alerta, contata o paciente, registra a conduta
5. Alerta é fechado com registro auditável
6. Operadora vê o custo assistencial reduzido via analytics

### Prioridade máxima: zero falsos negativos em P0
A instrução explícita do dono do produto foi: **"Em sistemas de gestão assistencial, a integridade do circuito operacional e dos guardrails de segurança clínica prevalece sobre qualquer dashboard analítico. Garantir zero falsos negativos em situações críticas (P0) é o pré-requisito não negociável para o lançamento do piloto."**

Isso significa: **o motor de regras clínicas nunca pode deixar passar uma emergência**, mesmo que isso gere falsos positivos (alertas desnecessários são tolerados; alertas faltantes não são).

### A classificação SaMD
O produto foi especificado como **SaMD (Software as a Medical Device)** — isso implica:
- Regulação pela ANVISA (RDC 657/2022 para SaMD)
- Requisitos de auditoria e rastreabilidade inegociáveis
- Os "Golden Cases Clínicos" em `packages/shared/src/testing/golden-cases.data.ts` são imutáveis e precisam de aprovação formal do Comitê Clínico para qualquer alteração
- A coluna `loincCode` nas observações não é decorativa — é o identificador LOINC oficial da medição glicêmica (`15074-8`)

---

## 2. Requisitos Recebidos por Chat (não documentados em PRD)

### Estrutura dos Usuários (7 Roles)
O dono do produto especificou explicitamente 7 papéis, e insistiu que fossem em **português**:
- `PACIENTE`, `CUIDADOR`, `MEDICO`, `NAVEGADOR`, `GESTOR_CLINICA`, `ANALISTA_OPERADORA`, `ADMIN`

Uma versão anterior usava `PHYSICIAN`, `NURSE`, `CARE_GIVER` (inglês) — foi rejeitada. O Claude Code deve manter os nomes em português.

### Motor de Alertas P0-P3
Regras clínicas definidas por chat (não estão escritas em nenhum arquivo de spec, mas estão implementadas em `glucose.service.ts`):
- **P0**: glicemia < 54 mg/dL OU sintoma de confusão/alteração de consciência OU glicemia > 300 + sinais de cetose — SLA: **imediato**
- **P1**: glicemia 54–69 mg/dL (hipoglicemia leve) OU glicemia > 250 — SLA: **4 horas**
- **P2**: DESCONHECIDO — não implementado, enum existe
- **P3**: DESCONHECIDO — não implementado, enum existe

### Tiers de Risco (Estratificação da Operadora)
Definição dada por chat para os 3 tiers (US-21):
- **Tier 3 (Alto Risco)**: HbA1c > 9.0% OU hipoglicemias recorrentes recentes OU eGFR < 45 OU albuminúria > 300 OU complicações vasculares ativas
- **Tier 2 (Risco Moderado)**: HbA1c 7.5%–9.0% OU controle errático OU ausência de exames periódicos nos últimos 6 meses
- **Tier 1 (Baixo Risco)**: HbA1c < 7.5% E TIR ≥ 70% E exames em dia

> ⚠️ A nomenclatura no schema Prisma está **invertida** em relação ao que o produto comunica ao usuário:  
> `TIER_1_HIGH` no banco = "Tier 3 / Alto Risco" na UI  
> `TIER_3_LOW` no banco = "Tier 1 / Baixo Risco" na UI  
> Isso é uma dívida de nomenclatura — o time decidiu não corrigir para não quebrar o schema durante o piloto.

### Care Gaps Monitoradas (US-22)
Exames que geram lacuna de cuidado quando vencidos:
- HbA1c: > 6 meses sem registro válido
- Rastreio Renal: eGFR e relação albumina/creatinina ausentes
- Mapeamento de Retina: fundo de olho vencido
- Exame do Pé: podologia vencida
- Consulta periódica com endocrinologista ou nutricionista

---

## 3. Abordagens Rejeitadas pelo Dono do Produto

### ❌ Microserviços (rejeitado)
Foi sugerido separar em microserviços (Observations Service, Alerts Service, Analytics Service). O dono rejeitou: **"A equipe de piloto é pequena. Microserviços adicionam latência e complexidade operacional sem ganho real."** Usar NestJS Monólito Modular até escalar para >50k pacientes.

### ❌ Schema por tenant no PostgreSQL (rejeitado)
Criar um schema PostgreSQL separado por operadora/tenant foi avaliado. Rejeitado porque complica migrações e não oferece ganho real de isolamento para o volume do piloto.

### ❌ `createZodDto()` como base de DTO (rejeitado por limitação técnica)
Tentado inicialmente. Causava erro TypeScript TS2509 quando o schema Zod usava `.transform()`. Solução adotada: `class-validator` decorators nos DTOs, Zod apenas para tipos no shared.

### ❌ Next.js sem `output: 'standalone'` (rejeitado)
A primeira versão do Dockerfile web não usava `output: 'standalone'` no Next.js config, causando build com dependências incorretas. Foi adicionado ao `apps/web/next.config.js`.

---

## 4. Preferências Expressas pelo Dono do Produto

- **Português no código de domínio**: Nomes de roles, status de alerts, tipos de gaps — tudo em português nos enums do schema Prisma e do `@lifecode/shared`
- **SaMD como norte**: Toda decisão de arquitetura deve ser justificável para um auditor de software médico
- **Evidência antes de analytics**: O circuito assistencial (ingestão → alerta → fila → conduta → fechamento) tem prioridade absoluta sobre dashboards bonitos
- **LGPD não é opcional**: Toda nova funcionalidade deve considerar consentimento, retenção e minimização de dados desde o design
- **Piloto antes de perfeição**: Aceitou dados mockados no analytics da operadora para não atrasar o lançamento

---

## 5. Raciocínio por Trás de Escolhas Atuais

### Por que `.npmrc` com `shamefully-hoist=true`?
O pnpm usa um virtual store de dependências que coloca os módulos em caminhos fora do `node_modules` convencional. O TypeScript (`tsc`) não consegue resolver módulos via esses paths dentro de containers Docker Alpine (sem symlinks configurados). A opção `shamefully-hoist` força o pnpm a criar um `node_modules` flat — igual ao npm — que o tsc resolve normalmente. O nome é propositalmente alarmista (o pnpm desencoraja o uso), mas é a solução pragmática enquanto não se configura um bundler alternativo.

### Por que `PrismaService` usa `as any`?
O `PrismaClient` tipado é gerado pelo `prisma generate` baseado no `schema.prisma`. Sem rodar a migration e o generate em ambiente real, o TypeScript não conhece os modelos (`patient`, `clinicalObservation`, etc.) como propriedades do client. O `as any` é um desbloqueio temporário de compilação — **deve ser removido após a migration rodar** (item B1 do backlog).

### Por que a nomenclatura de Tier no banco é invertida?
Foi um erro de design inicial que se descobriu tarde. No banco: `TIER_1_HIGH` = alto risco (mais grave). Na comunicação com o usuário, o produto usa "Tier 3 = Alto Risco" (seguindo padrões da ANS). A correção envolveria uma migration de dados — decidiu-se manter para o piloto e corrigir na v2.

---

## 6. Estado da Sessão ao Encerrar

- A sessão durou múltiplas horas de scaffolding e resolução de erros de build Docker
- O último estado confirmado: **build Docker da API passou** (`#29 DONE` no output do `--progress=plain`)
- O build Docker do Web estava em resolução — a correção da pasta `public` foi aplicada mas **não confirmada**
- O sistema nunca foi acessado via navegador (nenhuma URL foi testada manualmente)
- Nenhuma migration foi rodada — o banco está vazio
- Nenhum seed foi criado
- Os testes unitários e E2E nunca foram executados
- O CORS está configurado como `origin: '*'` — **não está pronto para produção real**
