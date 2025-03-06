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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [schemaStatus, setSchemaStatus] = useState<{ public: boolean, salesforce: boolean }>({ 
    public: false, 
    salesforce: false 
  });
  const navigate = useNavigate();

  // Function to refresh the session
  const refreshSession = async () => {
    try {
      logger.auth('Manually refreshing session');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        logger.auth('Error refreshing session:', error);
        toast.error('Session refresh failed', {
          description: error.message
        });
        return;
      }
      
      if (data.session) {
        logger.auth('Session refreshed successfully');
        setSession(data.session);
        setUser(data.session.user);
        
        if (data.session.user) {
          await fetchProfile(data.session.user.id);
          checkDatabaseAccess();
        }
      } else {
        logger.auth('No session returned after refresh');
        setSession(null);
        setUser(null);
        setProfile(null);
        navigate('/auth');
      }
    } catch (error) {
      logger.auth('Unexpected error during session refresh:', error);
      toast.error('Session refresh failed', {
        description: 'An unexpected error occurred'
      });
    }
  };

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        logger.auth('Initializing authentication');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.auth('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        logger.auth(`Session found: ${!!data.session}`);
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          await fetchProfile(data.session.user.id);
          
          // Check database connection after authentication
          checkDatabaseAccess();
        } else {
          setLoading(false);
        }
        
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            logger.auth(`Auth state changed: ${event}`);
            setSession(newSession);
            setUser(newSession?.user ?? null);
            
            if (newSession?.user) {
              await fetchProfile(newSession.user.id);
              
              // Check database access on sign in
              if (event === 'SIGNED_IN') {
                checkDatabaseAccess();
                toast.success('Signed in successfully');
                logger.auth('User signed in successfully');
              } else if (event === 'TOKEN_REFRESHED') {
                logger.auth('Token refreshed automatically');
              }
            } else {
              setProfile(null);
              setDatabaseConnected(false);
              setSchemaStatus({ public: false, salesforce: false });
              setLoading(false);
              
              if (event === 'SIGNED_OUT') {
                logger.auth('User signed out');
                toast.info('Signed out');
              }
            }
          }
        );
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        logger.auth("Error initializing auth:", error);
        setLoading(false);
        toast.error('Authentication initialization failed', {
          description: 'Please try refreshing the page'
        });
      }
    };
    
    initializeAuth();
  }, []);

  const checkDatabaseAccess = async () => {
    try {
      logger.info('Checking database access');
      const connectionStatus = await checkDatabaseConnection();
      setDatabaseConnected(connectionStatus.connected);
      setSchemaStatus(connectionStatus.schemas);
      
      if (!connectionStatus.connected) {
        if (!connectionStatus.schemas.public && !connectionStatus.schemas.salesforce) {
          toast.error('Database connection failed', { 
            description: 'Unable to connect to any database schemas' 
          });
        } else if (connectionStatus.schemas.public && !connectionStatus.schemas.salesforce) {
          toast.warning('Limited data access', { 
            description: 'Connected to public schema but not salesforce schema' 
          });
        }
      }
    } catch (error) {
      logger.error('Error checking database access:', error);
      setDatabaseConnected(false);
      setSchemaStatus({ public: false, salesforce: false });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      logger.info(`Fetching profile for user: ${userId}`);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Error fetching profile:', error);
      } else {
        logger.info('Profile fetched successfully');
        setProfile(data);
      }
    } catch (error) {
      logger.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      logger.auth(`Signing in user: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        logger.auth('Sign in error:', error);
        setLoading(false);
        return { error };
      }
      
      logger.auth('Sign in successful');
      
      // Store the session in localStorage as a backup
      if (data.session) {
        try {
          localStorage.setItem('supabase-auth-token', JSON.stringify(data.session));
          logger.auth('Session stored in localStorage');
        } catch (storageError) {
          logger.warn('Failed to store session in localStorage:', storageError);
        }
      }
      
      navigate('/');
      return { error: null };
    } catch (error) {
      logger.auth('Unexpected error signing in:', error);
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      logger.info(`Signing up user: ${email}`);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (!error) {
        logger.info('Sign up successful');
        navigate('/');
      } else {
        logger.error('Sign up error:', error);
        setLoading(false);
      }
      
      return { error };
    } catch (error) {
      logger.error('Error signing up:', error);
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      logger.auth('Signing out user');
      
      // Clear any stored session
      try {
        localStorage.removeItem('supabase-auth-token');
      } catch (storageError) {
        logger.warn('Error clearing localStorage:', storageError);
      }
      
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      logger.auth('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

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
