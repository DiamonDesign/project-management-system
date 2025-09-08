import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SessionContextProvider } from '@/context/SessionContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { ClientProvider } from '@/context/ClientContext';
import { User } from '@/types';

// Test data factories
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  created_at: '2024-01-01T00:00:00Z',
  role: 'user',
  ...overrides,
});

export const createMockProject = (overrides: Record<string, unknown> = {}) => ({
  id: 'test-project-id',
  user_id: 'test-user-id',
  name: 'Test Project',
  description: 'Test project description',
  status: 'pending' as const,
  notes: [],
  tasks: [],
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockTask = (overrides: Record<string, unknown> = {}) => ({
  id: 'test-task-id',
  title: 'Test Task',
  description: 'Test task description',
  status: 'not-started' as const,
  project_id: 'test-project-id',
  is_daily_task: false,
  priority: 'medium' as const,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockClient = (overrides: Record<string, unknown> = {}) => ({
  id: 'test-client-id',
  user_id: 'test-user-id',
  name: 'Test Client',
  email: 'client@example.com',
  projects: [],
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Test providers wrapper
interface TestProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  user?: User | null;
  initialRoute?: string;
}

export const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  queryClient,
  user = createMockUser(),
  initialRoute = '/',
}) => {
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={testQueryClient}>
        <TooltipProvider>
          <SessionContextProvider>
            <ProjectProvider>
              <ClientProvider>
                {children}
              </ClientProvider>
            </ProjectProvider>
          </SessionContextProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  user?: User | null;
  initialRoute?: string;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient, user, initialRoute, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestProviders 
      queryClient={queryClient} 
      user={user} 
      initialRoute={initialRoute}
    >
      {children}
    </TestProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Wait utilities
export const waitForLoadingToFinish = async () => {
  const { findByTestId } = await import('@testing-library/react');
  try {
    // Wait for any loading spinners to disappear
    await findByTestId(document.body, 'loading-spinner', { timeout: 100 });
  } catch {
    // Loading spinner not found, which means loading is finished
  }
};

// Form test utilities
export const fillForm = async (
  getByLabelText: (text: string) => HTMLElement,
  fields: Record<string, string>
) => {
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  
  for (const [label, value] of Object.entries(fields)) {
    const field = getByLabelText(label);
    await user.clear(field);
    await user.type(field, value);
  }
};

// Mock handlers for MSW
export const mockHandlers = [
  // Add MSW handlers here when needed
];

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

// Accessibility testing utilities
export const checkAccessibility = async (container: HTMLElement) => {
  // Basic accessibility checks without external library
  const images = container.querySelectorAll('img');
  const buttons = container.querySelectorAll('button');
  const inputs = container.querySelectorAll('input');
  
  // Check for alt text on images
  images.forEach((img) => {
    expect(img.getAttribute('alt')).not.toBeNull();
  });
  
  // Check for accessible names on buttons
  buttons.forEach((button) => {
    const hasText = button.textContent?.trim();
    const hasAriaLabel = button.getAttribute('aria-label');
    const hasAriaLabelledBy = button.getAttribute('aria-labelledby');
    
    expect(hasText || hasAriaLabel || hasAriaLabelledBy).toBeTruthy();
  });
  
  // Check for labels on inputs
  inputs.forEach((input) => {
    const hasLabel = !!input.getAttribute('aria-label') || 
                    !!input.getAttribute('aria-labelledby') ||
                    !!container.querySelector(`label[for="${input.id}"]`);
    
    expect(hasLabel).toBeTruthy();
  });
};

// Custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAccessibleName(name: string): R;
      toHaveErrorMessage(message: string): R;
    }
  }
}

// Error boundary testing
export const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Local storage mock
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Session storage mock
export const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Network mocking utilities
export const mockFetch = (response: unknown, options: { status?: number; ok?: boolean } = {}) => {
  const { status = 200, ok = true } = options;
  
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(response),
    text: vi.fn().mockResolvedValue(JSON.stringify(response)),
  });
};

// Cleanup utilities
export const cleanup = () => {
  vi.clearAllMocks();
  mockLocalStorage.clear();
  mockSessionStorage.clear();
};

// File upload testing utilities
export const createMockFile = (name: string = 'test.txt', type: string = 'text/plain') => {
  return new File(['test content'], name, { type });
};

export const createMockImageFile = (name: string = 'test.jpg') => {
  return new File([''], name, { type: 'image/jpeg' });
};

// Date mocking utilities
export const mockDate = (isoDate: string) => {
  const mockDate = new Date(isoDate);
  vi.spyOn(global, 'Date').mockImplementation(() => mockDate);
  return mockDate;
};

export const restoreDate = () => {
  vi.restoreAllMocks();
};

import { vi } from 'vitest';