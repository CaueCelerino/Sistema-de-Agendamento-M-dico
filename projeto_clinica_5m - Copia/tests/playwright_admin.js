const { chromium } = require('playwright');

async function runAdminTest() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('=== Admin Funcionarios E2E Test ===\n');

    // 1. Open app and login
    console.log('[1] Opening app...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
    
    // Check if already logged in via localStorage
    const userLocal = await page.evaluate(() => localStorage.getItem('espacoVida_user'));
    if (!userLocal) {
      console.log('[1.5] Not logged in. Attempting login...');
      // Try to find and fill login form
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        await page.fill('input[type="email"]', 'admin@example.com');
        // Try to find password field (might not exist in mock)
        const passInput = await page.$('input[type="password"]');
        if (passInput) {
          await page.fill('input[type="password"]', 'password');
        }
        // Find and click login button
        await page.click('button:has-text("Entrar")');
        await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
      }
    } else {
      console.log('✓ Already logged in');
    }

    // 2. Navigate to admin funcionarios
    console.log('[2] Navigating to Admin -> Funcionários...');
    await page.goto('http://localhost:4173/admin/funcionarios', { waitUntil: 'networkidle' });
    
    // Check if page loaded
    const pageTitle = await page.textContent('h1');
    if (pageTitle.includes('Gerenciar Funcionários')) {
      console.log('✓ Admin Funcionários page loaded');
    } else {
      throw new Error('Admin page did not load correctly');
    }

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
    await page.fill('input#email', 'teste.admin@example.com');
    await page.selectOption('select#role', 'medico');
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
