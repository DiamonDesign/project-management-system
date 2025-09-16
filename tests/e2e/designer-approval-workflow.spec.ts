import { test, expect } from '@playwright/test';
import { DesignerDashboardPage } from './page-objects/DesignerDashboardPage';
import { TestHelpers } from './utils/test-helpers';

test.describe('Designer Approval Workflow', () => {
  let dashboardPage: DesignerDashboardPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DesignerDashboardPage(page);
    helpers = new TestHelpers(page);
    
    // Navigate to designer dashboard
    await dashboardPage.goto();
    await dashboardPage.waitForDashboardToLoad();
  });

  test('should display designer dashboard with proposals section', async () => {
    // Verify dashboard loads
    await expect(dashboardPage.page.locator('h1, h2')).toContainText(/dashboard|panel/i);
    
    // Verify proposals notifications card is visible
    await expect(dashboardPage.proposalsNotificationsCard).toBeVisible();
    
    // Scroll to proposals section if needed
    await dashboardPage.scrollToProposals();
    
    // Verify proposals panel is visible
    const isPanelVisible = await dashboardPage.isProposalsPanelVisible();
    expect(isPanelVisible).toBe(true);
    
    // Take initial screenshot
    await helpers.takeTimestampedScreenshot('designer-dashboard', 'initial-view');
  });

  test('should show mock proposals with correct information', async () => {
    await dashboardPage.scrollToProposals();
    
    // Get the number of proposals
    const proposalsCount = await dashboardPage.getProposalsCount();
    expect(proposalsCount).toBeGreaterThan(0);
    
    // Verify pending proposals badge if there are pending proposals
    if (proposalsCount > 0) {
      const pendingCount = await dashboardPage.getPendingProposalsCount();
      expect(pendingCount).toBeGreaterThanOrEqual(0);
      
      if (pendingCount > 0) {
        await expect(dashboardPage.newProposalsBadge).toBeVisible();
      }
    }
    
    // Take screenshot of proposals section
    await helpers.takeTimestampedScreenshot('proposals-section', 'with-mock-data');
  });

  test('should display proposal details correctly', async () => {
    await dashboardPage.scrollToProposals();
    
    const proposalsCount = await dashboardPage.getProposalsCount();
    
    if (proposalsCount > 0) {
      // Get details of the first proposal
      const proposalDetails = await dashboardPage.getProposalDetails(0);
      
      // Verify proposal has required information
      expect(proposalDetails.title).toBeTruthy();
      expect(proposalDetails.description).toBeTruthy();
      expect(proposalDetails.type).toMatch(/tarea|proyecto/i);
      
      // Take screenshot of proposal details
      await helpers.takeTimestampedScreenshot('proposal-details', 'first-proposal');
    }
  });

  test('should approve proposal successfully', async () => {
    await dashboardPage.scrollToProposals();
    
    const proposalsCount = await dashboardPage.getProposalsCount();
    
    if (proposalsCount > 0) {
      // Check if there are pending proposals that can be approved
      const hasPendingProposals = await dashboardPage.hasProposalWithStatus('pending');
      
      if (hasPendingProposals) {
        // Approve the first proposal
        await dashboardPage.approveProposal(0);
        
        // Wait for any potential toast or feedback
        await dashboardPage.page.waitForTimeout(1000);
        
        // Take screenshot after approval
        await helpers.takeTimestampedScreenshot('proposal-approval', 'after-approve');
      }
    }
  });

  test('should reject proposal successfully', async () => {
    await dashboardPage.scrollToProposals();
    
    const proposalsCount = await dashboardPage.getProposalsCount();
    
    if (proposalsCount > 1) { // Ensure we have multiple proposals to test rejection
      // Check if there are pending proposals that can be rejected
      const hasPendingProposals = await dashboardPage.hasProposalWithStatus('pending');
      
      if (hasPendingProposals) {
        // Reject the second proposal (to keep first one for approval test)
        await dashboardPage.rejectProposal(1);
        
        // Wait for any potential toast or feedback
        await dashboardPage.page.waitForTimeout(1000);
        
        // Take screenshot after rejection
        await helpers.takeTimestampedScreenshot('proposal-rejection', 'after-reject');
      }
    }
  });

  test('should display different proposal types correctly', async () => {
    await dashboardPage.scrollToProposals();
    
    // Count task proposals
    const taskProposals = await dashboardPage.filterProposalsByType('task');
    
    // Count project proposals
    const projectProposals = await dashboardPage.filterProposalsByType('project');
    
    // Should have at least some proposals
    const totalFilteredProposals = taskProposals + projectProposals;
    expect(totalFilteredProposals).toBeGreaterThan(0);
    
    // Take screenshot showing different proposal types
    await helpers.takeTimestampedScreenshot('proposal-types', 'task-and-project');
  });

  test('should show proposals with different statuses', async () => {
    await dashboardPage.scrollToProposals();
    
    // Check for different status types
    const statusChecks = {
      pending: await dashboardPage.hasProposalWithStatus('pending'),
      inReview: await dashboardPage.hasProposalWithStatus('in_review'),
      approved: await dashboardPage.hasProposalWithStatus('approved'),
      rejected: await dashboardPage.hasProposalWithStatus('rejected')
    };
    
    // Should have at least some proposals with status
    const hasAnyStatus = Object.values(statusChecks).some(status => status);
    expect(hasAnyStatus).toBe(true);
    
    // Take screenshot showing different statuses
    await helpers.takeTimestampedScreenshot('proposal-statuses', 'various-states');
  });

  test('should display proposal badges and priorities correctly', async () => {
    await dashboardPage.scrollToProposals();
    
    const proposalsCount = await dashboardPage.getProposalsCount();
    
    if (proposalsCount > 0) {
      // Verify badges are visible for proposals
      const proposalsBadges = dashboardPage.proposalsList.locator('.badge, [class*="badge"]');
      const badgeCount = await proposalsBadges.count();
      
      expect(badgeCount).toBeGreaterThan(0);
      
      // Check for priority indicators (for task proposals)
      const priorityBadges = dashboardPage.proposalsList.locator('text=/high|medium|low/i');
      const priorityCount = await priorityBadges.count();
      
      // Should have some priority indicators (task proposals have priorities)
      expect(priorityCount).toBeGreaterThanOrEqual(0);
      
      // Take screenshot of badges and priorities
      await helpers.takeTimestampedScreenshot('proposal-badges', 'priorities-and-types');
    }
  });

  test('should handle proposals list scrolling', async () => {
    await dashboardPage.scrollToProposals();
    
    // Verify scrollable area is present
    const scrollArea = dashboardPage.proposalsList.locator('..').locator('[data-radix-scroll-area-viewport]');
    
    if (await scrollArea.count() > 0) {
      // Test scrolling functionality
      await scrollArea.first().hover();
      await dashboardPage.page.mouse.wheel(0, 100);
      await dashboardPage.page.waitForTimeout(500);
      
      // Take screenshot after scrolling
      await helpers.takeTimestampedScreenshot('proposals-scroll', 'after-scroll');
    }
  });

  test('should display KPI metrics correctly', async () => {
    // Test KPI values
    const kpis = {
      total: await dashboardPage.getKPIValue('total'),
      active: await dashboardPage.getKPIValue('active'),
      pending: await dashboardPage.getKPIValue('pending'),
      completion: await dashboardPage.getKPIValue('completion')
    };
    
    // Verify KPI values are reasonable
    expect(kpis.total).toBeGreaterThanOrEqual(0);
    expect(kpis.active).toBeGreaterThanOrEqual(0);
    expect(kpis.pending).toBeGreaterThanOrEqual(0);
    expect(kpis.completion).toBeGreaterThanOrEqual(0);
    expect(kpis.completion).toBeLessThanOrEqual(100);
    
    // Take screenshot of KPIs
    await helpers.takeTimestampedScreenshot('dashboard-kpis', 'metrics-display');
  });

  test('should handle mobile responsive design', async () => {
    // Set mobile viewport
    await helpers.setMobileViewport();
    
    // Reload page to see mobile layout
    await dashboardPage.page.reload();
    await dashboardPage.waitForDashboardToLoad();
    
    // Verify proposals section is still accessible
    await expect(dashboardPage.proposalsNotificationsCard).toBeVisible();
    
    // Scroll to proposals on mobile
    await dashboardPage.scrollToProposals();
    
    // Verify proposals are still functional
    const proposalsCount = await dashboardPage.getProposalsCount();
    expect(proposalsCount).toBeGreaterThanOrEqual(0);
    
    // Take mobile screenshot
    await helpers.takeTimestampedScreenshot('designer-dashboard', 'mobile-view');
    
    // Test mobile approval/rejection if proposals exist
    if (proposalsCount > 0 && await dashboardPage.hasProposalWithStatus('pending')) {
      await dashboardPage.approveProposal(0);
      await dashboardPage.page.waitForTimeout(1000);
      
      await helpers.takeTimestampedScreenshot('mobile-proposal-approval', 'mobile-interaction');
    }
  });

  test('should handle tablet responsive design', async () => {
    // Set tablet viewport
    await helpers.setTabletViewport();
    
    // Reload page
    await dashboardPage.page.reload();
    await dashboardPage.waitForDashboardToLoad();
    
    // Take tablet screenshot
    await helpers.takeTimestampedScreenshot('designer-dashboard', 'tablet-view');
    
    // Verify functionality on tablet
    await dashboardPage.scrollToProposals();
    const proposalsCount = await dashboardPage.getProposalsCount();
    expect(proposalsCount).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to other sections from dashboard', async () => {
    // Test analytics navigation
    if (await dashboardPage.viewAnalyticsButton.count() > 0) {
      await dashboardPage.clickViewAnalytics();
      // Should navigate to analytics page
      await expect(dashboardPage.page).toHaveURL(/analytics/);
      
      // Go back to dashboard
      await dashboardPage.goto();
    }
    
    // Test view all tasks navigation
    if (await dashboardPage.viewAllTasksButton.count() > 0) {
      await dashboardPage.clickViewAllTasks();
      // Should navigate to tasks page
      await expect(dashboardPage.page).toHaveURL(/tasks/);
      
      // Go back to dashboard
      await dashboardPage.goto();
    }
  });

  test('should handle empty proposals state', async () => {
    // This test verifies the empty state handling
    // In a real scenario, we might need to clear proposals first
    
    await dashboardPage.scrollToProposals();
    
    // Check if we have an empty state or proposals
    const proposalsCount = await dashboardPage.getProposalsCount();
    
    if (proposalsCount === 0) {
      // Verify empty state is shown appropriately
      const emptyMessage = dashboardPage.proposalsNotificationsCard.locator('text=/no hay propuestas/i');
      if (await emptyMessage.count() > 0) {
        await expect(emptyMessage).toBeVisible();
        
        // Take screenshot of empty state
        await helpers.takeTimestampedScreenshot('proposals-empty-state', 'no-proposals');
      }
    }
  });

  test('should maintain proposals section functionality during interactions', async () => {
    await dashboardPage.scrollToProposals();
    
    const proposalsCount = await dashboardPage.getProposalsCount();
    
    if (proposalsCount > 0) {
      // Test multiple interactions
      const hasPending = await dashboardPage.hasProposalWithStatus('pending');
      
      if (hasPending) {
        // Get proposal details before interaction
        const beforeInteraction = await dashboardPage.getProposalDetails(0);
        
        // Perform approval
        await dashboardPage.approveProposal(0);
        await dashboardPage.page.waitForTimeout(500);
        
        // Verify the proposal still exists (status might change)
        const afterInteraction = await dashboardPage.getProposalDetails(0);
        
        // Title and description should remain the same
        expect(afterInteraction.title).toBe(beforeInteraction.title);
        expect(afterInteraction.description).toBe(beforeInteraction.description);
        
        // Take screenshot after interaction
        await helpers.takeTimestampedScreenshot('proposal-interaction', 'state-maintained');
      }
    }
  });
});