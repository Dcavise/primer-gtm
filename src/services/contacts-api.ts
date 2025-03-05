
import { supabase } from "@/integrations/supabase/client";

export interface HunterContact {
  id: number;
  value: string;
  type: "personal" | "generic";
  confidence: number;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  department: string | null;
  linkedin: string | null;
  twitter: string | null;
  phone_number: string | null;
  company: string | null;
  sources: {
    domain: string;
    uri: string;
    extracted_on: string;
    last_seen_on: string;
    still_on_page: boolean;
  }[];
}

export interface HunterDomainResponse {
  domain: string;
  disposition: string;
  organization: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  postal_code: string | null;
  emails: HunterContact[];
  pattern: string | null;
  webmail: boolean;
}

export type ContactsSearchParams = {
  domain: string;
  limit?: number;
  department?: string;
  seniority?: string;
  type?: "personal" | "generic" | "any";
};

export async function searchContactsByDomain(params: ContactsSearchParams): Promise<HunterDomainResponse | null> {
  try {
    const { domain, limit } = params;
    // Clean up params - if department, seniority or type is 'any', remove it
    const department = params.department === 'any' ? undefined : params.department;
    const seniority = params.seniority === 'any' ? undefined : params.seniority;
    const type = params.type === 'any' ? undefined : params.type as "personal" | "generic" | undefined;
    
    console.log('Calling domain-search edge function with params:', { domain, limit, department, seniority, type });
    
    const { data, error } = await supabase.functions.invoke('domain-search', {
      body: { domain, limit, department, seniority, type }
    });

    if (error) {
      console.error('Error calling domain-search edge function:', error);
      throw new Error(`Failed to fetch contacts: ${error.message}`);
    }

    if (!data || !data.data) {
      console.error('No data returned from domain-search edge function');
      return null;
    }

    console.log(`Successfully retrieved ${data.data.emails?.length || 0} contacts for domain ${domain}`);
    return data.data as HunterDomainResponse;
  } catch (error) {
    console.error('Error in searchContactsByDomain:', error);
    throw error;
  }
}
