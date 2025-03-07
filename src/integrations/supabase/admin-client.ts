// Re-export the admin client from the main client
import { supabase } from './client';

// Export the admin client
export const supabaseAdminClient = supabase.admin;

// Export a function to check if admin access is available
export const hasAdminAccess = () => supabase.hasAdminAccess();

// Export default for convenience
export default supabaseAdminClient; 