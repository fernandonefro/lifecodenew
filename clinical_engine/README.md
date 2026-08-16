# clinical_engine/ — ÓRFÃO / SUPERADO (não remover ainda)

Este diretório contém um motor de regras e um conjunto de golden cases que **não são
buildados nem executados** por nenhum pacote do monorepo:

- `clinical_rules_engine.ts` — classe `LifecodeClinicalRulesEngine`, **nunca importada** pelo
  fluxo NestJS. Usa a semântica ANTIGA de P2/P3 (P2 = hiperglicemia sustentada; P3 = TIR "no alvo"),
  **descontinuada** pelo ADR-0002.
- `golden_clinical_test_suite.ts` — 5 casos que rodam contra o motor órfão; **fora** do `roots`
  do jest da API (`apps/api/jest.config.js` usa `roots: ['<rootDir>/src']`).
- `versioned_clinical_rule_schema.json` — schema legado; colapsa governança num único `status`.
  **Superado** por `versioned_clinical_rule_schema.v2.json` (reconciliado com o ADR-0002).

## Fonte de verdade atual

A taxonomia, a governança e os avaliadores canônicos vivem em
`packages/shared/src/clinical-rules/` (ver `docs/adr/ADR-0002-motor-regras-clinicas.md`).
O motor de PRODUÇÃO permanece `apps/api/src/modules/observations/glucose.service.ts`
(comportamento legado, inalterado).

## Por que não foi removido

Conforme ADR-0002 §11/§12 e a regra de não excluir código órfão sem migração/documentação:
1. dependências identificadas: **nenhuma** (não referenciado por tsconfig/package.json);
2. lógica útil já migrada/reexpressa nos avaliadores puros de `@lifecode/shared`;
3. cobertura garantida pelos novos testes em `apps/api/src/modules/clinical-rules/*.spec.ts`;
4. remoção definitiva fica registrada como tarefa futura, após a ativação do novo motor em SHADOW.

**Não** adicione novas regras aqui. Use o registry declarativo em `@lifecode/shared/clinical-rules`.
