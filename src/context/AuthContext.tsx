import { createContext, useEffect, useState, ReactNode } from 'react';
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
  resetPassword: (email: string) => Promise<void>;
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
  resetPassword: async () => {},
  session: null
});

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
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
  }, 100); // Reduzido de 300ms para 100ms

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

  // Login function otimizado sem cleanup agressivo
  const login = async (email: string, password: string) => {
    try {
      // Login direto sem limpeza prévia agressiva
      const result = await safeSupabaseCall(
        () => supabase.auth.signInWithPassword({ email, password }),
        2, // 2 retries for login
        1000 // Delay reduzido
      );

      if (result?.error) throw result.error;
      
      console.log('✅ Login realizado com sucesso');
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
      
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });

      if (error) throw error;
      
      // Processar conversão de afiliado se existir código
      if (authData.user) {
        try {
          const affiliateCode = localStorage.getItem('affiliate_code');
          if (affiliateCode) {
            console.log('✅ Novo usuário registrado via afiliado:', affiliateCode);
            // Salvar o código associado ao usuário para processar depois
            await supabase
              .from('profiles')
              .update({ 
                moderator_notes: `Registrado via afiliado: ${affiliateCode}`
              })
              .eq('id', authData.user.id);
          }
        } catch (affiliateError) {
          console.error('⚠️ Erro ao processar conversão:', affiliateError);
        }
      }
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

  // Logout function with cleanup após logout
  const logout = async () => {
    try {
      // Attempt global sign out com safe call
      await safeSupabaseCall(
        () => supabase.auth.signOut({ scope: 'global' }),
        1, // Only 1 retry for logout
        1000
      );
      
      // Cleanup após logout para não interferir na sessão ativa
      cleanupAuthState();
      
      // Clear state immediately
      setUser(null);
      setSession(null);
      
      console.log('👋 User logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear local state even if remote logout fails
      cleanupAuthState();
      setUser(null);
      setSession(null);
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard`
      });

      if (error) throw error;
      
      console.log('📧 Email de redefinição de senha enviado');
    } catch (error: any) {
      console.error('Reset password error:', error);
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
        resetPassword,
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

export const LoginMessageProvider = ({ children }: { children: ReactNode }) => {
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
