import { Page, Locator } from '@playwright/test';

export class ClientPortalPage {
  readonly page: Page;
  readonly proposeProjectButton: Locator;
  readonly projectSearchInput: Locator;
  readonly projectCards: Locator;
  readonly viewModeGrid: Locator;
  readonly viewModeList: Locator;
  readonly statusFilterAll: Locator;
  readonly statusFilterActive: Locator;
  readonly statusFilterCompleted: Locator;

  // Project Proposal Dialog Elements
  readonly projectProposalDialog: Locator;
  readonly projectNameInput: Locator;
  readonly projectDescriptionTextarea: Locator;
  readonly projectTypeSelect: Locator;
  readonly projectTimelineInput: Locator;
  readonly projectBudgetInput: Locator;
  readonly submitProjectProposalButton: Locator;
  readonly cancelProjectProposalButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main page elements
    this.proposeProjectButton = page.getByRole('button', { name: /proponer proyecto/i });
    this.projectSearchInput = page.getByPlaceholder(/buscar proyectos/i);
    this.projectCards = page.locator('[data-testid="project-card"]').or(
      page.locator('.grid').locator('.cursor-pointer')
    );
    this.viewModeGrid = page.getByRole('button').filter({ has: page.locator('svg') }).nth(-2);
    this.viewModeList = page.getByRole('button').filter({ has: page.locator('svg') }).last();
    
    // Status filters
    this.statusFilterAll = page.getByRole('button', { name: /todos/i });
    this.statusFilterActive = page.getByRole('button', { name: /activos/i });
    this.statusFilterCompleted = page.getByRole('button', { name: /completados/i });

    // Project Proposal Dialog
    this.projectProposalDialog = page.locator('[role="dialog"]');
    this.projectNameInput = page.locator('#project-name');
    this.projectDescriptionTextarea = page.locator('#project-description');
    this.projectTypeSelect = page.locator('#project-type');
    this.projectTimelineInput = page.locator('#project-timeline');
    this.projectBudgetInput = page.locator('#project-budget');
    this.submitProjectProposalButton = page.getByRole('button', { name: /enviar propuesta/i });
    this.cancelProjectProposalButton = page.getByRole('button', { name: /cancelar/i });
  }

  async goto(clientId: string = 'techcorp') {
    await this.page.goto(`/client-portal/${clientId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async openProjectProposalDialog() {
    await this.proposeProjectButton.click();
    await this.projectProposalDialog.waitFor({ state: 'visible' });
  }

  async fillProjectProposal(proposal: {
    name: string;
    description: string;
    type?: string;
    timeline?: string;
    budget?: string;
  }) {
    await this.projectNameInput.fill(proposal.name);
    await this.projectDescriptionTextarea.fill(proposal.description);
    
    if (proposal.type) {
      await this.projectTypeSelect.selectOption(proposal.type);
    }
    
    if (proposal.timeline) {
      await this.projectTimelineInput.fill(proposal.timeline);
    }
    
    if (proposal.budget) {
      await this.projectBudgetInput.fill(proposal.budget);
    }
  }

  async submitProjectProposal() {
    await this.submitProjectProposalButton.click();
  }

  async cancelProjectProposal() {
    await this.cancelProjectProposalButton.click();
  }

  async searchProjects(query: string) {
    await this.projectSearchInput.fill(query);
    await this.page.waitForTimeout(500); // Wait for search to filter results
  }

  async setStatusFilter(filter: 'all' | 'active' | 'completed') {
    switch (filter) {
      case 'all':
        await this.statusFilterAll.click();
        break;
      case 'active':
        await this.statusFilterActive.click();
        break;
      case 'completed':
        await this.statusFilterCompleted.click();
        break;
    }
  }

  async setViewMode(mode: 'grid' | 'list') {
    if (mode === 'grid') {
      await this.viewModeGrid.click();
    } else {
      await this.viewModeList.click();
    }
  }

  async getProjectCount() {
    return await this.projectCards.count();
  }

  async clickProjectByIndex(index: number) {
    const projectCard = this.projectCards.nth(index);
    const viewButton = projectCard.getByRole('button', { name: /ver proyecto/i });
    await viewButton.click();
  }

  async waitForToastMessage(message?: string) {
    const toast = this.page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible' });
    
    if (message) {
      await this.page.waitForSelector(`text="${message}"`, { timeout: 5000 });
    }
    
    return toast;
  }

  async isProjectProposalDialogOpen() {
    return await this.projectProposalDialog.isVisible();
  }

  async isProjectProposalFormReset() {
    const nameValue = await this.projectNameInput.inputValue();
    const descriptionValue = await this.projectDescriptionTextarea.inputValue();
    
    return nameValue === '' && descriptionValue === '';
  }
}