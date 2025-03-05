import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any | null; data: any | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.setSession({
      refresh_token: localStorage.getItem('supabase.auth.refreshToken') || '',
      access_token: localStorage.getItem('supabase.auth.accessToken') || '',
    }).catch(err => {
      console.error('Error setting session persistence:', err);
    });

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        localStorage.setItem('supabase.auth.refreshToken', session.refresh_token || '');
        localStorage.setItem('supabase.auth.accessToken', session.access_token);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('supabase.auth.refreshToken');
        localStorage.removeItem('supabase.auth.accessToken');
      }
    });
  }, []);

  useEffect(() => {
    const setData = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            console.error('Error fetching profile:', profileError);
          } else {
            setProfile(data);
          }
        }
      } catch (error) {
        console.error('Unexpected error during auth setup:', error);
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              console.error('Error fetching profile on auth change:', error);
            } else {
              setProfile(data);
            }
          } catch (error) {
            console.error('Unexpected error fetching profile:', error);
          }
        } else {
          setProfile(null);
          
          const protectedRoutes = ['/real-estate-pipeline', '/salesforce-leads'];
          const isProtectedRoute = protectedRoutes.some(route => 
            location.pathname.startsWith(route)
          );
          
          if (isProtectedRoute && location.pathname !== '/auth') {
            navigate('/auth');
          }
        }
      }
    );

    setData();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
      });
      
      if (!error) {
        navigate('/real-estate-pipeline');
      }
      return { error };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (!error && data.user) {
        await signIn(email, password);
        toast.success('Account created and logged in successfully!');
      }
      
      return { data, error };
    } catch (error) {
      console.error('Unexpected error during sign up:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.refreshToken');
      localStorage.removeItem('supabase.auth.accessToken');
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
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
