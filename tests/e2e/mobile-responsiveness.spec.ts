import { test, expect } from '@playwright/test';
import { ClientPortalPage } from './page-objects/ClientPortalPage';
import { ClientProjectDashboardPage } from './page-objects/ClientProjectDashboardPage';
import { DesignerDashboardPage } from './page-objects/DesignerDashboardPage';
import { TestHelpers, testData } from './utils/test-helpers';

test.describe('Mobile Responsiveness Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Mobile Portrait (375x667)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    });

    test('should display client portal correctly on mobile', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Verify main elements are visible and properly stacked
      await expect(portalPage.page.locator('h1')).toBeVisible();
      
      // Check that propose project button is accessible
      await expect(portalPage.proposeProjectButton).toBeVisible();
      
      // Verify projects display in mobile layout (single column)
      const projectCount = await portalPage.getProjectCount();
      expect(projectCount).toBeGreaterThan(0);
      
      // Check search input is responsive
      await expect(portalPage.projectSearchInput).toBeVisible();
      
      // Take mobile screenshot
      await expect(page).toHaveScreenshot('mobile-client-portal-375.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should handle mobile project proposal flow', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Open proposal dialog on mobile
      await portalPage.openProjectProposalDialog();
      
      // Dialog should be properly sized for mobile
      await expect(portalPage.projectProposalDialog).toBeVisible();
      
      // Form fields should be accessible and properly sized
      await expect(portalPage.projectNameInput).toBeVisible();
      await expect(portalPage.projectDescriptionTextarea).toBeVisible();
      
      // Fill form on mobile
      await portalPage.fillProjectProposal({
        name: 'Mobile Test Project',
        description: 'Testing project proposal on mobile device',
        type: 'mobile',
        timeline: '2 meses',
        budget: '€10,000'
      });
      
      // Take screenshot of filled mobile form
      await expect(page).toHaveScreenshot('mobile-project-proposal-filled.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Submit should work on mobile
      await portalPage.submitProjectProposal();
      
      // Verify success toast on mobile
      await helpers.waitForToast();
      const toast = page.locator('[data-sonner-toast]');
      await expect(toast).toBeVisible();
      
      // Take screenshot with success toast
      await expect(page).toHaveScreenshot('mobile-success-toast.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should display project dashboard correctly on mobile', async ({ page }) => {
      const dashboardPage = new ClientProjectDashboardPage(page);
      await dashboardPage.goto('proj-1');
      
      // Verify key elements are visible
      await expect(dashboardPage.projectTitle).toBeVisible();
      await expect(dashboardPage.progressBar).toBeVisible();
      
      // Quick actions should be accessible
      await expect(dashboardPage.proposeTaskButton).toBeVisible();
      
      // Deliverables should be visible
      await expect(dashboardPage.deliverables).toBeVisible();
      
      // Take mobile dashboard screenshot
      await expect(page).toHaveScreenshot('mobile-project-dashboard-375.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should handle mobile task proposal flow', async ({ page }) => {
      const dashboardPage = new ClientProjectDashboardPage(page);
      await dashboardPage.goto('proj-1');
      
      // Open task proposal on mobile
      await dashboardPage.openTaskProposalDialog();
      
      // Form should be properly sized
      await expect(dashboardPage.taskProposalDialog).toBeVisible();
      
      // Fill task form on mobile
      await dashboardPage.fillTaskProposal({
        title: 'Mobile Task Test',
        description: 'Testing task proposal on mobile',
        priority: 'high',
        dueDate: '2024-03-15'
      });
      
      // Take screenshot of mobile task form
      await expect(page).toHaveScreenshot('mobile-task-proposal-filled.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Submit task proposal
      await dashboardPage.submitTaskProposal();
      
      // Verify success on mobile
      await helpers.waitForToast();
      const toast = page.locator('[data-sonner-toast]');
      await expect(toast).toBeVisible();
    });

    test('should handle touch interactions', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Test touch tap on project card
      const projectCard = portalPage.projectCards.first();
      await projectCard.tap();
      
      // Should navigate to project detail
      await expect(page).toHaveURL(/\/client-portal\/dashboard\//);
      
      // Go back and test button tap
      await page.goBack();
      
      // Test touch on propose project button
      await portalPage.proposeProjectButton.tap();
      await expect(portalPage.projectProposalDialog).toBeVisible();
    });

    test('should scroll properly on mobile', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Test vertical scrolling
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);
      
      // Elements should still be accessible after scroll
      await expect(portalPage.proposeProjectButton).toBeVisible();
      
      // Test horizontal scrolling if needed (e.g., for cards)
      const container = page.locator('.grid, .flex').first();
      if (await container.count() > 0) {
        await container.evaluate(el => el.scrollLeft = 100);
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Mobile Landscape (667x375)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 667, height: 375 }); // iPhone SE landscape
    });

    test('should adapt to landscape orientation', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Verify layout adapts to landscape
      await expect(portalPage.page.locator('h1')).toBeVisible();
      await expect(portalPage.proposeProjectButton).toBeVisible();
      
      // Projects might display in multiple columns in landscape
      const projectCount = await portalPage.getProjectCount();
      expect(projectCount).toBeGreaterThan(0);
      
      // Take landscape screenshot
      await expect(page).toHaveScreenshot('mobile-landscape-portal.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should handle modal dialogs in landscape', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      await portalPage.openProjectProposalDialog();
      
      // Dialog should fit in landscape viewport
      await expect(portalPage.projectProposalDialog).toBeVisible();
      
      // Form should be usable in landscape
      await portalPage.projectNameInput.fill('Landscape Test');
      await portalPage.projectDescriptionTextarea.fill('Testing in landscape mode');
      
      // Take landscape dialog screenshot
      await expect(page).toHaveScreenshot('mobile-landscape-dialog.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Tablet Portrait (768x1024)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    });

    test('should display tablet layout correctly', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Verify tablet layout (might show more columns)
      await expect(portalPage.page.locator('h1')).toBeVisible();
      
      // Projects should display in multiple columns
      const projectCount = await portalPage.getProjectCount();
      expect(projectCount).toBeGreaterThan(0);
      
      // Take tablet screenshot
      await expect(page).toHaveScreenshot('tablet-portrait-portal.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should handle tablet interactions', async ({ page }) => {
      const dashboardPage = new ClientProjectDashboardPage(page);
      await dashboardPage.goto('proj-1');
      
      // Verify tablet dashboard layout
      await expect(dashboardPage.projectTitle).toBeVisible();
      await expect(dashboardPage.designerInfo).toBeVisible();
      
      // Test tablet task proposal
      await dashboardPage.openTaskProposalDialog();
      await expect(dashboardPage.taskProposalDialog).toBeVisible();
      
      // Form should be well-spaced on tablet
      await dashboardPage.fillTaskProposal(testData.task);
      
      // Take tablet task form screenshot
      await expect(page).toHaveScreenshot('tablet-task-proposal.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      await dashboardPage.submitTaskProposal();
      await helpers.waitForToast();
    });
  });

  test.describe('Tablet Landscape (1024x768)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 }); // iPad landscape
    });

    test('should display landscape tablet layout', async ({ page }) => {
      const designerPage = new DesignerDashboardPage(page);
      await designerPage.goto();
      await designerPage.waitForDashboardToLoad();
      
      // Verify designer dashboard on tablet landscape
      await expect(designerPage.proposalsNotificationsCard).toBeVisible();
      
      // Should show more content side by side
      await designerPage.scrollToProposals();
      const proposalsCount = await designerPage.getProposalsCount();
      expect(proposalsCount).toBeGreaterThanOrEqual(0);
      
      // Take tablet landscape screenshot
      await expect(page).toHaveScreenshot('tablet-landscape-dashboard.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Small Mobile (320x568)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 }); // iPhone 5
    });

    test('should work on very small screens', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Even on small screens, core functionality should work
      await expect(portalPage.proposeProjectButton).toBeVisible();
      
      // Test that we can still interact with elements
      await portalPage.openProjectProposalDialog();
      await expect(portalPage.projectProposalDialog).toBeVisible();
      
      // Form fields should be accessible
      await expect(portalPage.projectNameInput).toBeVisible();
      
      // Take small screen screenshot
      await expect(page).toHaveScreenshot('small-mobile-portal.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should handle text input on small screens', async ({ page }) => {
      const dashboardPage = new ClientProjectDashboardPage(page);
      await dashboardPage.goto('proj-1');
      
      await dashboardPage.openTaskProposalDialog();
      
      // Form should be usable even on small screens
      await dashboardPage.taskTitleInput.fill('Small screen test');
      await dashboardPage.taskDescriptionTextarea.fill('Testing on very small mobile screen');
      
      // Submit should work
      await dashboardPage.submitTaskProposal();
      await helpers.waitForToast();
    });
  });

  test.describe('Touch Target Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should have appropriately sized touch targets', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Check button sizes meet accessibility guidelines (44x44px minimum)
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const boundingBox = await button.boundingBox();
        
        if (boundingBox && await button.isVisible()) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(40); // Allowing slight tolerance
          expect(boundingBox.width).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('should have adequate spacing between touch targets', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      await portalPage.openProjectProposalDialog();
      
      // Check spacing between dialog buttons
      const submitButton = portalPage.submitProjectProposalButton;
      const cancelButton = portalPage.cancelProjectProposalButton;
      
      const submitBox = await submitButton.boundingBox();
      const cancelBox = await cancelButton.boundingBox();
      
      if (submitBox && cancelBox) {
        const distance = Math.abs(submitBox.x - (cancelBox.x + cancelBox.width));
        expect(distance).toBeGreaterThanOrEqual(8); // Minimum spacing
      }
    });
  });

  test.describe('Orientation Change Handling', () => {
    test('should handle orientation changes gracefully', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await portalPage.goto('techcorp');
      
      // Verify content loads in portrait
      await expect(portalPage.proposeProjectButton).toBeVisible();
      
      // Change to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500); // Allow layout to adjust
      
      // Content should still be accessible
      await expect(portalPage.proposeProjectButton).toBeVisible();
      
      // Test interaction in new orientation
      await portalPage.openProjectProposalDialog();
      await expect(portalPage.projectProposalDialog).toBeVisible();
    });

    test('should preserve form state during orientation change', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      
      // Start in portrait and open form
      await page.setViewportSize({ width: 375, height: 667 });
      await portalPage.goto('techcorp');
      await portalPage.openProjectProposalDialog();
      
      // Fill some data
      await portalPage.projectNameInput.fill('Test Project');
      await portalPage.projectDescriptionTextarea.fill('Test Description');
      
      // Change to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);
      
      // Form data should be preserved
      const nameValue = await portalPage.projectNameInput.inputValue();
      const descValue = await portalPage.projectDescriptionTextarea.inputValue();
      
      expect(nameValue).toBe('Test Project');
      expect(descValue).toBe('Test Description');
    });
  });

  test.describe('Mobile Performance', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should load efficiently on mobile', async ({ page }) => {
      const startTime = Date.now();
      
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Page should load within reasonable time
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
      
      // Key elements should be visible quickly
      await expect(portalPage.proposeProjectButton).toBeVisible();
    });

    test('should handle rapid interactions', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Test rapid button taps (simulate user double-tapping)
      await portalPage.proposeProjectButton.tap();
      await portalPage.proposeProjectButton.tap();
      
      // Should only open one dialog
      const dialogCount = await page.locator('[role="dialog"]').count();
      expect(dialogCount).toBe(1);
    });
  });

  test.describe('Mobile Text and Input Handling', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should handle virtual keyboard interactions', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      await portalPage.openProjectProposalDialog();
      
      // Focus on text input
      await portalPage.projectNameInput.focus();
      
      // Type text (simulates virtual keyboard)
      await portalPage.projectNameInput.type('Mobile Project Name');
      
      // Move to textarea
      await portalPage.projectDescriptionTextarea.focus();
      await portalPage.projectDescriptionTextarea.type('Mobile project description with multiple lines of text to test text wrapping and input handling');
      
      // Verify text was entered correctly
      const nameValue = await portalPage.projectNameInput.inputValue();
      const descValue = await portalPage.projectDescriptionTextarea.inputValue();
      
      expect(nameValue).toBe('Mobile Project Name');
      expect(descValue).toContain('Mobile project description');
    });

    test('should handle text selection on mobile', async ({ page }) => {
      const dashboardPage = new ClientProjectDashboardPage(page);
      await dashboardPage.goto('proj-1');
      await dashboardPage.openTaskProposalDialog();
      
      // Fill text field
      await dashboardPage.taskTitleInput.fill('Selectable Text');
      
      // Select all text (mobile gesture)
      await dashboardPage.taskTitleInput.selectText();
      
      // Type new text (should replace selected text)
      await page.keyboard.type('New Text');
      
      const value = await dashboardPage.taskTitleInput.inputValue();
      expect(value).toBe('New Text');
    });
  });
});