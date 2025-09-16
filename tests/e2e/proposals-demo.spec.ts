import { test, expect } from '@playwright/test';

test.describe('VisionDay - Proposals System Demo', () => {
  test('should display client portal dashboard with task proposal button', async ({ page }) => {
    // Navigate to the client portal dashboard
    await page.goto('http://localhost:8080/client-portal/dashboard/proj-1');
    
    // Wait for the page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Verify the page title
    await expect(page.locator('h1')).toContainText('Rediseño de Aplicación Móvil');
    
    // Look for the "Proponer Nueva Tarea" button
    const taskProposalButton = page.getByText('Proponer Nueva Tarea');
    await expect(taskProposalButton).toBeVisible();
    
    // Take a screenshot of the dashboard
    await page.screenshot({ 
      path: 'tests/screenshots/client-dashboard.png',
      fullPage: true 
    });
    
    console.log('✅ Client dashboard loaded successfully with task proposal button');
  });

  test('should open task proposal modal and display form', async ({ page }) => {
    // Navigate to the client portal dashboard
    await page.goto('http://localhost:8080/client-portal/dashboard/proj-1');
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Click the "Proponer Nueva Tarea" button
    const taskProposalButton = page.getByText('Proponer Nueva Tarea');
    await taskProposalButton.click();
    
    // Wait for the modal to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Verify the modal title
    await expect(page.getByText('Proponer Nueva Tarea')).toBeVisible();
    
    // Verify form fields are present
    await expect(page.locator('#task-title')).toBeVisible();
    await expect(page.locator('#task-description')).toBeVisible();
    await expect(page.locator('#task-priority')).toBeVisible();
    await expect(page.locator('#task-due-date')).toBeVisible();
    
    // Take a screenshot of the modal
    await page.screenshot({ 
      path: 'tests/screenshots/task-proposal-modal.png',
      fullPage: true 
    });
    
    console.log('✅ Task proposal modal opened successfully with all form fields');
  });

  test('should display client portal index with project proposal button', async ({ page }) => {
    // Navigate to the client portal index
    await page.goto('http://localhost:8080/client-portal/techcorp');
    
    // Wait for the page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Verify the page content
    await expect(page.locator('h1')).toContainText('Portal de Cliente');
    
    // Look for the "Proponer Proyecto" button
    const projectProposalButton = page.getByText('Proponer Proyecto');
    await expect(projectProposalButton).toBeVisible();
    
    // Take a screenshot of the client portal index
    await page.screenshot({ 
      path: 'tests/screenshots/client-portal-index.png',
      fullPage: true 
    });
    
    console.log('✅ Client portal index loaded successfully with project proposal button');
  });

  test('should display designer dashboard with proposals notifications', async ({ page }) => {
    // Navigate to the designer dashboard
    await page.goto('http://localhost:8080/dashboard');
    
    // Wait for the page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Verify we're on the dashboard
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Look for the proposals notifications component
    const proposalsSection = page.getByText('Propuestas de Clientes');
    await expect(proposalsSection).toBeVisible();
    
    // Check for mock proposals
    await expect(page.getByText('Rediseño del botón de login')).toBeVisible();
    await expect(page.getByText('Rediseño completo de dashboard analytics')).toBeVisible();
    
    // Take a screenshot of the designer dashboard
    await page.screenshot({ 
      path: 'tests/screenshots/designer-dashboard.png',
      fullPage: true 
    });
    
    console.log('✅ Designer dashboard loaded successfully with proposals notifications');
  });

  test('should submit a task proposal successfully', async ({ page }) => {
    // Navigate to the client portal dashboard
    await page.goto('http://localhost:8080/client-portal/dashboard/proj-1');
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Click the "Proponer Nueva Tarea" button
    const taskProposalButton = page.getByText('Proponer Nueva Tarea');
    await taskProposalButton.click();
    
    // Wait for the modal to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Fill out the form
    await page.fill('#task-title', 'Mejorar accesibilidad del formulario');
    await page.fill('#task-description', 'Necesitamos mejorar la accesibilidad del formulario de login para cumplir con las normas WCAG 2.1');
    await page.selectOption('#task-priority', 'high');
    await page.fill('#task-due-date', '2024-02-15');
    
    // Take a screenshot of the filled form
    await page.screenshot({ 
      path: 'tests/screenshots/task-proposal-filled.png',
      fullPage: true 
    });
    
    // Submit the form
    await page.getByText('Enviar Propuesta').click();
    
    // Wait for and verify the success toast
    await expect(page.getByText('Propuesta enviada')).toBeVisible({ timeout: 5000 });
    
    // Verify the modal has closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    console.log('✅ Task proposal submitted successfully with toast notification');
  });
});