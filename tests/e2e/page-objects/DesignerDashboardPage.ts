import { Page, Locator } from '@playwright/test';

export class DesignerDashboardPage {
  readonly page: Page;
  readonly proposalsNotificationsCard: Locator;
  readonly proposalsList: Locator;
  readonly newProposalsBadge: Locator;
  
  // Proposal action buttons
  readonly approveButtons: Locator;
  readonly rejectButtons: Locator;
  
  // Dashboard Stats
  readonly totalProjectsKPI: Locator;
  readonly activeProjectsKPI: Locator;
  readonly pendingTasksKPI: Locator;
  readonly completionRateKPI: Locator;
  
  // Quick actions and navigation
  readonly addProjectButton: Locator;
  readonly addTaskButton: Locator;
  readonly addClientButton: Locator;
  readonly viewAnalyticsButton: Locator;
  readonly viewAllTasksButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Proposals section
    this.proposalsNotificationsCard = page.locator('text=/propuestas de clientes/i').locator('..');
    this.proposalsList = page.locator('[data-testid="proposals-list"]').or(
      this.proposalsNotificationsCard.locator('.space-y-4').first()
    );
    this.newProposalsBadge = this.proposalsNotificationsCard.locator('.badge').filter({ hasText: /nuevas/i });
    
    // Proposal action buttons (these will be within individual proposal items)
    this.approveButtons = page.getByRole('button', { name: /aprobar/i });
    this.rejectButtons = page.getByRole('button', { name: /rechazar/i });
    
    // KPI Cards
    this.totalProjectsKPI = page.locator('[data-testid="total-projects-kpi"]').or(
      page.locator('text=/total proyectos/i').locator('..')
    );
    this.activeProjectsKPI = page.locator('[data-testid="active-projects-kpi"]').or(
      page.locator('text=/en progreso/i').locator('..')
    );
    this.pendingTasksKPI = page.locator('[data-testid="pending-tasks-kpi"]').or(
      page.locator('text=/tareas pendientes/i').locator('..')
    );
    this.completionRateKPI = page.locator('[data-testid="completion-rate-kpi"]').or(
      page.locator('text=/tasa de completitud/i').locator('..')
    );
    
    // Quick actions
    this.addProjectButton = page.getByRole('button', { name: /nuevo proyecto/i });
    this.addTaskButton = page.getByRole('button', { name: /nueva tarea/i });
    this.addClientButton = page.getByRole('button', { name: /nuevo cliente/i });
    this.viewAnalyticsButton = page.getByRole('button', { name: /ver analytics/i });
    this.viewAllTasksButton = page.getByRole('button', { name: /ver todas las tareas/i });
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async getProposalsCount() {
    const proposals = this.proposalsList.locator('[data-testid="proposal-item"]').or(
      this.proposalsList.locator('.border.rounded-lg')
    );
    return await proposals.count();
  }

  async getPendingProposalsCount() {
    const badgeText = await this.newProposalsBadge.textContent();
    const match = badgeText?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async approveProposal(index: number = 0) {
    const proposals = this.proposalsList.locator('[data-testid="proposal-item"]').or(
      this.proposalsList.locator('.border.rounded-lg')
    );
    const proposal = proposals.nth(index);
    const approveButton = proposal.getByRole('button', { name: /aprobar/i });
    await approveButton.click();
  }

  async rejectProposal(index: number = 0) {
    const proposals = this.proposalsList.locator('[data-testid="proposal-item"]').or(
      this.proposalsList.locator('.border.rounded-lg')
    );
    const proposal = proposals.nth(index);
    const rejectButton = proposal.getByRole('button', { name: /rechazar/i });
    await rejectButton.click();
  }

  async getProposalDetails(index: number = 0) {
    const proposals = this.proposalsList.locator('[data-testid="proposal-item"]').or(
      this.proposalsList.locator('.border.rounded-lg')
    );
    const proposal = proposals.nth(index);
    
    const title = await proposal.locator('h4, .font-semibold').first().textContent();
    const description = await proposal.locator('p').filter({ hasText: /.{20,}/ }).first().textContent();
    const type = await proposal.locator('.badge, .text-xs').filter({ hasText: /tarea|proyecto/i }).textContent();
    const status = await proposal.locator('[data-testid="status"]').or(
      proposal.locator('.rounded-full')
    ).getAttribute('class');
    
    return {
      title,
      description,
      type,
      status
    };
  }

  async getKPIValue(kpiName: 'total' | 'active' | 'pending' | 'completion') {
    let kpiElement: Locator;
    
    switch (kpiName) {
      case 'total':
        kpiElement = this.totalProjectsKPI;
        break;
      case 'active':
        kpiElement = this.activeProjectsKPI;
        break;
      case 'pending':
        kpiElement = this.pendingTasksKPI;
        break;
      case 'completion':
        kpiElement = this.completionRateKPI;
        break;
    }
    
    const text = await kpiElement.textContent();
    const match = text?.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  async waitForProposalsToLoad() {
    // Wait for either proposals to load or the empty state
    await this.page.waitForFunction(() => {
      const proposalsCard = document.querySelector('text=/propuestas de clientes/i')?.closest('.card') as HTMLElement;
      if (!proposalsCard) return false;
      
      const hasProposals = proposalsCard.querySelectorAll('.border.rounded-lg').length > 0;
      const hasEmptyState = proposalsCard.querySelector('text=/no hay propuestas/i');
      
      return hasProposals || hasEmptyState;
    }, { timeout: 10000 });
  }

  async scrollToProposals() {
    await this.proposalsNotificationsCard.scrollIntoViewIfNeeded();
  }

  async isProposalsPanelVisible() {
    return await this.proposalsNotificationsCard.isVisible();
  }

  async hasProposalWithStatus(status: 'pending' | 'in_review' | 'approved' | 'rejected') {
    const statusColors = {
      pending: 'orange',
      in_review: 'blue', 
      approved: 'green',
      rejected: 'red'
    };
    
    const color = statusColors[status];
    const statusIndicator = this.proposalsList.locator(`.bg-${color}-500`);
    return await statusIndicator.count() > 0;
  }

  async filterProposalsByType(type: 'task' | 'project') {
    const typeText = type === 'task' ? 'Tarea' : 'Proyecto';
    const proposals = this.proposalsList.locator('[data-testid="proposal-item"]').or(
      this.proposalsList.locator('.border.rounded-lg')
    );
    
    const filteredProposals = proposals.filter({ has: this.page.locator(`text="${typeText}"`) });
    return await filteredProposals.count();
  }

  async clickViewAnalytics() {
    await this.viewAnalyticsButton.click();
  }

  async clickViewAllTasks() {
    await this.viewAllTasksButton.click();
  }

  async addNewProject() {
    await this.addProjectButton.click();
  }

  async addNewTask() {
    await this.addTaskButton.click();
  }

  async addNewClient() {
    await this.addClientButton.click();
  }

  async waitForDashboardToLoad() {
    // Wait for the main dashboard content to be visible
    await this.page.waitForSelector('text=/dashboard|panel/i', { timeout: 15000 });
    await this.proposalsNotificationsCard.waitFor({ state: 'visible' });
  }

  async takeScreenshot(name: string) {
    return await this.page.screenshot({ 
      path: `tests/e2e/screenshots/${name}.png`,
      fullPage: true 
    });
  }
}