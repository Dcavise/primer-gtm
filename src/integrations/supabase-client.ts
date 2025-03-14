/**
 * Mock Supabase Client
 * 
 * This file replaces the real Supabase client implementation with a mock version 
 * that returns default values. This allows UI development to continue without 
 * relying on Supabase backend services.
 * 
 * TODO: Implement a proper data access layer that can be used to replace Supabase
 */

import { logger } from "@/utils/logger";

// Family search result interface with standardized IDs
export interface FamilySearchResult {
  standard_id: string;
  family_id: string;
  alternate_id: string | null;
  family_name: string;
  current_campus_c: string;
  current_campus_name: string;
  contact_count: number;
  opportunity_count: number;
  opportunity_is_won_flags?: boolean[];
  opportunity_school_years?: string[];
  opportunity_campuses?: string[];
  opportunity_stages?: string[];
}

// Generic response type for operations
export interface OperationResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Mock Supabase client that returns empty/mock data
 * for all operations.
 * 
 * TODO: Replace with actual implementation that doesn't use Supabase
 */
export class SupabaseUnifiedClient {
  constructor() {
    logger.info("Mock Supabase client initialized");
  }

  /**
   * Mock RPC method
   */
  public rpc<T = unknown>(fn: string, params?: Record<string, unknown>) {
    logger.debug(`Mock RPC call to ${fn} with params:`, params);
    return Promise.resolve({ data: null, error: null });
  }

