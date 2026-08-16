import {
  AlertDomain,
  AlertSubtype,
  DeploymentStatus,
  GovernanceStatus,
  RegulatoryAssessmentStatus,
  VersionedClinicalRule,
  RULE_REGISTRY,
  LEGACY_RULES,
  CANDIDATE_RULES,
  LEGACY_RULE_ALLOWLIST,
  SUBTYPES_BY_DOMAIN,
  canEmitInProduction,
  isInert,
  evaluateRuleUnderGovernance,
} from '@lifecode/shared';

function makeRule(over: Partial<VersionedClinicalRule>): VersionedClinicalRule {
  return {
    ruleCode: 'TEST-RULE',
    ruleVersion: '9.9.9',
    alertDomain: AlertDomain.CLINICAL,
    alertSubtype: AlertSubtype.HYPERGLYCEMIA_SUSTAINED,
    eligiblePopulation: 'test',
    entryCondition: 'test',
    deploymentStatus: DeploymentStatus.DISABLED,
    governanceStatus: GovernanceStatus.DRAFT,
    regulatoryAssessmentStatus: RegulatoryAssessmentStatus.PENDING,
    ...over,
  };
}

describe('Gate de governança — emissão em produção', () => {
  it('regra ACTIVE + RELEASE_APPROVED pode emitir', () => {
    const r = makeRule({
      deploymentStatus: DeploymentStatus.ACTIVE,
      governanceStatus: GovernanceStatus.RELEASE_APPROVED,
    });
    expect(canEmitInProduction(r).canEmit).toBe(true);
  });

  it('ACTIVE + CLINICALLY_APPROVED (sem RELEASE) NÃO pode emitir', () => {
    const r = makeRule({
      deploymentStatus: DeploymentStatus.ACTIVE,
      governanceStatus: GovernanceStatus.CLINICALLY_APPROVED,
    });
    const d = canEmitInProduction(r);
    expect(d.canEmit).toBe(false);
    expect(d.reason).toBe('NOT_RELEASE_APPROVED');
  });

  it('DISABLED + RELEASE_APPROVED NÃO pode emitir (não está ACTIVE)', () => {
    const r = makeRule({
      deploymentStatus: DeploymentStatus.DISABLED,
      governanceStatus: GovernanceStatus.RELEASE_APPROVED,
    });
    expect(canEmitInProduction(r).canEmit).toBe(false);
  });

  it('exceção legada só vale para códigos na allowlist', () => {
    const notAllowlisted = makeRule({
      ruleCode: 'FUTURE-RULE',
      ruleVersion: '1.0.0',
      deploymentStatus: DeploymentStatus.ACTIVE,
      governanceStatus: GovernanceStatus.LEGACY_UNREVIEWED,
    });
    const d = canEmitInProduction(notAllowlisted);
    expect(d.canEmit).toBe(false);
    expect(d.reason).toBe('LEGACY_EXCEPTION_NOT_ALLOWLISTED');
  });
});

describe('Registry — legado preservado, candidatas inertes', () => {
  it('as 4 regras legadas podem emitir (ACTIVE + LEGACY_UNREVIEWED na allowlist)', () => {
    expect(LEGACY_RULES).toHaveLength(4);
    for (const r of LEGACY_RULES) {
      const d = canEmitInProduction(r);
      expect(d.canEmit).toBe(true);
      expect(d.reason).toBe('LEGACY_ALLOWLISTED_ACTIVE');
    }
  });

  it('TODAS as regras candidatas são inertes (DRAFT/DISABLED, não emitem)', () => {
    expect(CANDIDATE_RULES.length).toBeGreaterThan(0);
    for (const r of CANDIDATE_RULES) {
      expect(r.deploymentStatus).toBe(DeploymentStatus.DISABLED);
      expect(r.governanceStatus).toBe(GovernanceStatus.DRAFT);
      expect(isInert(r)).toBe(true);
      expect(canEmitInProduction(r).canEmit).toBe(false);
    }
  });

  it('nenhuma regra do registry (fora as 4 legadas) está ACTIVE', () => {
    const active = RULE_REGISTRY.filter((r) => r.deploymentStatus === DeploymentStatus.ACTIVE);
    expect(active.map((r) => r.ruleCode).sort()).toEqual(
      ['CLIN-HYPER-KETONE', 'CLIN-HYPER-MARKED', 'CLIN-HYPO-LEVEL1', 'CLIN-HYPO-SEVERE'].sort(),
    );
  });

  it('allowlist legada é fixa (4 itens) e imutável', () => {
    expect(LEGACY_RULE_ALLOWLIST).toHaveLength(4);
    expect(() => (LEGACY_RULE_ALLOWLIST as any).push('X')).toThrow();
  });

  it('todo subtipo de regra pertence ao seu domínio', () => {
    for (const r of RULE_REGISTRY) {
      expect(SUBTYPES_BY_DOMAIN[r.alertDomain]).toContain(r.alertSubtype);
    }
  });
});

describe('Shadow — avaliação sob governança sem efeito colateral', () => {
  it('regra DRAFT/DISABLED com condição casada NÃO emite', () => {
    const draft = CANDIDATE_RULES[0];
    const out = evaluateRuleUnderGovernance(draft, true);
    expect(out.matched).toBe(true);
    expect(out.emit).toBe(false);
    expect(out.shadowRecorded).toBe(false); // DISABLED, não SHADOW
  });

  it('regra em SHADOW registra avaliação mas NÃO emite', () => {
    const shadow = makeRule({ deploymentStatus: DeploymentStatus.SHADOW });
    const out = evaluateRuleUnderGovernance(shadow, true);
    expect(out.emit).toBe(false);
    expect(out.shadowRecorded).toBe(true);
  });

  it('regra legada com condição casada emite', () => {
    const out = evaluateRuleUnderGovernance(LEGACY_RULES[0], true);
    expect(out.emit).toBe(true);
  });
});
