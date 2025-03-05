
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

  // Setup persistent session handling
  useEffect(() => {
    const setupPersistence = async () => {
      try {
        // Try to restore session from local storage
        const accessToken = localStorage.getItem('supabase.auth.accessToken');
        const refreshToken = localStorage.getItem('supabase.auth.refreshToken');
        
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            refresh_token: refreshToken,
            access_token: accessToken,
          });
        }
      } catch (err) {
        console.error('Error setting session persistence:', err);
        // Clear potentially corrupt tokens
        localStorage.removeItem('supabase.auth.refreshToken');
        localStorage.removeItem('supabase.auth.accessToken');
      }
    };

    setupPersistence();

    // Listen for auth state changes to update local storage
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && newSession) {
        localStorage.setItem('supabase.auth.refreshToken', newSession.refresh_token || '');
        localStorage.setItem('supabase.auth.accessToken', newSession.access_token);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('supabase.auth.refreshToken');
        localStorage.removeItem('supabase.auth.accessToken');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle authentication state and fetch user profile
  useEffect(() => {
    const fetchAuthAndProfile = async () => {
      try {
        // First set loading to true
        setLoading(true);
        
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          setLoading(false);
          return;
        }
        
        // Update session and user states
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // If user is authenticated, fetch their profile
        if (currentSession?.user) {
          try {
            const { data, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();
            
            if (profileError) {
              console.error('Error fetching profile:', profileError);
            } else {
              setProfile(data);
              console.log('User profile loaded:', data);
            }
          } catch (profileErr) {
            console.error('Unexpected error fetching profile:', profileErr);
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Unexpected error during auth setup:', err);
      } finally {
        // Always finish loading
        setLoading(false);
      }
    };

    fetchAuthAndProfile();

    // Set up subscription to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state change detected:', event);
        
        // Update session and user state
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newSession.user.id)
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
          
          // Don't redirect on initial load or when already on auth page
          if (event === 'SIGNED_OUT' && location.pathname !== '/auth') {
            const protectedRoutes = ['/real-estate-pipeline', '/salesforce-leads'];
            const isProtectedRoute = protectedRoutes.some(route => 
              location.pathname.startsWith(route)
            );
            
            if (isProtectedRoute) {
              navigate('/auth');
            }
          }
        }
      }
    );

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
        // Get the intended destination or default to home
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
        toast.success('Signed in successfully');
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
        // After signup, sign in automatically
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
      setLoading(true);
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.refreshToken');
      localStorage.removeItem('supabase.auth.accessToken');
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
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
