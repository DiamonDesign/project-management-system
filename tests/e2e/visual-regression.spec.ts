import { test, expect } from '@playwright/test';
import { ClientPortalPage } from './page-objects/ClientPortalPage';
import { ClientProjectDashboardPage } from './page-objects/ClientProjectDashboardPage';
import { DesignerDashboardPage } from './page-objects/DesignerDashboardPage';
import { TestHelpers, testData } from './utils/test-helpers';

test.describe('Visual Regression Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Client Portal Screenshots', () => {
    let portalPage: ClientPortalPage;

    test.beforeEach(async ({ page }) => {
      portalPage = new ClientPortalPage(page);
    });

    test('should capture client portal main page', async ({ page }) => {
      await portalPage.goto('techcorp');
      await helpers.waitForPageToLoad();
      
      // Take full page screenshot
      await expect(page).toHaveScreenshot('client-portal-main.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should capture project proposal dialog', async ({ page }) => {
      await portalPage.goto('techcorp');
      await portalPage.openProjectProposalDialog();
      
      // Screenshot of empty dialog
      await expect(page).toHaveScreenshot('project-proposal-dialog-empty.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Fill form and screenshot
      await portalPage.fillProjectProposal(testData.project);
      await expect(page).toHaveScreenshot('project-proposal-dialog-filled.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should capture grid vs list view modes', async ({ page }) => {
      await portalPage.goto('techcorp');
      
      // Grid view screenshot
      await portalPage.setViewMode('grid');
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('client-portal-grid-view.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      // List view screenshot
      await portalPage.setViewMode('list');
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('client-portal-list-view.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should capture filtered states', async ({ page }) => {
      await portalPage.goto('techcorp');
      
      // Active projects filter
      await portalPage.setStatusFilter('active');
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('client-portal-active-filter.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Completed projects filter
      await portalPage.setStatusFilter('completed');
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('client-portal-completed-filter.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should capture search functionality', async ({ page }) => {
      await portalPage.goto('techcorp');
      
      // Search with results
      await portalPage.searchProjects('diseño');
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('client-portal-search-results.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Search with no results
      await portalPage.searchProjects('xyz123nonexistent');
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('client-portal-no-results.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Client Project Dashboard Screenshots', () => {
    let dashboardPage: ClientProjectDashboardPage;

    test.beforeEach(async ({ page }) => {
      dashboardPage = new ClientProjectDashboardPage(page);
    });

    test('should capture project dashboard main view', async ({ page }) => {
      await dashboardPage.goto('proj-1');
      await helpers.waitForPageToLoad();
      
      await expect(page).toHaveScreenshot('client-project-dashboard.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should capture task proposal dialog', async ({ page }) => {
      await dashboardPage.goto('proj-1');
      await dashboardPage.openTaskProposalDialog();
      
      // Empty dialog
      await expect(page).toHaveScreenshot('task-proposal-dialog-empty.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Filled dialog
      await dashboardPage.fillTaskProposal(testData.task);
      await expect(page).toHaveScreenshot('task-proposal-dialog-filled.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should capture project progress and deliverables', async ({ page }) => {
      await dashboardPage.goto('proj-1');
      
      // Focus on progress section
      await dashboardPage.progressBar.scrollIntoViewIfNeeded();
      await expect(dashboardPage.progressBar.locator('..').locator('..')).toHaveScreenshot('project-progress-section.png');
      
      // Focus on deliverables section
      await dashboardPage.deliverables.scrollIntoViewIfNeeded();
      await expect(dashboardPage.deliverables).toHaveScreenshot('project-deliverables-section.png');
    });

    test('should capture quick actions sidebar', async ({ page }) => {
      await dashboardPage.goto('proj-1');
      
      // Scroll to quick actions
      await dashboardPage.proposeTaskButton.scrollIntoViewIfNeeded();
      
      // Screenshot of quick actions card
      const quickActionsCard = dashboardPage.proposeTaskButton.locator('..').locator('..');
      await expect(quickActionsCard).toHaveScreenshot('quick-actions-sidebar.png');
    });
  });

  test.describe('Designer Dashboard Screenshots', () => {
    let designerPage: DesignerDashboardPage;

    test.beforeEach(async ({ page }) => {
      designerPage = new DesignerDashboardPage(page);
    });

    test('should capture designer dashboard overview', async ({ page }) => {
      await designerPage.goto();
      await designerPage.waitForDashboardToLoad();
      
      await expect(page).toHaveScreenshot('designer-dashboard-overview.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should capture proposals notifications section', async ({ page }) => {
      await designerPage.goto();
      await designerPage.waitForDashboardToLoad();
      await designerPage.scrollToProposals();
      
      // Screenshot of proposals section
      await expect(designerPage.proposalsNotificationsCard).toHaveScreenshot('proposals-notifications-section.png');
    });

    test('should capture individual proposal cards', async ({ page }) => {
      await designerPage.goto();
      await designerPage.waitForDashboardToLoad();
      await designerPage.scrollToProposals();
      
      const proposalsCount = await designerPage.getProposalsCount();
      
      if (proposalsCount > 0) {
        // Screenshot first proposal
        const firstProposal = designerPage.proposalsList.locator('.border.rounded-lg').first();
        await expect(firstProposal).toHaveScreenshot('proposal-card-example.png');
      }
    });

    test('should capture KPI metrics section', async ({ page }) => {
      await designerPage.goto();
      await designerPage.waitForDashboardToLoad();
      
      // Find and screenshot KPI section
      const kpiSection = page.locator('text=/proyectos|tareas|completitud/i').locator('..').first();
      if (await kpiSection.count() > 0) {
        await expect(kpiSection).toHaveScreenshot('kpi-metrics-section.png');
      }
    });
  });

  test.describe('Responsive Design Screenshots', () => {
    test('should capture mobile layouts', async ({ page }) => {
      await helpers.setMobileViewport();
      
      // Mobile client portal
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      await expect(page).toHaveScreenshot('mobile-client-portal.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Mobile project dashboard
      const dashboardPage = new ClientProjectDashboardPage(page);
      await dashboardPage.goto('proj-1');
      await expect(page).toHaveScreenshot('mobile-project-dashboard.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Mobile task proposal dialog
      await dashboardPage.openTaskProposalDialog();
      await expect(page).toHaveScreenshot('mobile-task-proposal-dialog.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should capture tablet layouts', async ({ page }) => {
      await helpers.setTabletViewport();
      
      // Tablet client portal
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      await expect(page).toHaveScreenshot('tablet-client-portal.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Tablet designer dashboard
      const designerPage = new DesignerDashboardPage(page);
      await designerPage.goto();
      await designerPage.waitForDashboardToLoad();
      await expect(page).toHaveScreenshot('tablet-designer-dashboard.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should capture desktop layouts in different widths', async ({ page }) => {
      // Standard desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      await expect(page).toHaveScreenshot('desktop-1280-client-portal.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Wide desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.reload();
      await helpers.waitForPageToLoad();
      await expect(page).toHaveScreenshot('desktop-1920-client-portal.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Interaction State Screenshots', () => {
    test('should capture hover and focus states', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Hover state on project card
      const firstProjectCard = portalPage.projectCards.first();
      await firstProjectCard.hover();
      await page.waitForTimeout(300); // Wait for hover animation
      await expect(page).toHaveScreenshot('project-card-hover-state.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Focus state on propose project button
      await portalPage.proposeProjectButton.focus();
      await expect(page).toHaveScreenshot('propose-button-focus-state.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should capture loading states', async ({ page }) => {
      // Simulate slow network to capture loading states
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100);
      });
      
      const designerPage = new DesignerDashboardPage(page);
      
      // Navigate and try to capture loading state
      const navigationPromise = designerPage.goto();
      
      // Take screenshot during navigation (might catch loading state)
      await page.waitForTimeout(200);
      await expect(page).toHaveScreenshot('dashboard-loading-state.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      await navigationPromise;
    });

    test('should capture error states', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Try to trigger validation error
      await portalPage.openProjectProposalDialog();
      await portalPage.submitProjectProposal(); // Submit empty form
      
      // Wait for error toast and capture
      await helpers.waitForToast();
      await expect(page).toHaveScreenshot('validation-error-state.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should capture success states', async ({ page }) => {
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Complete successful form submission
      await portalPage.openProjectProposalDialog();
      await portalPage.fillProjectProposal(testData.project);
      await portalPage.submitProjectProposal();
      
      // Wait for success toast and capture
      await helpers.waitForToast();
      await expect(page).toHaveScreenshot('success-toast-state.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Theme and Styling Screenshots', () => {
    test('should capture gradient backgrounds and styling', async ({ page }) => {
      // Client portal with gradient background
      const portalPage = new ClientPortalPage(page);
      await portalPage.goto('techcorp');
      
      // Focus on hero section with gradient
      const heroSection = page.locator('.bg-gradient-to-br').first();
      if (await heroSection.count() > 0) {
        await expect(heroSection).toHaveScreenshot('gradient-hero-section.png');
      }
    });

    test('should capture component styling consistency', async ({ page }) => {
      const dashboardPage = new ClientProjectDashboardPage(page);
      await dashboardPage.goto('proj-1');
      
      // Capture card styling consistency
      const cards = page.locator('.card, [class*="card"]').first();
      if (await cards.count() > 0) {
        await expect(cards).toHaveScreenshot('card-component-styling.png');
      }
      
      // Capture button styling
      await dashboardPage.openTaskProposalDialog();
      const buttonGroup = page.locator('button').first().locator('..');
      await expect(buttonGroup).toHaveScreenshot('button-group-styling.png');
    });

    test('should capture icon and typography consistency', async ({ page }) => {
      const designerPage = new DesignerDashboardPage(page);
      await designerPage.goto();
      await designerPage.waitForDashboardToLoad();
      
      // Focus on section with icons and typography
      await designerPage.scrollToProposals();
      
      const proposalsHeader = designerPage.proposalsNotificationsCard.locator('header, .card-header').first();
      if (await proposalsHeader.count() > 0) {
        await expect(proposalsHeader).toHaveScreenshot('typography-and-icons.png');
      }
    });
  });
});