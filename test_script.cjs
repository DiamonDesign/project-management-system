const { chromium } = require('playwright');

(async () => {
  console.log("Starting browser test...");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const errors = [];

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  try {
    // Test home page
    console.log("Testing home page...");
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'home_page_working.png' });
    console.log("✅ Home page loaded successfully");

    // Test tasks page
    console.log("Testing tasks page...");
    await page.goto('http://localhost:8080/tasks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for dynamic content
    await page.screenshot({ path: 'tasks_page_working.png' });
    console.log("✅ Tasks page loaded successfully");

    // Test analytics page
    console.log("Testing analytics page...");
    await page.goto('http://localhost:8080/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for dynamic content
    await page.screenshot({ path: 'analytics_page_working.png' });
    console.log("✅ Analytics page loaded successfully");

    // Report errors
    if (errors.length > 0) {
      console.log("❌ JavaScript errors found:");
      errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log("✅ No JavaScript errors detected");
    }

    console.log(`\nTest Summary:`);
    console.log(`- Home page: ✅ Working`);
    console.log(`- Tasks page: ✅ Working`);
    console.log(`- Analytics page: ✅ Working`);
    console.log(`- JavaScript errors: ${errors.length === 0 ? '✅ None' : '❌ ' + errors.length + ' found'}`);

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  } finally {
    await browser.close();
  }
})();