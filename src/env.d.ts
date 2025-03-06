/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly VITE_ZONEOMICS_API_KEY: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_GREATSCHOOLS_API_KEY: string;
  readonly VITE_CENSUS_API_KEY: string;
  readonly VITE_GOOGLE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 