const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://product-matcher--alexhamash.replit.app/supplier-products');
  await page.waitForTimeout(5000); // Wait for React to render
  await page.screenshot({ path: 'target-screenshot.png', fullPage: true });
  await browser.close();
})();
