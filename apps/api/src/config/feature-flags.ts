/**
 * Feature flags do motor de regras clínicas (ADR-0002).
 *
 * Padrão: TUDO DESLIGADO. O caminho de produção legado é o único ativo por default.
 */

/** Kill switch global — desligado impede QUALQUER avaliação sob a nova governança. */
export function isClinicalEngineEnabled(): boolean {
  return process.env.CLINICAL_ENGINE_RULES_ENABLED === 'true';
}

/**
 * Modo SHADOW do motor de glicemia: avalia as regras candidatas apenas para registro
 * desidentificado/auditável, SEM criar alerta/tarefa/mensagem/escalonamento.
 * Requer também o kill switch global ligado.
 */
export function isGlucoseShadowEnabled(): boolean {
  return isClinicalEngineEnabled() && process.env.CLINICAL_ENGINE_SHADOW_ENABLED === 'true';
}
