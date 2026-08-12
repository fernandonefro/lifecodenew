# Especificação de UX/UI & Árvore de Componentes: Home do App do Paciente
**Norma de Acessibilidade**: WCAG 2.2 Nível AA Compliance (Critério CA-10)  
**Diretriz UX**: Limite Máximo de 3 Prioridades Visuais & Linguagem Simplificada  

---

## 1. Árvore de Componentes Visuais (Mobile App Home)

```
[Screen: PatientHomeView]
 ├── [Header: TopNavigationBar]
 │    ├── [Badge: ConnectionStatusIndicator] (Sensor Conectado / BLE Active)
 │    └── [Button: PrivacySettingsIconButton] (Acesso Rápido LGPD)
 │
 ├── 🌟 [PRIORIDADE 1] -> [HeroCard: CurrentGlucoseStatusCard]
 │    ├── [StatusBadge: PlainLanguageState] (ex: "Glicemia Normal", "Glicemia Baixa")
 │    ├── [ValueDisplay: GlucoseNumberAndUnit] ("115 mg/dL" - Fonte 48px Bold)
 │    ├── [TrendIndicator: LargeTrendArrowWithLabel] (Seta ↑ ↓ + Texto "Estável")
 │    └── [VisualGauge: TimeInRangeRingGauge] (Gráfico em Anel com TIR do dia: 82%)
 │
 ├── 🌟 [PRIORIDADE 2] -> [ActionBanner: PrimaryCareActionBanner]
 │    ├── (Se Hipoglicemia < 70): [EmergencyBox: FastCarbRecommendation] ("Ingerir 15g de Açúcar Agora")
 │    ├── (Se Hiperglicemia > 250): [BolusBox: BolusCalculatorShortcut] ("Sugestão de Correção: 1.5 U")
 │    └── (Se Glicemia Normal): [RoutineBox: NextInsulinReminder] ("Próxima Basal: 22:00 (Lantus 18U)")
 │
 └── 🌟 [PRIORIDADE 3] -> [QuickActions: BottomNavigationGrid]
      ├── [Button: LogGlucoseManual] ("Medir Ponta de Dedo")
      ├── [Button: LogCarbsAndMeals] ("Registrar Refeição")
      └── [Button: LogInsulinDose] ("Registrar Insulina")
```

---

## 2. Estados da Tela e Linguagem Simplificada

Para garantir total compreensão por pacientes de todas as faixas etárias e níveis de alfabetização em saúde:

| Estado Clínico | Faixa Glicêmica | Mensagem em Linguagem Simplificada | Feedback Visual & Sonoro |
| :--- | :---: | :--- | :--- |
| **Normal (TIR)** | 70 a 180 mg/dL | *"Sua glicemia está ótima e estável."* | Card Verde Esmeralda `#059669`, Ícone de Check. |
| **Hipoglicemia Moderada** | 54 a 69 mg/dL | *"Glicemia Baixa. Coma 1 maçã ou tome 1 copo de suco agora."* | Card Amarelo Âmbar `#D97706`, Ícone de Alerta. |
| **Hipoglicemia Severa (P0)** | < 54 mg/dL | *"ALERTA CRÍTICO: Glicemia muito baixa! Tome 1 colher de açúcar imediato."* | Card Vermelho Carmim `#DC2626`, Pisca-pisca + Alarme Sonoro Máximo. |
| **Hiperglicemia Elevada** | > 250 mg/dL | *"Glicemia alta. Beba bastante água e verifique sua insulina."* | Card Laranja Queimado `#EA580C`, Ícone de Gota de Água. |

---

## 3. Matriz de Auditoria de Acessibilidade WCAG 2.2 AA (CA-10)

| Critério WCAG 2.2 | Requisito Técnico | Implementação no Lifecode Mobile |
| :--- | :--- | :--- |
| **1.4.3 Contraste Mínimo** | Ratio ≥ 4.5:1 para texto normal | Texto em cinza escuro `#0F172A` sobre fundo cinza claro `#F8FAFC` (Contraste 15.8:1). Texto branco sobre vermelho P0 (Contraste 7.1:1). |
| **1.4.11 Contraste Não Textual** | Ratio ≥ 3.0:1 para componentes de UI | Bordas de botões e seletores com contraste 4.2:1 em relação ao fundo da tela. |
| **2.5.8 Tamanho do Alvo (Target Size)** | Dimensão mínima de 24x24px (48x48dp ideal) | Todos os botões possuem área de toque de **no mínimo 56x56dp** com espaçamento interno de 12px. |
| **1.4.1 Uso de Cores** | A cor não deve ser o único meio de passar informação | Todo estado glicêmico inclui **Texto Explicativo + Ícone + Badge Textual + Cor**, garantindo usabilidade por daltônicos. |
| **4.1.3 Mensagens de Status** | Suporte a Leitores de Tela (TalkBack/VoiceOver) | Região de alerta com `aria-live="assertive"` e `role="alert"` para leitura imediata por voz em caso de P0. |
