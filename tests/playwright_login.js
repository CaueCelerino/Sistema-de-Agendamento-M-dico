const { chromium } = require('playwright');

(async () => {
  const url = process.env.PREVIEW_URL || 'http://localhost:4174';
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navigating to', url + '/login');
    await page.goto(url + '/login', { waitUntil: 'networkidle' });

    // Fill login form
    await page.fill('#email', 'playwright@example.com');
    await page.fill('#password', 'password');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForTimeout(500) // small wait for SPA navigation/localStorage write
    ]);

    // Check localStorage for auth key
    const stored = await page.evaluate(() => localStorage.getItem('espacoVida_user'));
    if (!stored) {
      console.error('Login failed: espacoVida_user not found in localStorage');
      process.exitCode = 2;
    } else {
      console.log('Login succeeded, localStorage key found.');
      console.log('Stored value:', stored);
    }
  } catch (err) {
    console.error('Playwright test error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
