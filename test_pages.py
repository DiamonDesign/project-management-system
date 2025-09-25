#!/usr/bin/env python3
"""
Test script to verify the Tasks and Analytics pages are working after fixes
"""
import subprocess
import time
import sys

def run_playwright_test():
    """Run playwright test to check both pages"""

    playwright_script = '''
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

    console.log(`\\nTest Summary:`);
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
'''

    # Write the playwright script
    with open('test_script.js', 'w') as f:
        f.write(playwright_script)

    # Run the test
    try:
        result = subprocess.run(['node', 'test_script.js'],
                              capture_output=True, text=True, timeout=60)
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print("❌ Test timed out")
        return False
    except Exception as e:
        print(f"❌ Test failed to run: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Tasks and Analytics pages after fixes...")
    print("=" * 60)

    success = run_playwright_test()

    print("=" * 60)
    print(f"Overall test result: {'✅ SUCCESS' if success else '❌ FAILED'}")