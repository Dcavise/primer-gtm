
import { vi } from 'vitest';

// Create a mock for the Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  rpc: vi.fn().mockReturnThis(),
  functions: {
    invoke: vi.fn()
  }
};

// Mock the toast function
const mockToast = {
  error: vi.fn(),
  success: vi.fn()
};

// Export mocks
export { mockSupabase, mockToast };

// Mock the modules
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

vi.mock('sonner', () => ({
  toast: mockToast
}));
