
import { vi } from 'vitest';

// Create a mock for Supabase client
export const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  not: vi.fn(() => mockSupabase),
  or: vi.fn(() => mockSupabase),
  count: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  limit: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
  rpc: vi.fn(() => mockSupabase),
  auth: {
    getSession: vi.fn()
  },
  functions: {
    invoke: vi.fn()
  }
};

// Create a mock for toast notifications
export const mockToast = {
  info: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn()
};

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock the toast library
vi.mock('sonner', () => ({
  toast: mockToast
}));
