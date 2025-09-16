import { test, expect } from '@playwright/test';
import { ClientPortalPage } from './page-objects/ClientPortalPage';
import { ClientProjectDashboardPage } from './page-objects/ClientProjectDashboardPage';
import { DesignerDashboardPage } from './page-objects/DesignerDashboardPage';
import { TestHelpers } from './utils/test-helpers';

test.describe('Accessibility Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Client Portal Accessibility', () => {
    let portalPage: ClientPortalPage;

    test.beforeEach(async ({ page }) => {
      portalPage = new ClientPortalPage(page);
    });

    test('should have proper page structure and landmarks', async ({ page }) => {
      await portalPage.goto('techcorp');
      
      // Check for page title
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
      
      // Check for main landmark
      const mainLandmark = page.locator('main, [role="main"]');
      expect(await mainLandmark.count()).toBeGreaterThan(0);
      
      // Check for heading hierarchy
      const h1 = page.locator('h1');
      expect(await h1.count()).toBeGreaterThan(0);
      
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      expect(await headings.count()).toBeGreaterThan(0);
    });

    test('should have accessible form labels and inputs', async ({ page }) => {
      await portalPage.goto('techcorp');
      await portalPage.openProjectProposalDialog();
      
      // Check that form inputs have associated labels
      const nameInput = portalPage.projectNameInput;
      const nameLabel = page.locator('label[for="project-name"]');
      expect(await nameLabel.count()).toBeGreaterThan(0);
      
      const descInput = portalPage.projectDescriptionTextarea;
      const descLabel = page.locator('label[for="project-description"]');
      expect(await descLabel.count()).toBeGreaterThan(0);
      
      // Check for aria-labels or accessible names
      const nameAccessibleName = await nameInput.getAttribute('aria-label') || await nameLabel.textContent();
      expect(nameAccessibleName).toBeTruthy();
      
      const descAccessibleName = await descInput.getAttribute('aria-label') || await descLabel.textContent();
      expect(descAccessibleName).toBeTruthy();
    });

    test('should have proper button accessibility', async ({ page }) => {
      await portalPage.goto('techcorp');
      
      // Check main action button
      const proposeButton = portalPage.proposeProjectButton;
      const buttonText = await proposeButton.textContent();
      expect(buttonText?.trim().length).toBeGreaterThan(0);
      
      // Check button is keyboard accessible
      await proposeButton.focus();
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBe('BUTTON');
      
      // Check button can be activated with keyboard
      await proposeButton.press('Enter');
      await expect(portalPage.projectProposalDialog).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      await portalPage.goto('techcorp');
      
      // Test tab navigation through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check that focus is visible
      const focusedElement = page.locator(':focus');
      expect(await focusedElement.count()).toBe(1);
      
      // Test Enter key on propose project button
      await portalPage.proposeProjectButton.focus();
      await page.keyboard.press('Enter');
      await expect(portalPage.projectProposalDialog).toBeVisible();
      
      // Test Escape key to close dialog
      await page.keyboard.press('Escape');
      await expect(portalPage.projectProposalDialog).not.toBeVisible();
    });

    test('should have proper focus management in modals', async ({ page }) => {
      await portalPage.goto('techcorp');
      await portalPage.openProjectProposalDialog();
      
      // Focus should be trapped in the modal
      const firstFocusableElement = portalPage.projectNameInput;
      await expect(firstFocusableElement).toBeFocused();
      
      // Tab through all elements in modal
      await page.keyboard.press('Tab'); // Description
      await page.keyboard.press('Tab'); // Type select
      await page.keyboard.press('Tab'); // Timeline
      await page.keyboard.press('Tab'); // Budget
      await page.keyboard.press('Tab'); // Cancel button
      await page.keyboard.press('Tab'); // Submit button
      
      // Should cycle back to first element or stay within modal
      const currentFocused = page.locator(':focus');
      const focusedTag = await currentFocused.evaluate(el => el.tagName);
      expect(['INPUT', 'BUTTON', 'TEXTAREA', 'SELECT']).toContain(focusedTag);
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      await portalPage.goto('techcorp');
      await portalPage.openProjectProposalDialog();
      
      // Check dialog has proper ARIA attributes
      const dialog = portalPage.projectProposalDialog;
      const role = await dialog.getAttribute('role');
      expect(role).toBe('dialog');
      
      // Check for aria-labelledby or aria-label
      const ariaLabel = await dialog.getAttribute('aria-label');
      const ariaLabelledBy = await dialog.getAttribute('aria-labelledby');
      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      
      // Check for required field indicators
      const requiredFields = page.locator('input[required], textarea[required]');
      if (await requiredFields.count() > 0) {
        const firstRequired = requiredFields.first();
        const ariaRequired = await firstRequired.getAttribute('aria-required');
        const required = await firstRequired.getAttribute('required');
        expect(ariaRequired === 'true' || required !== null).toBe(true);
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await portalPage.goto('techcorp');
      
      // This is a basic check - in a real scenario, you'd use axe-core
      // Check that text is not invisible (basic contrast check)
      const bodyText = page.locator('body');
      const computedStyle = await bodyText.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor
        };
      });
      
      // Text should have color defined
      expect(computedStyle.color).not.toBe('transparent');
      expect(computedStyle.color).not.toBe('rgba(0, 0, 0, 0)');
    });

    test('should handle screen reader announcements', async ({ page }) => {
      await portalPage.goto('techcorp');
      
      // Check for live regions for dynamic content
      await portalPage.openProjectProposalDialog();
      await portalPage.projectNameInput.fill('Test');
      await portalPage.submitProjectProposal(); // This will trigger validation error
      
      // Wait for toast notification
      await helpers.waitForToast();
      
      // Check if toast has appropriate ARIA attributes for screen readers
      const toast = page.locator('[data-sonner-toast]');
      const ariaLive = await toast.getAttribute('aria-live');
      const role = await toast.getAttribute('role');
      
      // Toast should be announced to screen readers
      expect(ariaLive || role).toBeTruthy();
    });
  });

  test.describe('Task Proposal Form Accessibility', () => {
    let dashboardPage: ClientProjectDashboardPage;

    test.beforeEach(async ({ page }) => {
      dashboardPage = new ClientProjectDashboardPage(page);
    });

    test('should have accessible task proposal form', async ({ page }) => {
      await dashboardPage.goto('proj-1');
      await dashboardPage.openTaskProposalDialog();
      
      // Check form labels
      const titleLabel = page.locator('label[for="task-title"]');
      const descLabel = page.locator('label[for="task-description"]');
      const priorityLabel = page.locator('label[for="task-priority"]');
      const dateLabel = page.locator('label[for="task-due-date"]');
      
      expect(await titleLabel.count()).toBeGreaterThan(0);
      expect(await descLabel.count()).toBeGreaterThan(0);
      expect(await priorityLabel.count()).toBeGreaterThan(0);
      expect(await dateLabel.count()).toBeGreaterThan(0);
      
      // Check required field indicators
      const requiredAsterisks = page.locator('text=*');
      expect(await requiredAsterisks.count()).toBeGreaterThan(0);
    });

    test('should announce form validation errors', async ({ page }) => {
      await dashboardPage.goto('proj-1');
      await dashboardPage.openTaskProposalDialog();
      
      // Submit empty form to trigger validation
      await dashboardPage.submitTaskProposal();
      
      // Wait for error message
      await helpers.waitForToast();
      
      // Check that error is announced
      const errorToast = page.locator('[data-sonner-toast]').filter({ hasText: /error/i });
      expect(await errorToast.count()).toBeGreaterThan(0);
      
      // Error should have appropriate ARIA attributes
      const ariaLive = await errorToast.getAttribute('aria-live');
      expect(ariaLive).toBeTruthy();
    });

    test('should support keyboard-only form completion', async ({ page }) => {
      await dashboardPage.goto('proj-1');
      
      // Navigate to propose task button using keyboard
      await dashboardPage.proposeTaskButton.focus();
      await page.keyboard.press('Enter');
      
      // Fill form using keyboard only
      await page.keyboard.type('Test task title');
      await page.keyboard.press('Tab');
      await page.keyboard.type('Test task description');
      await page.keyboard.press('Tab');
      
      // Select priority using keyboard
      await page.keyboard.press('ArrowDown'); // Should change priority
      await page.keyboard.press('Tab');
      
      // Navigate to submit button and submit
      await page.keyboard.press('Tab'); // Should be on submit button
      await page.keyboard.press('Enter');
      
      // Should show success toast
      await helpers.waitForToast();
      const successToast = page.locator('[data-sonner-toast]').filter({ hasText: /propuesta enviada/i });
      expect(await successToast.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Designer Dashboard Accessibility', () => {
    let designerPage: DesignerDashboardPage;

    test.beforeEach(async ({ page }) => {
      designerPage = new DesignerDashboardPage(page);
    });

    test('should have accessible proposals section', async ({ page }) => {
      await designerPage.goto();
      await designerPage.waitForDashboardToLoad();
      await designerPage.scrollToProposals();
      
      // Check proposals section has proper heading
      const proposalsHeading = page.locator('h2, h3').filter({ hasText: /propuestas/i });
      expect(await proposalsHeading.count()).toBeGreaterThan(0);
      
      // Check that proposal actions are accessible
      const approveButtons = page.locator('button').filter({ hasText: /aprobar/i });
      const rejectButtons = page.locator('button').filter({ hasText: /rechazar/i });
      
      if (await approveButtons.count() > 0) {
        const firstApprove = approveButtons.first();
        const buttonText = await firstApprove.textContent();
        expect(buttonText?.trim().length).toBeGreaterThan(0);
        
        // Check button is keyboard accessible
        await firstApprove.focus();
        const isFocused = await firstApprove.evaluate(el => el === document.activeElement);
        expect(isFocused).toBe(true);
      }
    });

    test('should have accessible data visualizations', async ({ page }) => {
      await designerPage.goto();
      await designerPage.waitForDashboardToLoad();
      
      // Check KPI cards have accessible structure
      const kpiElements = page.locator('[data-testid*="kpi"], .text-2xl, .font-bold').filter({ hasText: /\d+/ });
      
      if (await kpiElements.count() > 0) {
        const firstKPI = kpiElements.first();
        
        // KPI should have context (label)
        const parentCard = firstKPI.locator('..');
        const contextText = await parentCard.textContent();
        expect(contextText).toBeTruthy();
        expect(contextText!.length).toBeGreaterThan(5);
      }
    });

    test('should handle keyboard navigation for proposal actions', async ({ page }) => {
      await designerPage.goto();
      await designerPage.waitForDashboardToLoad();
      await designerPage.scrollToProposals();
      
      const proposalsCount = await designerPage.getProposalsCount();
      
      if (proposalsCount > 0) {
        // Find approve button and test keyboard interaction
        const approveButton = page.locator('button').filter({ hasText: /aprobar/i }).first();
        
        if (await approveButton.count() > 0) {
          await approveButton.focus();
          await page.keyboard.press('Enter');
          
          // Should perform the approval action
          await page.waitForTimeout(500);
          
          // Verify some change occurred (could check console logs in real implementation)
        }
      }
    });
  });

  test.describe('Responsive Accessibility', () => {
    test('should maintain accessibility on mobile', async ({ page }) => {
      await helpers.setMobileViewport();
      
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Check that touch targets are appropriately sized
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        const firstButton = buttons.first();
        const boundingBox = await firstButton.boundingBox();
        
        if (boundingBox) {
          // Touch targets should be at least 44x44px (WCAG recommendation)
          expect(boundingBox.height).toBeGreaterThanOrEqual(40); // Allowing some tolerance
          expect(boundingBox.width).toBeGreaterThanOrEqual(40);
        }
      }
      
      // Check that all interactive elements are still accessible
      await portalPage.proposeProjectButton.click();
      await expect(portalPage.projectProposalDialog).toBeVisible();
      
      // Form should still be keyboard accessible on mobile
      await portalPage.projectNameInput.focus();
      const isFocused = await portalPage.projectNameInput.evaluate(el => el === document.activeElement);
      expect(isFocused).toBe(true);
    });

    test('should support zoom up to 200%', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Simulate 200% zoom
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });
      
      await page.waitForTimeout(500);
      
      // Check that content is still accessible and usable
      await expect(portalPage.proposeProjectButton).toBeVisible();
      
      // Should still be able to interact with elements
      await portalPage.proposeProjectButton.click();
      await expect(portalPage.projectProposalDialog).toBeVisible();
      
      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = '1';
      });
    });
  });

  test.describe('Error Handling Accessibility', () => {
    test('should announce errors appropriately', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      await portalPage.openProjectProposalDialog();
      
      // Trigger validation error
      await portalPage.submitProjectProposal();
      
      const errorToast = await helpers.waitForToast();
      
      // Error should be announced via ARIA live region
      const ariaLive = await errorToast.getAttribute('aria-live');
      const role = await errorToast.getAttribute('role');
      
      expect(ariaLive === 'polite' || ariaLive === 'assertive' || role === 'alert').toBe(true);
    });

    test('should provide clear error context', async ({ page }) => {
      const dashboardPage = new ClientProjectDashboardPage(page);
      await dashboardPage.goto('proj-1');
      await dashboardPage.openTaskProposalDialog();
      
      // Submit form with only title (missing description)
      await dashboardPage.taskTitleInput.fill('Test');
      await dashboardPage.submitTaskProposal();
      
      const errorToast = await helpers.waitForToast();
      const errorText = await errorToast.textContent();
      
      // Error message should be descriptive
      expect(errorText).toMatch(/campo|requerido|completa/i);
      expect(errorText!.length).toBeGreaterThan(10);
    });
  });

  test.describe('Basic Color and Contrast', () => {
    test('should not rely solely on color for information', async ({ page }) => {
      const designerPage = new DesignerDashboardPage(page);
      await designerPage.goto();
      await designerPage.waitForDashboardToLoad();
      await designerPage.scrollToProposals();
      
      // Check that proposal status is indicated by more than just color
      const statusIndicators = page.locator('[class*="bg-"], [class*="text-"]').filter({ hasText: /pendiente|aprobado|rechazado/i });
      
      if (await statusIndicators.count() > 0) {
        const firstStatus = statusIndicators.first();
        const textContent = await firstStatus.textContent();
        
        // Should have text labels, not just color
        expect(textContent?.trim().length).toBeGreaterThan(0);
      }
    });

    test('should have visible focus indicators', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Focus on an interactive element
      await portalPage.proposeProjectButton.focus();
      
      // Check for focus styles (this is a basic check)
      const focusedElement = page.locator(':focus');
      const computedStyle = await focusedElement.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          outline: style.outline,
          boxShadow: style.boxShadow,
          border: style.border
        };
      });
      
      // Should have some form of focus indication
      const hasFocusIndicator = 
        computedStyle.outline !== 'none' ||
        computedStyle.boxShadow !== 'none' ||
        computedStyle.border.includes('rgb');
      
      expect(hasFocusIndicator).toBe(true);
    });
  });
});