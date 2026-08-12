# Documento de Decisão Técnica e Negócios (ADR & Business Decision Matrix)
**Projeto**: Plataforma de Cuidado e Gestão do Diabetes Lifecode  
**Domínio**: Software como Dispositivo Médico (SaMD) | Saúde Digital  
**Objetivo**: Resolução das Pendências de Arquitetura e Negócio (D-01 a D-08) Pré-Sprint 1  
**Status**: DRAFT FOR BOARD APPROVAL  
**Classificação de Segurança**: Confidencial / Saúde Sensível  

---

## Estrutura Padrão do Template de Decisão (ADR / BDM Framework)

Cada pendência (D-01 a D-08) é formalizada utilizando a estrutura padronizada descrita abaixo:

```
+------------------------------------------------------------------------------------+
| ID DA DECISÃO: D-XX | TÍTULO DA DECISÃO                                           |
+------------------------------------------------------------------------------------+
| 1. CONTEXTO CLÍNICO, TÉCNICO & REGULATÓRIO                                         |
| 2. MATRIZ DE CRITÉRIOS DE AVALIAÇÃO (Peso 1 a 5)                                   |
| 3. ANÁLISE COMPARATIVA DE OPÇÕES                                                   |
| 4. RECOMENDAÇÃO CONJUNTA (TECH LEAD + PM + REGULATORY)                             |
| 5. PLANO DE AÇÃO E IMPACTO NO BACKLOG / ROADMAP                                    |
| 6. GOVERNANÇA DE APROVAÇÃO (Assinaturas Exigidas)                                 |
+------------------------------------------------------------------------------------+
```

---

## Detalhamento das Decisões Pendentes (D-01 a D-08)

### D-01: Estratégia de Ingestão de Dados de Sensores CGM (Continuous Glucose Monitor)
* **Decisão Recomendada**: **Opção C (Híbrida)**. API Oficial Dexcom/Abbott LibreView no MVP + Driver BLE Genérico para glicômetros capilares (BGM).

### D-02: Enquadramento Regulatório do Calculador de Bolus (SaMD Classe II vs Classe III ANVISA)
* **Decisão Recomendada**: **Opção B (SaMD Classe II ANVISA com Trava de Segurança e Confirmação Manual)**.

### D-03: Arquitetura de Banco de Dados de Séries Temporais & Criptografia de Dados de Saúde
* **Decisão Recomendada**: **Opção A (TimescaleDB sobre PostgreSQL com Criptografia em Repouso AES-256 e Partitioning por Paciente)**.

### D-04: Estratégia de Autenticação, IAM e Certificação Digital para Médicos (ICP-Brasil)
* **Decisão Recomendada**: **Keycloak/Auth0 + Integrador de Provedor de Serviço de Confiança (PSC - BirdID, VIDaaS)** via OAuth2 PKCE.

### D-05: Mecanismo de Tolerância a Falhas e Alertas de Emergência em Tempo Real
* **Decisão Recomendada**: **Arquitetura de Alertas de 4 Níveis em Cascata com Apple Critical Alerts Entitlement e Android Foreground High-Priority Channel**.

### D-06: MLOps, Versionamento e Validação de Algoritmos Clínicos Preditivos
* **Decisão Recomendada**: **Abordagem Determinística Regrada para a Sprint 1 / MVP (Garantia de Aprovação Rápida SaMD Classe II)**.

### D-07: Estratégia Multi-Tenant & Isolamento de Dados LGPD/HIPAA
* **Decisão Recomendada**: **Opção C (Shared Database + PostgreSQL RLS)**.

### D-08: Seleção da Stack Mobile (React Native vs Flutter vs Nativo Swift/Kotlin)
* **Decisão Recomendada**: **Flutter com Módulos Nativos Swift/Kotlin para o Driver BLE Background**.

---

## Formato da Matriz de Aprovação Executiva (Sign-off Table)

| Papel | Nome do Responsável | Parecer | Assinatura Digital | Data |
| :--- | :--- | :---: | :---: | :---: |
| **Tech Lead / Software Architect** | [Nome Engineer] | [ ] Aprovado [ ] Rejeitado | ____________________ | ____/____/2026 |
| **Senior Product Manager (PM)** | [Nome Product] | [ ] Aprovado [ ] Rejeitado | ____________________ | ____/____/2026 |
| **Regulatory & Quality Manager (RA/QA)** | [Nome Regatório] | [ ] Aprovado [ ] Rejeitado | ____________________ | ____/____/2026 |
| **Medical Director / Endocrinologista** | [Nome Médico] | [ ] Aprovado [ ] Rejeitado | ____________________ | ____/____/2026 |
