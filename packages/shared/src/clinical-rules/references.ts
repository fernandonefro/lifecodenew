import { RuleReference } from './rule-definition';

/**
 * Referências clínicas/regulatórias. IMPORTANTE: parâmetros OPERACIONAIS de duração
 * (60/180/30 min etc.) são decisões de PRODUTO (DRAFT), não exigências diretas destas
 * diretrizes. Ver docs/adr/ADR-0002-motor-regras-clinicas.md.
 */
export const CLINICAL_REFERENCES: Record<string, RuleReference> = {
  ADA_2026_S6: {
    label: 'ADA Standards of Care in Diabetes—2026, Section 6',
    url: 'https://diabetesjournals.org/care/article/49/Supplement_1/S132/163927/',
  },
  TIR_CONSENSUS: {
    label: 'International Consensus on Time in Range',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6973648/',
  },
  HYPERGLYCEMIC_CRISES_2024: {
    label: 'Hyperglycemic Crises in Adults With Diabetes: 2024 Consensus Report',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11272983/',
  },
  SBD: {
    label: 'Diretrizes da Sociedade Brasileira de Diabetes',
    url: 'https://diretriz.diabetes.org.br/',
  },
  ANVISA_SAMD: {
    label: 'Anvisa — RDC 657/2022 e SaMD (perguntas e respostas)',
    url: 'https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2022/software-como-dispositivo-medico-perguntas-e-respostas',
  },
};
