import { Page, Locator } from '@playwright/test';

export class ClientProjectDashboardPage {
  readonly page: Page;
  readonly proposeTaskButton: Locator;
  readonly contactDesignerButton: Locator;
  readonly sendCommentsButton: Locator;
  readonly downloadAllButton: Locator;
  readonly viewInFigmaButton: Locator;
  
  // Task Proposal Dialog Elements
  readonly taskProposalDialog: Locator;
  readonly taskTitleInput: Locator;
  readonly taskDescriptionTextarea: Locator;
  readonly taskPrioritySelect: Locator;
  readonly taskDueDateInput: Locator;
  readonly submitTaskProposalButton: Locator;
  readonly cancelTaskProposalButton: Locator;

  // Project Information Elements
  readonly projectTitle: Locator;
  readonly projectDescription: Locator;
  readonly projectStatus: Locator;
  readonly projectProgress: Locator;
  readonly progressBar: Locator;
  readonly designerInfo: Locator;
  readonly deliverables: Locator;
  readonly recentActivity: Locator;
  readonly backToProjectsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Quick Actions buttons
    this.proposeTaskButton = page.getByRole('button', { name: /proponer nueva tarea/i });
    this.contactDesignerButton = page.getByRole('button', { name: /contactar/i });
    this.sendCommentsButton = page.getByRole('button', { name: /enviar comentarios/i });
    this.downloadAllButton = page.getByRole('button', { name: /descargar todo/i });
    this.viewInFigmaButton = page.getByRole('button', { name: /ver en figma/i });

    // Task Proposal Dialog
    this.taskProposalDialog = page.locator('[role="dialog"]');
    this.taskTitleInput = page.locator('#task-title');
    this.taskDescriptionTextarea = page.locator('#task-description');
    this.taskPrioritySelect = page.locator('#task-priority');
    this.taskDueDateInput = page.locator('#task-due-date');
    this.submitTaskProposalButton = page.getByRole('button', { name: /enviar propuesta/i });
    this.cancelTaskProposalButton = page.getByRole('button', { name: /cancelar/i });

    // Project Information
    this.projectTitle = page.locator('h1');
    this.projectDescription = page.locator('h1').locator('..').locator('p').first();
    this.projectStatus = page.locator('[data-testid="project-status"]').or(
      page.locator('text=/en progreso|completado|pendiente/i').first()
    );
    this.projectProgress = page.locator('text=/progreso:/i').locator('..');
    this.progressBar = page.locator('[role="progressbar"]');
    this.designerInfo = page.locator('text=/tu diseñadora/i').locator('..');
    this.deliverables = page.locator('text=/entregables del proyecto/i').locator('..');
    this.recentActivity = page.locator('text=/actividad reciente/i').locator('..');
    this.backToProjectsLink = page.getByRole('link', { name: /volver a todos los proyectos/i });
  }

  async goto(projectId: string = 'proj-1') {
    await this.page.goto(`/client-portal/dashboard/${projectId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async openTaskProposalDialog() {
    await this.proposeTaskButton.click();
    await this.taskProposalDialog.waitFor({ state: 'visible' });
  }

  async fillTaskProposal(task: {
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
  }) {
    await this.taskTitleInput.fill(task.title);
    await this.taskDescriptionTextarea.fill(task.description);
    
    if (task.priority) {
      await this.taskPrioritySelect.selectOption(task.priority);
    }
    
    if (task.dueDate) {
      await this.taskDueDateInput.fill(task.dueDate);
    }
  }

  async submitTaskProposal() {
    await this.submitTaskProposalButton.click();
  }

  async cancelTaskProposal() {
    await this.cancelTaskProposalButton.click();
  }

  async getProjectTitle() {
    return await this.projectTitle.textContent();
  }

  async getProjectProgress() {
    const progressText = await this.projectProgress.textContent();
    const match = progressText?.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  }

  async getDeliverablesCount() {
    const deliverableItems = this.deliverables.locator('[data-testid="deliverable-item"]').or(
      this.deliverables.locator('.border.rounded-lg')
    );
    return await deliverableItems.count();
  }

  async downloadFile(fileName: string) {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.getByText(fileName).locator('..').getByRole('button').first().click();
    return await downloadPromise;
  }

  async previewFile(fileName: string) {
    await this.page.getByText(fileName).locator('..').getByRole('button').first().click();
  }

  async goBackToProjects() {
    await this.backToProjectsLink.click();
  }

  async waitForToastMessage(message?: string) {
    const toast = this.page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible' });
    
    if (message) {
      await this.page.waitForSelector(`text="${message}"`, { timeout: 5000 });
    }
    
    return toast;
  }

  async isTaskProposalDialogOpen() {
    return await this.taskProposalDialog.isVisible();
  }

  async isTaskProposalFormReset() {
    const titleValue = await this.taskTitleInput.inputValue();
    const descriptionValue = await this.taskDescriptionTextarea.inputValue();
    const priorityValue = await this.taskPrioritySelect.inputValue();
    const dueDateValue = await this.taskDueDateInput.inputValue();
    
    return titleValue === '' && 
           descriptionValue === '' && 
           priorityValue === 'medium' && 
           dueDateValue === '';
  }

  async getRecentActivityItems() {
    const activityItems = this.recentActivity.locator('[data-testid="activity-item"]').or(
      this.recentActivity.locator('.flex.gap-3')
    );
    return await activityItems.count();
  }

  async contactDesigner() {
    await this.contactDesignerButton.click();
  }

  async sendComments() {
    await this.sendCommentsButton.click();
  }

  async downloadAll() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.downloadAllButton.click();
    return await downloadPromise;
  }

  async viewInFigma() {
    // This would typically open a new tab/window
    const popupPromise = this.page.waitForEvent('popup');
    await this.viewInFigmaButton.click();
    return await popupPromise;
  }
}