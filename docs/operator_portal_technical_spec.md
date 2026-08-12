# ESPECIFICAÇÃO TÉCNICA: PORTAL DA OPERADORA & ANALYTICS POPULACIONAL
**Histórias de Usuário**: US-21 (Estratificação de Risco & Lacunas de Cuidado) + US-22 (Indicadores de Qualidade & Utilização / 1.000 Beneficiários)  
**Público-Alvo**: Analistas de Operadora de Saúde (`ANALISTA_OPERADORA`) e Gestores de Clínica (`GESTOR_CLINICA`)  
**Conformidade**: LGPD (Análise agregada / Pseudonimizada no nível populacional com drill-down auditado)  

---

## 1. Regras de Estratificação de Risco Populacional (Tiers de Risco)

A carteira de beneficiários portadores de diabetes é continuamente classificada em 3 Tiers dinâmicos com base em biomarcadores, variabilidade glicêmica, frequência de monitoramento e histórico de utilização:

```
+----------------------------------------------------------------------------------------------------+
| MATRIZ DE ESTRATIFICAÇÃO DE RISCO POPULACIONAL (TIERS DE JORNADA)                                  |
+----------------------------------------------------------------------------------------------------+
| TIER 1: ALTO RISCO (Risco Iminente de Descompensação / Complicações)                              |
| - HbA1c > 9.0% OU Time in Range (TIR) < 50% OU > 4% do tempo em Hipoglicemia (< 70 mg/dL).          |
| - Historico: ≥ 1 internação por CAD/EHH ou ≥ 2 idas ao Pronto Atendimento (PA) nos últimos 180 dias.|
| - Ação Operacional: Inclusão imediata em Gestão Intensiva (Navegador de Saúde dedicado).            |
+----------------------------------------------------------------------------------------------------+
| TIER 2: RISCO MÉDIO (Sub-otimizado / Lacunas de Cuidado Ativas)                                    |
| - HbA1c entre 7.5% e 9.0% OU Time in Range (TIR) entre 50% e 69%.                                   |
| - Presença de pelo menos 1 Lacuna de Cuidado vencida (ex: HbA1c ou eGFR sem registro > 180 dias).   |
| - Ação Operacional: Disparo de busca ativa automatizada e agendamento de consultas preventivas.   |
+----------------------------------------------------------------------------------------------------+
| TIER 3: RISCO BAIXO / CONTROLADO (Dentro da Meta)                                                   |
| - HbA1c < 7.5% E Time in Range (TIR) ≥ 70% mantido por > 90 dias sem hipoglicemia severa.           |
| - Todas as exames preventivos em dia conforme o protocolo clínico.                                 |
| - Ação Operacional: Monitoramento passivo e reforço de engajamento via app mobile.                 |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Monitoramento de Lacunas de Cuidado (Care Gaps Protocol)

O sistema verifica automaticamente a tempestividade dos exames e consultas de rastreio de complicações micro e macrovasculares:

| Exame / Consulta de Rastreio | Código LOINC / CPT | Frequência Exigida | Alerta de Lacuna Vencida |
| :--- | :---: | :---: | :--- |
| **Hemoglobina Glicada (HbA1c)** | LOINC `4548-4` | A cada 90 dias | Se sem registro há `> 90 dias` (Tier 1/2) ou `> 180 dias` (Tier 3) |
| **Função Renal (eGFR & Albuminúria)**| LOINC `33914-3` / `14957-5` | A cada 365 dias | Se sem registro há `> 365 dias` (Rastreio de Nefropatia) |
| **Fundo de Olho (Mapeamento de Retina)**| CPT `92250` | A cada 365 dias | Se sem registro há `> 365 dias` (Rastreio de Retinopatia) |
| **Exame Clínico dos Pés** | Protocolo ADA Foot Exam | A cada 365 dias | Se sem registro há `> 365 dias` (Rastreio de Pé Diabético) |
| **Consulta com Endocrinologista** | CPT `99214` | A cada 180 dias | Se sem consulta gravada no prontuário há `> 180 dias` |

---

## 3. Fórmulas de Indicadores de Qualidade & Utilização Populacional

Para acompanhar o valor gerado (*Value-Based Healthcare*) e a redução de custos assistenciais, a plataforma calcula mensalmente:

1. **Taxa de Idas ao Pronto Atendimento (PA / 1.000 Beneficiários/Ano)**:
   $$\text{Taxa PA} = \left( \frac{\text{Total de Atendimentos em PA por Diabetes no Mês}}{\text{Total de Beneficiários Elegíveis na Carteira}} \right) \times 1.000 \times 12$$

2. **Taxa de Internações Hospitalares por CAD/EHH / 1.000 Beneficiários/Ano**:
   $$\text{Taxa Internações} = \left( \frac{\text{Total de Internações por Cetoacidose / Coma Hiperosmolar no Mês}}{\text{Total de Beneficiários Elegíveis na Carteira}} \right) \times 1.000 \times 12$$

3. **Custo Médio Assistencial Evitado (ROI Clínico)**:
   Comparativo entre a sinistralidade do grupo participante da Plataforma Lifecode vs grupo controle não engajado.

---

## 4. Estratégia de Performance para Grandes Carteiras (+100k Beneficiários)

Para responder a consultas de analytics populacionais em **< 200 ms** em carteiras de grande porte:
* **Materialized Views em PostgreSQL**: Atualizadas de forma assíncrona a cada 1 hora via cron job (`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_population_risk_summary`).
* **Cache em Redis 7**: Armazenamento dos resultados agregados por tenant e filtro em cache com TTL de 15 minutos.
* **Segregação de Leitura (Read Replica)**: Consultas do Portal da Operadora direcionadas para réplicas de leitura do banco para não impactar a ingestão em tempo real de dados CGM/BGM.
