/**
 * @lifecode/shared — Motor de regras clínicas/operacionais (fonte única de verdade).
 *
 * Tipos/enums, registry declarativo versionado, gate de governança e avaliadores puros.
 * NÃO importa nada do runtime da API; é consumido pelo fluxo NestJS (futuramente, em SHADOW).
 * Ver docs/adr/ADR-0001 e docs/adr/ADR-0002.
 */
export * from './alert-domain.enum';
export * from './alert-subtype.enum';
export * from './governance.enum';
export * from './alert-priority';
export * from './risk-context';
export * from './rule-approval';
export * from './incident-lifecycle';
export * from './cgm-device-config';
export * from './rule-definition';
export * from './references';
export * from './registry';
export * from './governance-gate';
export * from './shadow';
export * from './evaluators/glycemia';
export * from './evaluators/tir';
export * from './evaluators/cgm-gap';
