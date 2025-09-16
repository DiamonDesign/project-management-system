import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'mock-url' } }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  },
}));

// Mock window.crypto for security utilities
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      digest: vi.fn(),
    },
  },
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock DOMPurify with actual sanitization behavior for tests
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((input: string, config?: { ALLOWED_TAGS?: string[]; ALLOWED_ATTR?: string[] }) => {
      if (!input || typeof input !== 'string') return '';
      
      // Simple mock sanitization - remove script tags and dangerous attributes
      let sanitized = input
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/onclick\s*=\s*["'][^"']*["']/gi, '')
        .replace(/onload\s*=\s*["'][^"']*["']/gi, '')
        .replace(/onerror\s*=\s*["'][^"']*["']/gi, '');
      
      // If config specifies no tags allowed, strip all HTML
      if (config && config.ALLOWED_TAGS && config.ALLOWED_TAGS.length === 0) {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
      }
      
      return sanitized;
    }),
  },
}));

// Mock validator library
vi.mock('validator', () => ({
  default: {
    escape: vi.fn((input: string) => input.replace(/[<>"'&]/g, (char) => {
      const entityMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entityMap[char] || char;
    })),
    isEmail: vi.fn((email: string) => {
      // More comprehensive email validation that matches validator.js behavior
      if (!email || typeof email !== 'string' || email.length > 254) return false;
      
      // Reject emails with consecutive dots
      if (email.includes('..')) return false;
      
      // Must have @ symbol
      const atIndex = email.indexOf('@');
      if (atIndex === -1 || atIndex === 0 || atIndex === email.length - 1) return false;
      
      // Basic format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }),
    isURL: vi.fn((url: string, options: { protocols: string[] }) => {
      try {
        const parsed = new URL(url);
        return options.protocols.includes(parsed.protocol.slice(0, -1));
      } catch {
        return false;
      }
    }),
    isUUID: vi.fn((uuid: string, version: number = 4) => {
      // More flexible UUID regex that accepts any valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(uuid);
    }),
  },
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
    }),
    useParams: () => ({}),
  };
});

// Mock React Query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })),
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: false,
      error: null,
      data: null,
    })),
  };
});

// Console warnings suppression for tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});