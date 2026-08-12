# Diretrizes de Rastreabilidade & Regras SaMD - Projeto Lifecode

## 1. Visão do Produto & Métrica North Star
* **Produto**: Plataforma de Cuidado e Gestão do Diabetes Lifecode (SaMD - Software as a Medical Device).
* **Métrica North Star**: **Time in Range (TIR) médio do paciente ≥ 70% mantido por +90 dias sem hipoglicemia severa (< 54 mg/dL)**.

## 2. Restrições Regulatórias Obrigatórias (Rigor Máximo)
Todo agente, desenvolvedor ou auditor atuando no código deste repositório DEVE obrigatoriamente cumprir:
1. **ANVISA RDC 751/2022 e RDC 657/2022**: Classificação SaMD Classe II (Suporte à Decisão com confirmação manual explícita do usuário para alterações de dosagem).
2. **IEC 62304:2006/AMD1:2015**:
   - **Class A**: Utilitários administrativos, cadastro e lembretes secundários.
   - **Class B**: Ingestão de glicemia capilar, gráficos AGP, sincronização offline.
   - **Class C**: Motor de Alertas Críticos de Hipoglicemia/Hiperglicemia (P0) e Calculador de Dose de Bolus. Exige 100% de cobertura de testes unitários determinísticos.
3. **ISO 14971:2019 (Gestão de Riscos)**: Matriz de mitigação de riscos fisiológicos (ex: trava contra erros de digitação, validação de limites de 10 a 700 mg/dL, desconto de Insulina Ativa IOB para prevenir insulin stacking).
4. **LGPD (Lei 13.709/2018) & HIPAA**: Dados de saúde (PHI). Exige criptografia AES-256 em repouso, TLS 1.3 em trânsito, auditoria imutável (Audit Trail com HMAC) e isolamento Multi-tenant estrito via PostgreSQL Row-Level Security (RLS).
5. **Resolução CFM nº 2.314/2022**: Assinatura digital qualificada via Certificado ICP-Brasil para todas as prescrições médicas e alterações de metas clínicas.

## 3. Diretriz de Falsos Negativos (Zero Tolerance)
* O Motor de Regras Clínicas (`clinical_engine/clinical_rules_engine.ts`) **NUNCA** pode gerar um falso negativo para alertas de prioridade `P0_CRITICAL` (Hipoglicemia < 54 mg/dL ou < 70 mg/dL com queda rápida `DOUBLE_DOWN`, ou Hiperglicemia > 300 mg/dL com sintomas de Cetoacidose).

## 4. Índice de Arquivos do Workspace (Rastreabilidade Total)
- `AGENTS.md`: Guia mestre do repositório para agentes AI.
- `docs/context_traceability_matrix.md`: Matriz de Rastreabilidade PRD vs Código.
- `backlog/lifecode_backlog.json`: Backlog estruturado de histórias P0, Tasks e Subtasks.
- `decisions/decisions_template.md`: Registros de Decisões de Arquitetura (ADRs D-01 a D-08).
- `schemas/fhir_schemas.ts`: Tipos TypeScript canônicos no padrão HL7 FHIR.
- `api/openapi_spec.yaml`: Especificação OpenAPI 3.0 para Ingestão e Fila de Alertas.
- `security/rls_policies.sql` & `security/multitenant_rbac_ca01.ts`: Isolamento RLS e suíte de aceite CA-01.
- `clinical_engine/`: Motor de regras, esquema de regras versionadas e suíte de 5 Casos-Ouro.
