
import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { 
  cleanupAuthState, 
  safeSupabaseCall, 
  ensureSingleAuthListener,
  debounce 
} from '@/lib/authUtils';

// Auth context interfaces
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  session: Session | null;
}

// Auth context with default values
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  session: null
});

// Auth provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Debounced session handler to prevent excessive calls
  const debouncedSessionHandler = debounce((event: string, newSession: Session | null) => {
    console.log('🔐 Auth event:', event, newSession?.user?.id);
    setSession(newSession);
    setUser(newSession?.user || null);
    
    // Defer any heavy operations to prevent blocking
    if (event === 'SIGNED_IN' && newSession) {
      setTimeout(() => {
        console.log('✅ User signed in successfully');
      }, 0);
    }
    
    setIsLoading(false);
  }, 300); // 300ms debounce

  // Initialize auth state (singleton pattern)
  useEffect(() => {
    if (!ensureSingleAuthListener()) {
      return; // Already initialized elsewhere
    }

    console.log('🚀 Initializing auth listener');

    // Set up auth state change listener with debouncing
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      debouncedSessionHandler
    );

    // Get current session with rate limiting
    const initSession = async () => {
      const result = await safeSupabaseCall(
        () => supabase.auth.getSession(),
        1, // Only 1 retry for initial session
        500 // 500ms delay
      );
      
      if (result?.data?.session) {
        setSession(result.data.session);
        setUser(result.data.session.user);
      }
      setIsLoading(false);
    };

    initSession();

    return () => {
      console.log('🛑 Cleaning up auth listener');
      subscription.unsubscribe();
      debouncedSessionHandler.cancel();
    };
  }, []);

  // Login function with rate limiting
  const login = async (email: string, password: string) => {
    try {
      // Clean up existing state first for a fresh login
      cleanupAuthState();
      
      // Try to sign out globally with safe call
      await safeSupabaseCall(
        () => supabase.auth.signOut({ scope: 'global' }),
        1, // Only 1 retry
        1000
      );

      // Login with rate limiting
      const result = await safeSupabaseCall(
        () => supabase.auth.signInWithPassword({ email, password }),
        2, // 2 retries for login
        2000
      );

      if (result?.error) throw result.error;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    try {
      // Clean up existing state
      cleanupAuthState();
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      throw error;
    }
  };

  // Google login function
  const loginWithGoogle = async () => {
    try {
      // Clean up existing state first
      cleanupAuthState();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      throw error;
    }
  };

  // Logout function with safe cleanup
  const logout = async () => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out with safe call
      await safeSupabaseCall(
        () => supabase.auth.signOut({ scope: 'global' }),
        1, // Only 1 retry for logout
        1000
      );
      
      // Clear state immediately
      setUser(null);
      setSession(null);
      
      console.log('👋 User logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear local state even if remote logout fails
      setUser(null);
      setSession(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        login,
        register,
        loginWithGoogle,
        logout,
        session
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Login message context for welcome messages
interface LoginMessageContextType {
  showLoginMessage: boolean;
  setShowLoginMessage: (show: boolean) => void;
  loginMessageShown: () => void;
}

export const LoginMessageContext = createContext<LoginMessageContextType>({
  showLoginMessage: false,
  setShowLoginMessage: () => {},
  loginMessageShown: () => {},
});

export const LoginMessageProvider = ({ children }: { children: React.ReactNode }) => {
  // Use localStorage to track if the login message has been shown in this session
  const [showLoginMessage, setShowLoginMessage] = useState<boolean>(() => {
    const shown = localStorage.getItem('login_message_shown');
    return !shown;
  });

  const loginMessageShown = () => {
    localStorage.setItem('login_message_shown', 'true');
    setShowLoginMessage(false);
  };

  return (
    <LoginMessageContext.Provider value={{ showLoginMessage, setShowLoginMessage, loginMessageShown }}>
      {children}
    </LoginMessageContext.Provider>
  );
};
