import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { checkDatabaseConnection } from '@/lib/serverComms';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
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
            console.log(`Auth state changed: ${event}`);
            setSession(newSession);
            setUser(newSession?.user ?? null);
            
            if (newSession?.user) {
              await fetchProfile(newSession.user.id);
              
              // Check database access on sign in
              if (event === 'SIGNED_IN') {
                checkDatabaseAccess();
                toast.success('Signed in successfully');
              }
            } else {
              setProfile(null);
              setDatabaseConnected(false);
              setSchemaStatus({ public: false, salesforce: false });
              setLoading(false);
              
              if (event === 'SIGNED_OUT') {
                toast.info('Signed out');
              }
            }
          }
        );
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing auth:", error);
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  const checkDatabaseAccess = async () => {
    try {
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
      console.error('Error checking database access:', error);
      setDatabaseConnected(false);
      setSchemaStatus({ public: false, salesforce: false });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (!error) {
        navigate('/');
      } else {
        setLoading(false);
      }
      
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
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
        navigate('/');
      } else {
        setLoading(false);
      }
      
      return { error };
    } catch (error) {
      console.error('Error signing up:', error);
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
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
    schemaStatus
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
