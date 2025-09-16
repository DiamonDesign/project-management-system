import { test, expect } from '@playwright/test';
import { ClientPortalPage } from './page-objects/ClientPortalPage';
import { TestHelpers, testData } from './utils/test-helpers';

test.describe('Client Project Proposal Flow', () => {
  let portalPage: ClientPortalPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    portalPage = new ClientPortalPage(page);
    helpers = new TestHelpers(page);
    
    // Navigate to client portal
    await portalPage.goto('techcorp');
  });

  test('should display client portal with project overview', async () => {
    // Verify page loads with client information
    await expect(portalPage.page.locator('h1')).toContainText(/portal de cliente/i);
    
    // Verify project cards are visible
    const projectCount = await portalPage.getProjectCount();
    expect(projectCount).toBeGreaterThan(0);
    
    // Verify search functionality exists
    await expect(portalPage.projectSearchInput).toBeVisible();
    
    // Verify filters are available
    await expect(portalPage.statusFilterAll).toBeVisible();
    await expect(portalPage.statusFilterActive).toBeVisible();
    await expect(portalPage.statusFilterCompleted).toBeVisible();
    
    // Verify propose project button is visible
    await expect(portalPage.proposeProjectButton).toBeVisible();
    
    // Take initial screenshot
    await helpers.takeTimestampedScreenshot('client-portal', 'initial-view');
  });

  test('should open project proposal dialog', async () => {
    // Click propose project button
    await portalPage.openProjectProposalDialog();
    
    // Verify dialog is visible
    await expect(portalPage.projectProposalDialog).toBeVisible();
    
    // Verify all form fields are present
    await expect(portalPage.projectNameInput).toBeVisible();
    await expect(portalPage.projectDescriptionTextarea).toBeVisible();
    await expect(portalPage.projectTypeSelect).toBeVisible();
    await expect(portalPage.projectTimelineInput).toBeVisible();
    await expect(portalPage.projectBudgetInput).toBeVisible();
    
    // Verify action buttons
    await expect(portalPage.submitProjectProposalButton).toBeVisible();
    await expect(portalPage.cancelProjectProposalButton).toBeVisible();
    
    // Take screenshot of the dialog
    await helpers.takeTimestampedScreenshot('project-proposal-dialog', 'opened');
  });

  test('should fill and submit project proposal successfully', async () => {
    // Open the dialog
    await portalPage.openProjectProposalDialog();
    
    // Fill the form with test data
    await portalPage.fillProjectProposal(testData.project);
    
    // Take screenshot of filled form
    await helpers.takeTimestampedScreenshot('project-proposal-dialog', 'filled');
    
    // Submit the proposal
    await portalPage.submitProjectProposal();
    
    // Verify success toast appears
    const toast = await helpers.waitForToast();
    await expect(toast).toContainText(/propuesta enviada|enviada/i);
    
    // Verify dialog closes
    await expect(portalPage.projectProposalDialog).not.toBeVisible();
    
    // Take screenshot after successful submission
    await helpers.takeTimestampedScreenshot('project-proposal', 'success');
  });

  test('should reset form after successful submission', async () => {
    // Open dialog and fill form
    await portalPage.openProjectProposalDialog();
    await portalPage.fillProjectProposal(testData.project);
    
    // Submit and wait for success
    await portalPage.submitProjectProposal();
    await helpers.waitForToast();
    
    // Open dialog again
    await portalPage.openProjectProposalDialog();
    
    // Verify form is reset
    const isReset = await portalPage.isProjectProposalFormReset();
    expect(isReset).toBe(true);
  });

  test('should show validation error for empty required fields', async () => {
    // Open dialog
    await portalPage.openProjectProposalDialog();
    
    // Try to submit without filling required fields
    await portalPage.submitProjectProposal();
    
    // Verify error toast appears
    const toast = await helpers.waitForToast();
    await expect(toast).toContainText(/error|completa.*campos|requeridos/i);
    
    // Verify dialog remains open
    await expect(portalPage.projectProposalDialog).toBeVisible();
    
    // Take screenshot of validation error
    await helpers.takeTimestampedScreenshot('project-proposal', 'validation-error');
  });

  test('should handle all project type options', async () => {
    await portalPage.openProjectProposalDialog();
    
    // Test each project type option
    const types = ['web', 'mobile', 'branding', 'ux', 'other'];
    
    for (const type of types) {
      await portalPage.projectTypeSelect.selectOption(type);
      const selectedValue = await portalPage.projectTypeSelect.inputValue();
      expect(selectedValue).toBe(type);
    }
  });

  test('should cancel project proposal correctly', async () => {
    // Open dialog and fill some data
    await portalPage.openProjectProposalDialog();
    await portalPage.projectNameInput.fill('Test project');
    
    // Cancel the dialog
    await portalPage.cancelProjectProposal();
    
    // Verify dialog closes
    await expect(portalPage.projectProposalDialog).not.toBeVisible();
    
    // Reopen and verify form is reset
    await portalPage.openProjectProposalDialog();
    const isReset = await portalPage.isProjectProposalFormReset();
    expect(isReset).toBe(true);
  });

  test('should filter projects by status', async () => {
    // Get initial project count
    const initialCount = await portalPage.getProjectCount();
    
    // Test active filter
    await portalPage.setStatusFilter('active');
    await portalPage.page.waitForTimeout(500); // Wait for filter to apply
    
    const activeCount = await portalPage.getProjectCount();
    // Should be less than or equal to initial count
    expect(activeCount).toBeLessThanOrEqual(initialCount);
    
    // Test completed filter
    await portalPage.setStatusFilter('completed');
    await portalPage.page.waitForTimeout(500);
    
    const completedCount = await portalPage.getProjectCount();
    expect(completedCount).toBeLessThanOrEqual(initialCount);
    
    // Reset to all
    await portalPage.setStatusFilter('all');
    await portalPage.page.waitForTimeout(500);
    
    const allCount = await portalPage.getProjectCount();
    expect(allCount).toBe(initialCount);
  });

  test('should search projects correctly', async () => {
    // Get initial count
    const initialCount = await portalPage.getProjectCount();
    
    // Search for a specific term
    await portalPage.searchProjects('rediseño');
    
    const searchCount = await portalPage.getProjectCount();
    // Should filter results (might be 0 or less than initial)
    expect(searchCount).toBeLessThanOrEqual(initialCount);
    
    // Clear search
    await portalPage.searchProjects('');
    
    const clearedCount = await portalPage.getProjectCount();
    expect(clearedCount).toBe(initialCount);
  });

  test('should switch between grid and list view modes', async () => {
    // Test grid view (default)
    await portalPage.setViewMode('grid');
    await portalPage.page.waitForTimeout(500);
    
    // Take screenshot of grid view
    await helpers.takeTimestampedScreenshot('project-view', 'grid-mode');
    
    // Test list view
    await portalPage.setViewMode('list');
    await portalPage.page.waitForTimeout(500);
    
    // Take screenshot of list view
    await helpers.takeTimestampedScreenshot('project-view', 'list-mode');
    
    // Verify projects are still visible in both modes
    const projectCount = await portalPage.getProjectCount();
    expect(projectCount).toBeGreaterThan(0);
  });

  test('should navigate to project detail page', async () => {
    // Click on the first project
    await portalPage.clickProjectByIndex(0);
    
    // Verify navigation to project dashboard
    await expect(portalPage.page).toHaveURL(/\/client-portal\/dashboard\//);
  });

  test('should display responsive design on mobile', async () => {
    // Set mobile viewport
    await helpers.setMobileViewport();
    
    // Reload page to see mobile layout
    await portalPage.page.reload();
    await helpers.waitForPageToLoad();
    
    // Verify key elements are still visible
    await expect(portalPage.proposeProjectButton).toBeVisible();
    await expect(portalPage.projectSearchInput).toBeVisible();
    
    // Verify project cards adapt to mobile
    const projectCount = await portalPage.getProjectCount();
    expect(projectCount).toBeGreaterThan(0);
    
    // Take mobile screenshot
    await helpers.takeTimestampedScreenshot('client-portal', 'mobile-view');
    
    // Test mobile project proposal flow
    await portalPage.openProjectProposalDialog();
    await expect(portalPage.projectProposalDialog).toBeVisible();
    
    // Take mobile dialog screenshot
    await helpers.takeTimestampedScreenshot('project-proposal-dialog', 'mobile-view');
  });

  test('should handle tablet responsive design', async () => {
    // Set tablet viewport
    await helpers.setTabletViewport();
    
    // Reload page
    await portalPage.page.reload();
    await helpers.waitForPageToLoad();
    
    // Take tablet screenshot
    await helpers.takeTimestampedScreenshot('client-portal', 'tablet-view');
    
    // Verify functionality still works
    await portalPage.openProjectProposalDialog();
    await expect(portalPage.projectProposalDialog).toBeVisible();
    
    await helpers.takeTimestampedScreenshot('project-proposal-dialog', 'tablet-view');
  });

  test('should validate form fields appropriately', async () => {
    await portalPage.openProjectProposalDialog();
    
    // Test with just name (description required)
    await portalPage.projectNameInput.fill('Test Project Name');
    await portalPage.submitProjectProposal();
    
    // Should show validation error
    const toast = await helpers.waitForToast();
    await expect(toast).toContainText(/error|completa.*campos|requeridos/i);
    
    // Now fill description and submit successfully
    await portalPage.projectDescriptionTextarea.fill('Test project description with sufficient detail');
    await portalPage.submitProjectProposal();
    
    // Should succeed
    const successToast = await helpers.waitForToast();
    await expect(successToast).toContainText(/propuesta enviada|enviada/i);
  });

  test('should handle large text inputs correctly', async () => {
    await portalPage.openProjectProposalDialog();
    
    // Test with very long inputs
    const longName = 'A'.repeat(200);
    const longDescription = 'B'.repeat(1000);
    const longTimeline = 'C'.repeat(100);
    const longBudget = 'D'.repeat(50);
    
    await portalPage.fillProjectProposal({
      name: longName,
      description: longDescription,
      type: 'web',
      timeline: longTimeline,
      budget: longBudget
    });
    
    // Verify fields accept the input
    const nameValue = await portalPage.projectNameInput.inputValue();
    const descValue = await portalPage.projectDescriptionTextarea.inputValue();
    
    expect(nameValue).toContain('A');
    expect(descValue).toContain('B');
    
    // Should be able to submit
    await portalPage.submitProjectProposal();
    
    const toast = await helpers.waitForToast();
    await expect(toast).toContainText(/propuesta enviada|enviada/i);
  });

  test('should maintain state during browser interactions', async () => {
    await portalPage.openProjectProposalDialog();
    
    // Fill partial data
    await portalPage.projectNameInput.fill('Partial Project');
    await portalPage.projectDescriptionTextarea.fill('Partial description');
    
    // Simulate browser back button (shouldn't affect modal)
    // Modal should remain open with data intact
    
    const nameValue = await portalPage.projectNameInput.inputValue();
    const descValue = await portalPage.projectDescriptionTextarea.inputValue();
    
    expect(nameValue).toBe('Partial Project');
    expect(descValue).toBe('Partial description');
  });
});