import { test, expect } from '@playwright/test';

test.describe('Circuito Assistencial E2E: Da Coleta ao Fechamento do Alerta', () => {
  const patientAppUrl = process.env.MOBILE_WEB_URL || 'http://localhost:8081';
  const professionalPortalUrl = process.env.PORTAL_WEB_URL || 'http://localhost:3000';

  test('Deve processar alerta P0 por Hipoglicemia e fechar o circuito com conduta médica', async ({ browser }) => {
    // -----------------------------------------------------------------------
    // PASSO 1: Paciente registra medição crítica (45 mg/dL) no App Mobile
    // -----------------------------------------------------------------------
    const patientContext = await browser.newContext();
    const patientPage = await patientContext.newPage();

    await patientPage.goto(`${patientAppUrl}/glucose-entry`);
    
    // Preenche valor de emergência
    await patientPage.fill('input[accessibilityLabel="Valor da glicemia em miligramas por decilitro"]', '45');
    await patientPage.click('text=Jejum');
    await patientPage.check('text=Tontura, confusão ou visão turva');

    // Submete a medição
    await patientPage.click('text=Salvar Medição');

    // Valida se o App exibiu o aviso imediato de emergência (Requisito de Segurança)
    await expect(patientPage.locator('text=Sua medição indica um valor crítico')).toBeVisible({ timeout: 5000 });
    await patientPage.click('text=Entendido');

    // -----------------------------------------------------------------------
    // PASSO 2: Profissional visualiza, assume e resolve o Alerta P0 na Fila
    // -----------------------------------------------------------------------
    const doctorContext = await browser.newContext();
    const doctorPage = await doctorContext.newPage();

    await doctorPage.goto(`${professionalPortalUrl}/alerts`);

    // A fila deve carregar o Alerta P0 no topo por ordem de urgência
    const topAlertRow = doctorPage.locator('tbody tr').first();
    await expect(topAlertRow.locator('text=P0 - EMERGÊNCIA')).toBeVisible({ timeout: 10000 });
    await expect(topAlertRow.locator('text=45 mg/dL')).toBeVisible();

    // Clica para abrir o detalhe do alerta
    await topAlertRow.locator('button:has-text("Assumir Caso")').click();

    // Valida se a modal de atendimento abriu com os dados corretos do paciente
    await expect(doctorPage.locator('text=Atendimento de Alerta Clínico')).toBeVisible();
    await expect(doctorPage.locator('text=45 mg/dL')).toBeVisible();

    // Ação: Assumir o Alerta (Locks the alert to doctor)
    await doctorPage.click('button:has-text("Assumir este Alerta Agora")');

    // Preenche a conduta clínica obrigatória
    await doctorPage.selectOption('select', 'PATIENT_CONTACTED_STABLE');
    await doctorPage.fill(
      'textarea',
      'Contato telefônico realizado imediatamente. Paciente orientado a consumir 15g de carboidrato rápido e reavaliar glicemia em 15 minutos.'
    );

    // Conclui e fecha o alerta
    await doctorPage.click('button:has-text("Concluir Atendimento e Fechar Alerta")');

    // -----------------------------------------------------------------------
    // PASSO 3: Validação de Encerramento e Limpeza da Fila
    // -----------------------------------------------------------------------
    // A modal deve fechar e o alerta resolvido não deve mais aparecer na fila ativa
    await expect(doctorPage.locator('text=Atendimento de Alerta Clínico')).not.toBeVisible();
    await expect(doctorPage.locator('tbody tr:has-text("45 mg/dL")')).not.toBeVisible({ timeout: 5000 });
  });

  test('Deve bloquear a assunção simultânea do mesmo alerta por dois profissionais (Concorrência)', async ({ browser }) => {
    // -----------------------------------------------------------------------
    // Teste de Segurança: Prevenção de conflito e garantia de um único dono
    // -----------------------------------------------------------------------
    const doctor1Page = await (await browser.newContext()).newPage();
    const doctor2Page = await (await browser.newContext()).newPage();

    await doctor1Page.goto(`${professionalPortalUrl}/alerts`);
    await doctor2Page.goto(`${professionalPortalUrl}/alerts`);

    // Médico 1 assume o alerta
    await doctor1Page.locator('tbody tr').first().locator('button').click();
    await doctor1Page.click('button:has-text("Assumir este Alerta Agora")');

    // Médico 2 tenta assumir o mesmo alerta simultaneamente
    await doctor2Page.locator('tbody tr').first().locator('button').click();
    
    // O sistema deve barrar e exibir mensagem de que já está em atendimento por outro colega
    await expect(doctor2Page.locator('text=Alerta já está sendo tratado por outro profissional')).toBeVisible({ timeout: 5000 });
  });
});
