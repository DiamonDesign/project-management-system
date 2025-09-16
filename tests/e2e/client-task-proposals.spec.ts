import { test, expect } from '@playwright/test';
import { ClientProjectDashboardPage } from './page-objects/ClientProjectDashboardPage';
import { TestHelpers, testData } from './utils/test-helpers';

test.describe('Client Task Proposal Flow', () => {
  let dashboardPage: ClientProjectDashboardPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new ClientProjectDashboardPage(page);
    helpers = new TestHelpers(page);
    
    // Navigate to client project dashboard
    await dashboardPage.goto('proj-1');
  });

  test('should display client project dashboard correctly', async () => {
    // Verify page loads with project information
    await expect(dashboardPage.projectTitle).toBeVisible();
    await expect(dashboardPage.projectTitle).toContainText(/rediseño|diseño|proyecto/i);
    
    // Verify progress bar is present
    await expect(dashboardPage.progressBar).toBeVisible();
    
    // Verify designer info is shown
    await expect(dashboardPage.designerInfo).toBeVisible();
    
    // Verify deliverables section
    await expect(dashboardPage.deliverables).toBeVisible();
    
    // Verify quick actions are available
    await expect(dashboardPage.proposeTaskButton).toBeVisible();
    
    // Take screenshot for visual testing
    await helpers.takeTimestampedScreenshot('client-dashboard', 'initial-load');
  });

  test('should open task proposal dialog when clicking "Proponer Nueva Tarea"', async () => {
    // Click the propose task button
    await dashboardPage.openTaskProposalDialog();
    
    // Verify dialog is visible
    await expect(dashboardPage.taskProposalDialog).toBeVisible();
    
    // Verify all form fields are present
    await expect(dashboardPage.taskTitleInput).toBeVisible();
    await expect(dashboardPage.taskDescriptionTextarea).toBeVisible();
    await expect(dashboardPage.taskPrioritySelect).toBeVisible();
    await expect(dashboardPage.taskDueDateInput).toBeVisible();
    
    // Verify action buttons are present
    await expect(dashboardPage.submitTaskProposalButton).toBeVisible();
    await expect(dashboardPage.cancelTaskProposalButton).toBeVisible();
    
    // Take screenshot of the dialog
    await helpers.takeTimestampedScreenshot('task-proposal-dialog', 'opened');
  });

  test('should fill and submit task proposal successfully', async () => {
    // Open the dialog
    await dashboardPage.openTaskProposalDialog();
    
    // Fill the form with test data
    await dashboardPage.fillTaskProposal(testData.task);
    
    // Take screenshot of filled form
    await helpers.takeTimestampedScreenshot('task-proposal-dialog', 'filled');
    
    // Submit the proposal
    await dashboardPage.submitTaskProposal();
    
    // Verify success toast appears
    const toast = await helpers.waitForToast();
    await expect(toast).toContainText(/propuesta enviada|enviada/i);
    
    // Verify dialog closes
    await expect(dashboardPage.taskProposalDialog).not.toBeVisible();
    
    // Take screenshot after successful submission
    await helpers.takeTimestampedScreenshot('task-proposal', 'success');
  });

  test('should reset form after successful submission', async () => {
    // Open dialog and fill form
    await dashboardPage.openTaskProposalDialog();
    await dashboardPage.fillTaskProposal(testData.task);
    
    // Submit and wait for success
    await dashboardPage.submitTaskProposal();
    await helpers.waitForToast();
    
    // Open dialog again
    await dashboardPage.openTaskProposalDialog();
    
    // Verify form is reset
    const isReset = await dashboardPage.isTaskProposalFormReset();
    expect(isReset).toBe(true);
  });

  test('should show validation error for empty required fields', async () => {
    // Open dialog
    await dashboardPage.openTaskProposalDialog();
    
    // Try to submit without filling required fields
    await dashboardPage.submitTaskProposal();
    
    // Verify error toast appears
    const toast = await helpers.waitForToast();
    await expect(toast).toContainText(/error|completa.*campos|requeridos/i);
    
    // Verify dialog remains open
    await expect(dashboardPage.taskProposalDialog).toBeVisible();
    
    // Take screenshot of validation error
    await helpers.takeTimestampedScreenshot('task-proposal', 'validation-error');
  });

  test('should cancel task proposal correctly', async () => {
    // Open dialog and fill some data
    await dashboardPage.openTaskProposalDialog();
    await dashboardPage.taskTitleInput.fill('Test task');
    
    // Cancel the dialog
    await dashboardPage.cancelTaskProposal();
    
    // Verify dialog closes
    await expect(dashboardPage.taskProposalDialog).not.toBeVisible();
    
    // Reopen and verify form is reset
    await dashboardPage.openTaskProposalDialog();
    const isReset = await dashboardPage.isTaskProposalFormReset();
    expect(isReset).toBe(true);
  });

  test('should handle all priority options correctly', async () => {
    await dashboardPage.openTaskProposalDialog();
    
    // Test each priority option
    const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
    
    for (const priority of priorities) {
      await dashboardPage.taskPrioritySelect.selectOption(priority);
      const selectedValue = await dashboardPage.taskPrioritySelect.inputValue();
      expect(selectedValue).toBe(priority);
    }
  });

  test('should handle date input correctly', async () => {
    await dashboardPage.openTaskProposalDialog();
    
    // Set a future date
    const futureDate = '2024-03-15';
    await dashboardPage.taskDueDateInput.fill(futureDate);
    
    const inputValue = await dashboardPage.taskDueDateInput.inputValue();
    expect(inputValue).toBe(futureDate);
  });

  test('should display project progress and stats correctly', async () => {
    // Get project progress
    const progress = await dashboardPage.getProjectProgress();
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
    
    // Verify deliverables are shown
    const deliverablesCount = await dashboardPage.getDeliverablesCount();
    expect(deliverablesCount).toBeGreaterThan(0);
    
    // Verify recent activity is shown
    const activityCount = await dashboardPage.getRecentActivityItems();
    expect(activityCount).toBeGreaterThanOrEqual(0);
  });

  test('should navigate back to projects list', async () => {
    // Click back link
    await dashboardPage.goBackToProjects();
    
    // Verify navigation occurred
    await expect(dashboardPage.page).toHaveURL(/\/client-portal\//);
  });

  test('should display responsive design on mobile', async () => {
    // Set mobile viewport
    await helpers.setMobileViewport();
    
    // Reload page to see mobile layout
    await dashboardPage.page.reload();
    await helpers.waitForPageToLoad();
    
    // Verify key elements are still visible
    await expect(dashboardPage.projectTitle).toBeVisible();
    await expect(dashboardPage.proposeTaskButton).toBeVisible();
    
    // Take mobile screenshot
    await helpers.takeTimestampedScreenshot('client-dashboard', 'mobile-view');
    
    // Test mobile task proposal flow
    await dashboardPage.openTaskProposalDialog();
    await expect(dashboardPage.taskProposalDialog).toBeVisible();
    
    // Take mobile dialog screenshot
    await helpers.takeTimestampedScreenshot('task-proposal-dialog', 'mobile-view');
  });

  test('should handle quick actions buttons', async () => {
    // Test contact designer button
    await expect(dashboardPage.contactDesignerButton).toBeVisible();
    await dashboardPage.contactDesigner();
    
    // Test send comments button
    await expect(dashboardPage.sendCommentsButton).toBeVisible();
    await dashboardPage.sendComments();
    
    // Test download all button (will trigger download)
    await expect(dashboardPage.downloadAllButton).toBeVisible();
    // Note: Actual download testing would require file system checks
    
    // Test view in Figma button
    await expect(dashboardPage.viewInFigmaButton).toBeVisible();
    // Note: Would open new window/tab in real scenario
  });

  test('should maintain dialog state during form interaction', async () => {
    await dashboardPage.openTaskProposalDialog();
    
    // Fill form partially
    await dashboardPage.taskTitleInput.fill('Partial task');
    await dashboardPage.taskDescriptionTextarea.fill('Partial description');
    
    // Click outside dialog (should not close it)
    await dashboardPage.page.click('body');
    
    // Verify dialog is still open and data is preserved
    await expect(dashboardPage.taskProposalDialog).toBeVisible();
    
    const titleValue = await dashboardPage.taskTitleInput.inputValue();
    const descriptionValue = await dashboardPage.taskDescriptionTextarea.inputValue();
    
    expect(titleValue).toBe('Partial task');
    expect(descriptionValue).toBe('Partial description');
  });
});