import { Page } from '@playwright/test';

export interface TestProposal {
  task: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    dueDate: string;
  };
  project: {
    name: string;
    description: string;
    type: 'web' | 'mobile' | 'branding' | 'ux' | 'other';
    timeline: string;
    budget: string;
  };
}

export const testData: TestProposal = {
  task: {
    title: 'Mejorar accesibilidad del formulario de login',
    description: 'El formulario actual no cumple con estándares WCAG 2.1, necesitamos mejorarlo para usuarios con discapacidades visuales y añadir soporte para lectores de pantalla.',
    priority: 'high',
    dueDate: '2024-02-15'
  },
  project: {
    name: 'Rediseño del sistema de notificaciones',
    description: 'Necesitamos un sistema de notificaciones más moderno y eficiente que permita a los usuarios gestionar mejor sus alertas y configurar preferencias personalizadas.',
    type: 'ux',
    timeline: '2-3 meses',
    budget: '€15,000 - €20,000'
  }
};

export class TestHelpers {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wait for a toast notification to appear and optionally verify its message
   */
  async waitForToast(expectedMessage?: string) {
    const toast = this.page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 10000 });
    
    if (expectedMessage) {
      await this.page.waitForSelector(`text="${expectedMessage}"`, { timeout: 5000 });
    }
    
    return toast;
  }

  /**
   * Wait for a modal dialog to be visible
   */
  async waitForDialog() {
    const dialog = this.page.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'visible' });
    return dialog;
  }

  /**
   * Wait for a modal dialog to be hidden
   */
  async waitForDialogToClose() {
    const dialog = this.page.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'hidden' });
  }

  /**
   * Take a screenshot with timestamp and test name
   */
  async takeTimestampedScreenshot(testName: string, description?: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${testName}_${timestamp}${description ? `_${description}` : ''}`;
    
    return await this.page.screenshot({ 
      path: `tests/e2e/screenshots/${fileName}.png`,
      fullPage: true 
    });
  }

  /**
   * Simulate mobile viewport
   */
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  /**
   * Simulate tablet viewport
   */
  async setTabletViewport() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  /**
   * Simulate desktop viewport
   */
  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  /**
   * Check if an element is visible in the viewport
   */
  async isElementInViewport(selector: string) {
    return await this.page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }, selector);
  }

  /**
   * Wait for page to be fully loaded including all network requests
   */
  async waitForPageToLoad() {
    await this.page.waitForLoadState('networkidle');
    // Additional wait for any React state updates
    await this.page.waitForTimeout(500);
  }

  /**
   * Scroll element into view if needed
   */
  async scrollIntoView(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Check if form is reset to initial state
   */
  async isFormReset(formSelectors: { [key: string]: string }) {
    const results: { [key: string]: boolean } = {};
    
    for (const [field, selector] of Object.entries(formSelectors)) {
      const element = this.page.locator(selector);
      const value = await element.inputValue();
      results[field] = value === '';
    }
    
    return results;
  }

  /**
   * Generate random test data
   */
  generateRandomData() {
    const timestamp = Date.now();
    return {
      task: {
        title: `Tarea de prueba ${timestamp}`,
        description: `Descripción de tarea de prueba creada automáticamente en ${new Date().toISOString()}`,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
        dueDate: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      project: {
        name: `Proyecto de prueba ${timestamp}`,
        description: `Descripción de proyecto de prueba creado automáticamente en ${new Date().toISOString()}`,
        type: ['web', 'mobile', 'branding', 'ux'][Math.floor(Math.random() * 4)] as 'web' | 'mobile' | 'branding' | 'ux',
        timeline: `${Math.floor(Math.random() * 6) + 1}-${Math.floor(Math.random() * 6) + 2} meses`,
        budget: `€${(Math.floor(Math.random() * 50) + 5) * 1000} - €${(Math.floor(Math.random() * 50) + 15) * 1000}`
      }
    };
  }

  /**
   * Check accessibility basics
   */
  async checkBasicAccessibility() {
    // Check for basic accessibility attributes
    const checks = {
      hasPageTitle: await this.page.title() !== '',
      hasMainLandmark: await this.page.locator('main, [role="main"]').count() > 0,
      hasHeadings: await this.page.locator('h1, h2, h3, h4, h5, h6').count() > 0,
      focusableElementsHaveLabels: true // Will be implemented with axe-core in full tests
    };
    
    return checks;
  }

  /**
   * Simulate slow network conditions
   */
  async simulateSlowNetwork() {
    await this.page.route('**/*', route => {
      // Add delay to simulate slow network
      setTimeout(() => route.continue(), 100);
    });
  }

  /**
   * Clear all form fields
   */
  async clearForm(selectors: string[]) {
    for (const selector of selectors) {
      const element = this.page.locator(selector);
      await element.clear();
    }
  }

  /**
   * Fill form with test data
   */
  async fillFormWithTestData(formData: { [selector: string]: string }) {
    for (const [selector, value] of Object.entries(formData)) {
      const element = this.page.locator(selector);
      
      // Handle different input types
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      
      if (tagName === 'select') {
        await element.selectOption(value);
      } else {
        await element.fill(value);
      }
    }
  }

  /**
   * Wait for an element to become stable (not moving)
   */
  async waitForElementToBeStable(selector: string, timeout: number = 5000) {
    const element = this.page.locator(selector);
    
    return await this.page.waitForFunction(
      ({ selector }) => {
        const el = document.querySelector(selector);
        if (!el) return false;
        
        const rect1 = el.getBoundingClientRect();
        
        return new Promise(resolve => {
          setTimeout(() => {
            const rect2 = el.getBoundingClientRect();
            resolve(
              rect1.top === rect2.top &&
              rect1.left === rect2.left &&
              rect1.width === rect2.width &&
              rect1.height === rect2.height
            );
          }, 100);
        });
      },
      { selector },
      { timeout }
    );
  }
}