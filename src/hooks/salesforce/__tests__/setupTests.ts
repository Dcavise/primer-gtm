
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
  functions: {
    invoke: vi.fn()
  }
};

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));
