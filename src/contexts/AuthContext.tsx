import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase-client';
import { checkDatabaseConnection } from '@/lib/serverComms';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  profile: any | null;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
  databaseConnected: boolean;
  schemaStatus: { public: boolean, salesforce: boolean };
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Create a mock user for development
  const mockUser = {
    id: 'mock-user-id',
    email: 'mock@example.com',
    app_metadata: {},
    user_metadata: { full_name: 'Mock User' },
    aud: 'authenticated',
    created_at: new Date().toISOString()
  } as User;

  const mockSession = {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() + 3600,
    expires_in: 3600,
    user: mockUser
  } as Session;

  const [session, setSession] = useState<Session | null>(mockSession);
  const [user, setUser] = useState<User | null>(mockUser);
  const [profile, setProfile] = useState<any | null>({ id: mockUser.id, full_name: 'Mock User' });
  const [loading, setLoading] = useState(false); // Set to false to skip loading state
  const [databaseConnected, setDatabaseConnected] = useState(true); // Set to true to skip database connection check
  const [schemaStatus, setSchemaStatus] = useState<{ public: boolean, salesforce: boolean }>({ 
    public: true, 
    salesforce: true 
  });
  const navigate = useNavigate();

  // Function to refresh the session - simplified for development
  const refreshSession = async () => {
    logger.auth('Session refresh bypassed in development mode');
    return;
  };

  useEffect(() => {
    // Skip authentication in development mode
    logger.auth('Authentication bypassed in development mode');
    setLoading(false);
  }, []);

  // Simplified mock functions
  const signIn = async (email: string, password: string) => {
    logger.auth(`Mock sign in for: ${email}`);
    navigate('/');
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    logger.auth(`Mock sign up for: ${email}`);
    navigate('/');
    return { error: null };
  };

  const signOut = async () => {
    logger.auth('Mock sign out');
    navigate('/auth');
  };

  // Provide the context value with mock data
  const value = {
    session,
    user,
    profile,
    signIn,
    signUp,
    signOut,
    loading,
    databaseConnected,
    schemaStatus,
    refreshSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
