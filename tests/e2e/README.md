# E2E Tests for Client Proposal System

Comprehensive Playwright E2E tests for the client proposal system, covering task proposals, project proposals, designer approval workflows, visual regression, accessibility, and mobile responsiveness.

## Test Structure

### Page Object Models (`page-objects/`)
- `ClientPortalPage.ts` - Client portal main page interactions
- `ClientProjectDashboardPage.ts` - Individual project dashboard for clients  
- `DesignerDashboardPage.ts` - Designer dashboard with proposals section

### Test Suites

#### Core Functionality Tests
- `client-task-proposals.spec.ts` - Task proposal flow from client project dashboard
- `client-project-proposals.spec.ts` - Project proposal flow from client portal
- `designer-approval-workflow.spec.ts` - Designer reviewing and approving/rejecting proposals

#### Quality Assurance Tests
- `visual-regression.spec.ts` - Screenshot-based visual testing
- `accessibility.spec.ts` - WCAG compliance and accessibility testing
- `mobile-responsiveness.spec.ts` - Mobile and tablet responsive design testing

### Utilities (`utils/`)
- `test-helpers.ts` - Common testing utilities and helpers

## Running Tests

### Prerequisites
```bash
# Install dependencies
pnpm install

# Start development server (tests expect app on localhost:8080)
pnpm dev
```

### Run All Tests
```bash
# Run all E2E tests
npx playwright test tests/e2e

# Run with UI mode for debugging
npx playwright test tests/e2e --ui

# Run specific test file
npx playwright test tests/e2e/client-task-proposals.spec.ts
```

### Run Tests by Category
```bash
# Core functionality only
npx playwright test tests/e2e/client-task-proposals.spec.ts tests/e2e/client-project-proposals.spec.ts tests/e2e/designer-approval-workflow.spec.ts

# Visual testing only
npx playwright test tests/e2e/visual-regression.spec.ts

# Accessibility testing only
npx playwright test tests/e2e/accessibility.spec.ts

# Mobile testing only
npx playwright test tests/e2e/mobile-responsiveness.spec.ts
```

### Run Tests on Specific Browsers
```bash
# Chrome only
npx playwright test tests/e2e --project=chromium

# Firefox only
npx playwright test tests/e2e --project=firefox

# Safari only
npx playwright test tests/e2e --project=webkit

# Mobile Chrome
npx playwright test tests/e2e --project="Mobile Chrome"

# Mobile Safari
npx playwright test tests/e2e --project="Mobile Safari"
```

### Debugging and Development
```bash
# Run in headed mode (see browser)
npx playwright test tests/e2e --headed

# Debug mode (step through tests)
npx playwright test tests/e2e --debug

# Run specific test with debug
npx playwright test tests/e2e/client-task-proposals.spec.ts -g "should fill and submit task proposal successfully" --debug

# Generate test code (record interactions)
npx playwright codegen localhost:8080
```

### Reports and Screenshots
```bash
# Generate HTML report
npx playwright show-report

# View test results
npx playwright show-report test-results/

# Update visual regression screenshots
npx playwright test tests/e2e/visual-regression.spec.ts --update-snapshots
```

## Test Coverage

### Client Task Proposal Flow
- ✅ Navigate to project dashboard `/client-portal/dashboard/:projectId`
- ✅ Click "Proponer Nueva Tarea" button
- ✅ Fill form: title, description, priority, due date
- ✅ Submit and verify toast notification
- ✅ Verify form resets after submission
- ✅ Validation error handling
- ✅ Cancel functionality
- ✅ Mobile responsiveness

### Client Project Proposal Flow
- ✅ Navigate to client portal `/client-portal/:clientId`
- ✅ Click "Proponer Proyecto" button
- ✅ Fill form: name, description, type, budget, timeline
- ✅ Submit and verify toast notification
- ✅ Verify form resets after submission
- ✅ Search and filter functionality
- ✅ Grid/list view modes
- ✅ Mobile responsiveness

### Designer Approval Workflow
- ✅ Navigate to designer dashboard `/dashboard`
- ✅ Verify ProposalsNotifications component displays mock proposals
- ✅ Test approve/reject button functionality
- ✅ Verify proposal status badges and information
- ✅ Mobile responsiveness for proposal management

### Visual Testing
- ✅ Screenshot all major page states
- ✅ Form dialogs (empty and filled)
- ✅ Mobile, tablet, and desktop layouts
- ✅ Hover and focus states
- ✅ Loading and error states
- ✅ Success notifications

### Accessibility Testing
- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ ARIA attributes and labels
- ✅ Focus management in modals
- ✅ Color contrast and visual indicators
- ✅ Form validation announcements

### Mobile Responsiveness
- ✅ Portrait and landscape orientations
- ✅ Multiple device sizes (320px to 1024px+)
- ✅ Touch target sizing
- ✅ Virtual keyboard handling
- ✅ Orientation change handling
- ✅ Touch interactions

## Test Data

Mock data is used throughout tests to ensure consistent behavior:

### Task Proposals
```typescript
{
  title: 'Mejorar accesibilidad del formulario de login',
  description: 'El formulario actual no cumple con estándares WCAG 2.1...',
  priority: 'high',
  dueDate: '2024-02-15'
}
```

### Project Proposals
```typescript
{
  name: 'Rediseño del sistema de notificaciones',
  description: 'Necesitamos un sistema de notificaciones más moderno...',
  type: 'ux',
  timeline: '2-3 meses',
  budget: '€15,000 - €20,000'
}
```

## Configuration

Tests are configured to:
- Run against `http://localhost:8080` (Vite dev server)
- Support multiple browsers (Chrome, Firefox, Safari)
- Include mobile device emulation
- Generate HTML reports and screenshots
- Retry failed tests 2x on CI
- Capture traces and videos on failure

## Troubleshooting

### Common Issues

**Tests failing with "Element not found":**
- Ensure development server is running on port 8080
- Check if component selectors have changed
- Verify mock data is loading correctly

**Visual regression test failures:**
- Run `--update-snapshots` to update reference images
- Check if UI changes are intentional
- Verify tests run on same OS (screenshots are OS-specific)

**Mobile test failures:**
- Ensure touch targets meet minimum size requirements
- Check viewport meta tag is configured
- Verify responsive CSS is working correctly

**Accessibility test failures:**
- Add missing ARIA labels and roles
- Ensure proper heading hierarchy
- Check color contrast ratios
- Verify keyboard navigation works

### Debug Steps
1. Run single test in headed mode: `--headed`
2. Use debug mode to step through: `--debug`
3. Check browser console for errors
4. Verify network requests complete successfully
5. Take manual screenshots at failure points

## CI Integration

For CI/CD pipelines:

```yaml
- name: Install Playwright
  run: npx playwright install

- name: Run E2E tests
  run: npx playwright test tests/e2e
  
- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Future Enhancements

- [ ] Add performance testing with Lighthouse
- [ ] Integrate axe-core for comprehensive accessibility testing
- [ ] Add cross-browser visual regression testing
- [ ] Implement API mocking for edge cases
- [ ] Add database state management for isolated tests