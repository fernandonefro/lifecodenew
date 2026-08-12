# Especificação do Portal Profissional: "Painel por Exceção"
**Foco**: Triagem Médica Orientada por Risco & SLA de Atendimento  
**Conformidade**: Requisitos RF-16, US-10 e US-13  

---

## 1. Fluxo de Trabalho do "Painel por Exceção"

No modelo tradicional, médicos precisam abrir prontuário por prontuário. No **Painel por Exceção Lifecode**, a interface reorganiza automaticamente a lista de pacientes com base no **Score de Risco Fisiológico** e no **Tempo Restante de SLA**:

```
+---------------------------------------------------------------------------------------------------+
| FILA DE TRIAGEM POR EXCEÇÃO (ORDENAÇÃO DINÂMICA: P0 -> P1 -> P2 -> P3)                             |
+---------------------------------------------------------------------------------------------------+
| 🔴 [P0 CRÍTICO]  | Maria Silva   | 42 mg/dL (↓)  | SLA: 01:15 min | [Assumir] [Contatar] [Escalar]   |
| 🟠 [P1 ALTO]     | João Santos   | 285 mg/dL (↑) | SLA: 11:40 min | [Assumir] [Contatar] [Fechar]    |
| 🟡 [P2 MÉDIO]    | Ana Oliveira  | Sensor Desc.  | SLA: 45:00 min | [Ver no Prontuário] [Notificar]  |
| 🟢 [P3 NORMAL]   | Carlos Souza  | 115 mg/dL (→) | No Alvo (92%)  | [Ver Prontuário]                 |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Ações Rápidas da Fila de Triagem

Para cada Card de Alerta na Fila do Médico, estão disponíveis quatro ações rápidas de 1-clique:

1. **Assumir (Acknowledge)**:
   * *Ação*: O médico assume a responsabilidade do alerta.
   * *Efeito*: O cronômetro de SLA é pausado e a notificação é marcada como *Em Atendimento* pelo Médico X no Audit Trail imutável.
2. **Contatar (Direct Patient Outreach)**:
   * *Ação*: Abre o canal de comunicação segura E2EE ou inicia chamada de voz via plataforma.
   * *Efeito*: Envia mensagem instantânea padronizada: *"Olá, identificamos glicemia de X mg/dL. Você precisa de suporte?"*
3. **Escalar (Emergency Escalation)**:
   * *Ação*: Aciona a rede de apoio (Cuidadores cadastrados) via SMS / Chamada Telefônica automática Twilio ou Serviço de Emergência.
   * *Efeito*: Promove o caso para a equipe de plantão de emergência médica da operadora.
4. **Fechar Tarefa (Resolve & Audit Log)**:
   * *Ação*: O médico insere uma nota clínica rápida de conduta (ex: "Orientada ingestão de 15g de carboidrato rápida. Paciente estábilizado") e encerra o alerta.
   * *Efeito*: Grava o registro assinado na tabela `audit_logs` e remove o alerta da fila ativa.
