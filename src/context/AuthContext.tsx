import { createContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { 
  cleanupAuthState, 
  safeSupabaseCall, 
  ensureSingleAuthListener,
  resetAuthListener,
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
    const canInitListener = ensureSingleAuthListener();

    console.log('🚀 Initializing auth listener');

    // Set up auth state change listener with debouncing (quando permitido)
    const subscription = canInitListener
      ? supabase.auth.onAuthStateChange(debouncedSessionHandler).data.subscription
      : null;

    // Get current session with rate limiting (sempre roda)
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
      subscription?.unsubscribe();
      debouncedSessionHandler.cancel();

      // CRÍTICO: em dev/StrictMode o effect monta/desmonta 2x.
      // Se não resetar, o 2º mount fica sem listener e quebra checagens de role (ex: /admin).
      resetAuthListener();
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
      console.log('✅ AuthData recebido:', authData);
      
      if (authData.user) {
        console.log('✅ Usuário criado com ID:', authData.user.id);
        
        const affiliateCode = localStorage.getItem('affiliate_code');
        console.log('🔍 Verificando localStorage para affiliate_code:', affiliateCode);
        
        if (affiliateCode) {
          console.log('🎯 CÓDIGO DE PARCEIRO ENCONTRADO:', affiliateCode);
          console.log('⏳ Aguardando criação do perfil...');
          
          // Aguardar perfil ser criado (com retry)
          let retries = 0;
          const maxRetries = 5;
          let profileExists = false;
          
          while (retries < maxRetries && !profileExists) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', authData.user.id)
              .maybeSingle();
            
            if (profile) {
              profileExists = true;
              console.log(`✅ Perfil confirmado na tentativa ${retries + 1}`);
            } else {
              console.log(`⏳ Tentativa ${retries + 1}/${maxRetries}...`);
              retries++;
            }
          }
          
          if (!profileExists) {
            console.error('❌ Perfil não criado após várias tentativas');
            return;
          }
          
          // IMPORTANTE: Salvar código no moderator_notes IMEDIATAMENTE
          try {
            console.log('💾 Salvando código de parceiro no perfil...');
            const normalizedCode = affiliateCode.startsWith('compuse-') 
              ? affiliateCode 
              : `compuse-${affiliateCode}`;
              
            await supabase
              .from('profiles')
              .update({ 
                moderator_notes: `Indicado por: ${normalizedCode}` 
              })
              .eq('id', authData.user.id);
            
            console.log('✅ Código salvo com sucesso!');
            
            // Processar conversão de registro
            const { data: result } = await supabase.rpc(
              'process_affiliate_registration',
              {
                p_affiliate_code: affiliateCode,
                p_user_id: authData.user.id
              }
            );
            
            if (result) {
              console.log('✅ Conversão de registro processada!');
              localStorage.removeItem('affiliate_code');
            }
            
          } catch (error) {
            console.error('❌ Erro ao salvar código de parceiro:', error);
          }
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
        redirectTo: `${window.location.origin}/reset-password`
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
