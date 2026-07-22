const { chromium } = require('playwright');

function normalizeRole(role) {
  if (!role) return 'USER';
  const upper = String(role).trim().toUpperCase();
  if (upper === 'ADMIN' || upper === 'FUNCIONARIO') return 'ADM';
  if (upper === 'SUPERADMIN' || upper === 'SUPER-ADM') return 'SUPER_ADM';
  return upper;
}

async function runAdminTest() {
  const appUrl = process.env.PREVIEW_URL || 'http://localhost:4173';
  const adminEmail = process.env.ADMIN_EMAIL || 'espacovida@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'vida22';

  const browser = await chromium.launch();
  const page = await browser.newPage();

  let loginApiStatus = null;
  let loginApiBody = '';

  page.on('response', async (response) => {
    if (response.url().includes('/api/auth/login')) {
      loginApiStatus = response.status();
      try {
        loginApiBody = await response.text();
      } catch {
        loginApiBody = '<sem corpo>'; 
      }
    }
  });

  try {
    console.log('=== Admin Funcionarios E2E Test ===\n');

    // 1. Open app and login
    console.log('[1] Opening app...');
    await page.goto(`${appUrl}/login`, { waitUntil: 'networkidle' });
    
    await page.evaluate(() => localStorage.removeItem('espacoVida_user'));
    console.log('[1.5] Logging in as admin...');

    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await page.fill('#email', adminEmail);
      const passInput = await page.$('#password');
      if (passInput) {
        await page.fill('#password', adminPassword);
      }
      await page.click('button[type="submit"]');
      await page.waitForFunction(() => !!localStorage.getItem('espacoVida_user'), null, { timeout: 15000 });
    }

    const storedSession = await page.evaluate(() => localStorage.getItem('espacoVida_user'));
    if (!storedSession) {
      const currentUrl = page.url();
      const formError = await page.locator('.form-error').first().textContent().catch(() => null);
      throw new Error(
        `Login não persistiu sessão (url atual: ${currentUrl}) | apiStatus=${loginApiStatus} | apiBody=${loginApiBody} | formError=${formError}`
      );
    }

    const parsedSession = JSON.parse(storedSession);
    const role = normalizeRole(parsedSession?.usuario?.role || parsedSession?.user?.role || parsedSession?.role);
    if (role !== 'ADM' && role !== 'SUPER_ADM') {
      throw new Error(`Sessão autenticada sem perfil admin: ${role}`);
    }

    // 2. Navigate to admin funcionarios
    console.log('[2] Navigating to Admin -> Funcionários...');
    await page.goto(`${appUrl}/admin/funcionarios`, { waitUntil: 'networkidle' });

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Rota admin redirecionou para /login após autenticação');
    }

    await page.waitForSelector('text=Gerenciar Funcionários', { timeout: 15000 });
    console.log('✓ Admin Funcionários page loaded');

    // 3. Check if funcionarios list is visible
    console.log('[3] Verifying funcionarios list...');
    const table = await page.locator('table');
    const isTableVisible = await table.isVisible();
    if (isTableVisible) {
      console.log('✓ Funcionarios table visible');
    } else {
      throw new Error('Funcionarios table not visible');
    }

    // 4. Click "Adicionar Funcionário"
    console.log('[4] Opening create modal...');
    await page.click('button:has-text("Adicionar Funcionário")');
    await page.waitForSelector('.modal-content');
    const modalTitle = await page.textContent('.modal-header h2');
    if (modalTitle.includes('Novo Funcionário')) {
      console.log('✓ Create modal opened');
    }

    // 5. Fill form and create
    console.log('[5] Creating new funcionario...');
    await page.fill('input#nome', 'Dra. Teste Admin');
    await page.fill('input#email', `teste.admin.${Date.now()}@example.com`);
    await page.selectOption('select#role', 'MEDICO');
    await page.fill('input#especialidade', 'Neurologia');
    
    // Submit
    await page.click('.modal-footer button:has-text("Criar")');
    await page.waitForTimeout(1000); // Wait for API response and modal close
    
    console.log('✓ Funcionario created (form submitted)');

    // 6. Check if table updated (optional - depends on mock server speed)
    console.log('[6] Verifying table after create...');
    const rowsCount = await page.locator('table tbody tr').count();
    console.log(`   Rows in table: ${rowsCount}`);

    // 7. Edit a funcionario
    console.log('[7] Testing edit functionality...');
    const editButtons = await page.locator('button:has-text("Editar")');
    if ((await editButtons.count()) > 0) {
      await editButtons.first().click();
      await page.waitForSelector('.modal-content');
      const editModalTitle = await page.textContent('.modal-header h2');
      if (editModalTitle.includes('Editar')) {
        console.log('✓ Edit modal opened');
      }
      // Close without saving
      await page.click('.modal-close');
      await page.waitForTimeout(500);
    }

    // 8. Test delete (optional - with confirm)
    console.log('[8] Testing delete button visibility...');
    const deleteButtons = await page.locator('button:has-text("Deletar")');
    if ((await deleteButtons.count()) > 0) {
      console.log('✓ Delete buttons visible');
    }

    console.log('\n✅ Admin Funcionarios E2E test completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAdminTest();