  /**
   * Mock from method
   */
  public from(table: string) {
    return {
      select: () => ({
        limit: () => Promise.resolve({ data: [], error: null }),
        eq: () => Promise.resolve({ data: [], error: null }),
        in: () => Promise.resolve({ data: [], error: null }),
        match: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    };
  }

  /**
   * Mock auth property
   */
  public get auth() {
    return {
      signIn: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      user: null,
    };
  }

  /**
   * Mock functions property
   */
  public get functions() {
    return {
      invoke: () => Promise.resolve({ data: null, error: null }),
    };
  }

  /**
   * Mock admin client
   */
  public admin = null;

  /**
   * Mock hasAdminAccess method
   */
  public hasAdminAccess(): boolean {
    return false;
  }

  /**
   * Mock executeRPC method
   */
  public async executeRPC<T = unknown>(
    functionName: string,
    params: Record<string, unknown> = {},
    schema?: string
  ): Promise<OperationResponse<T>> {
    logger.debug(`Mock executeRPC call to ${functionName} with params:`, params);
    return { success: true, data: null, error: null };
  }

  /**
   * Mock searchFamilies method
   */
  public async searchFamilies(
    searchTerm: string
  ): Promise<OperationResponse<FamilySearchResult[]>> {
    logger.info(`Mock searching for families with term: ${searchTerm}`);
    
    // Return mock family data
    const mockFamilies: FamilySearchResult[] = [
      {
        standard_id: "mock-id-1",
        family_id: "mock-id-1",
        alternate_id: "alt-id-1",
        family_name: "Smith Family",
        current_campus_c: "campus-1",
        current_campus_name: "Atlanta",
        contact_count: 2,
        opportunity_count: 1,
        opportunity_is_won_flags: [true],
        opportunity_school_years: ["25/26"],
        opportunity_campuses: ["Atlanta"],
        opportunity_stages: ["Closed Won"]
      },
      {
        standard_id: "mock-id-2",
        family_id: "mock-id-2",
        alternate_id: "alt-id-2",
        family_name: "Johnson Family",
        current_campus_c: "campus-2",
        current_campus_name: "New York",
        contact_count: 3,
        opportunity_count: 2,
        opportunity_is_won_flags: [false, true],
        opportunity_school_years: ["24/25", "25/26"],
        opportunity_campuses: ["New York", "New York"],
        opportunity_stages: ["Family Interview", "Closed Won"]
      }
    ];
    
    // Filter mock data based on search term
    const filteredFamilies = mockFamilies.filter(family => 
      family.family_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      family.current_campus_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return { success: true, data: filteredFamilies, error: null };
  }

  /**
   * Mock getFamilyRecord method
   */
  public async getFamilyRecord(
    familyId: string
  ): Promise<OperationResponse<Record<string, unknown>>> {
    logger.debug(`Mock fetching family record for ID: ${familyId}`);
    
    // Return mock family record
    const mockFamilyRecord = {
      family_id: familyId,
      family_name: "Mock Family",
      current_campus_name: "Atlanta",
      contact_count: 2,
      opportunity_count: 1,
      student_count: 1,
      students: [
        {
          id: "student-1",
          first_name: "Jane",
          last_name: "Mock",
          full_name: "Jane Mock",
          opportunities: [
            {
              id: "opp-1",
              name: "25/26 Enrollment",
              stage: "Closed Won",
              school_year: "25/26",
              is_won: true,
              campus_name: "Atlanta"
            }
          ]
        }
      ],
      contacts: [
        {
          id: "contact-1",
          first_name: "John",
          last_name: "Mock",
          email: "john@example.com",
          phone: "555-1234"
        },
        {
          id: "contact-2",
          first_name: "Mary",
          last_name: "Mock",
          email: "mary@example.com",
          phone: "555-5678"
        }
      ]
    };
    
    return { success: true, data: mockFamilyRecord, error: null };
  }

  /**
   * Mock getAllFamilies method
   */
  public async getAllFamilies(): Promise<OperationResponse<FamilySearchResult[]>> {
    logger.debug("Mock fetching all family records");
    
    // Return mock family data
    const mockFamilies: FamilySearchResult[] = [
      {
        standard_id: "mock-id-1",
        family_id: "mock-id-1",
        alternate_id: "alt-id-1",
        family_name: "Smith Family",
        current_campus_c: "campus-1",
        current_campus_name: "Atlanta",
        contact_count: 2,
        opportunity_count: 1,
        opportunity_is_won_flags: [true],
        opportunity_school_years: ["25/26"],
        opportunity_campuses: ["Atlanta"],
        opportunity_stages: ["Closed Won"]
      },
      {
        standard_id: "mock-id-2",
        family_id: "mock-id-2",
        alternate_id: "alt-id-2",
        family_name: "Johnson Family",
        current_campus_c: "campus-2",
        current_campus_name: "New York",
        contact_count: 3,
        opportunity_count: 2,
        opportunity_is_won_flags: [false, true],
        opportunity_school_years: ["24/25", "25/26"],
        opportunity_campuses: ["New York", "New York"],
        opportunity_stages: ["Family Interview", "Closed Won"]
      }
    ];
    
    return { success: true, data: mockFamilies, error: null };
  }

  /**
   * Mock testConnection method
   */
  public async testConnection() {
    return {
      success: true,
      publicSchema: true,
      fivetranViewsSchema: true,
    };
  }
}

// Export a singleton instance
export const supabase = new SupabaseUnifiedClient();

// Export the admin client directly for convenience (null in this mock)
export const supabaseAdminClient = null;

// Export a function to check if admin access is available
export const hasAdminAccess = () => false;

/**
 * Mock getEnhancedFamilyRecord function
 */
export async function getEnhancedFamilyRecord(
  familyId: string
): Promise<OperationResponse<Record<string, unknown>>> {
  logger.debug(`Mock fetching enhanced family record for ID: ${familyId}`);
  
  // Return mock enhanced family record
  const mockEnhancedFamilyRecord = {
    family_id: familyId,
    family_name: "Mock Enhanced Family",
    pdc_family_id_c: "pdc-" + familyId,
    current_campus_c: "campus-id",
    current_campus_name: "Atlanta",
    
    // Structured student data
    students: [
      {
        id: "student-1",
        first_name: "Jane",
        last_name: "Mock",
        full_name: "Jane Mock",
        opportunities: [
          {
            id: "opp-1",
            name: "25/26 Enrollment",
            stage: "Closed Won",
            school_year: "25/26",
            is_won: true,
            created_date: new Date().toISOString(),
            record_type_id: "rt-1",
            campus: "campus-id",
            campus_name: "Atlanta"
          }
        ]
      },
      {
        id: "student-2",
        first_name: "James",
        last_name: "Mock",
        full_name: "James Mock",
        opportunities: [
          {
            id: "opp-2",
            name: "25/26 Enrollment",
            stage: "Family Interview",
            school_year: "25/26",
            is_won: false,
            created_date: new Date().toISOString(),
            record_type_id: "rt-1",
            campus: "campus-id",
            campus_name: "Atlanta"
          }
        ]
      }
    ],
    
    // Structured contact data
    contacts: [
      {
        id: "contact-1",
        first_name: "John",
        last_name: "Mock",
        email: "john@example.com",
        phone: "555-1234",
        last_activity_date: new Date().toISOString()
      },
      {
        id: "contact-2",
        first_name: "Mary",
        last_name: "Mock",
        email: "mary@example.com",
        phone: "555-5678",
        last_activity_date: new Date().toISOString()
      }
    ],
    
    // Count fields
    contact_count: 2,
    opportunity_count: 2,
    student_count: 2
  };
  
  return { success: true, data: mockEnhancedFamilyRecord, error: null };
}
