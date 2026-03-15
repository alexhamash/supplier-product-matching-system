const { chromium } = require('playwright');
const { createServer } = require('vite');

(async () => {
  const server = await createServer({
    root: process.cwd(),
    server: { port: 3000 }
  });
  await server.listen();

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the target page
  await page.goto('http://localhost:3000/supplier-products');

  // Wait for the page to render fully
  await page.waitForTimeout(2000);

  // Take a full page screenshot
  await page.screenshot({ path: 'local-screenshot.png', fullPage: true });

  await browser.close();
  await server.close();
})();
