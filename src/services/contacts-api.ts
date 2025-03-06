
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

export interface EmailFinderResponse {
  data: {
    email: string;
    score: number;
    domain: string;
    company: string;
    first_name: string;
    last_name: string;
    position: string | null;
    twitter: string | null;
    linkedin: string | null;
    phone_number: string | null;
    verification: {
      date: string;
      status: string;
    } | null;
    sources: {
      domain: string;
      uri: string;
      extracted_on: string;
      last_seen_on: string;
      still_on_page: boolean;
    }[];
  };
}

export type ContactsSearchParams = {
  domain: string;
  limit?: number;
  department?: string;
  seniority?: string;
  type?: "personal" | "generic" | "any";
};

export type EmailFinderParams = {
  domain: string;
  company?: string;
  first_name: string;
  last_name: string;
  max_duration?: number;
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

export async function findEmailByName(params: EmailFinderParams): Promise<EmailFinderResponse | null> {
  try {
    const { domain, company, first_name, last_name, max_duration } = params;
    
    console.log('Calling email-finder edge function with params:', { domain, company, first_name, last_name, max_duration });
    
    const { data, error } = await supabase.functions.invoke('email-finder', {
      body: { domain, company, first_name, last_name, max_duration }
    });

    if (error) {
      console.error('Error calling email-finder edge function:', error);
      throw new Error(`Failed to find email: ${error.message}`);
    }

    if (!data) {
      console.error('No data returned from email-finder edge function');
      return null;
    }

    console.log('Successfully found email for', first_name, last_name, 'at', domain);
    return data as EmailFinderResponse;
  } catch (error) {
    console.error('Error in findEmailByName:', error);
    throw error;
  }
}
