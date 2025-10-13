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
        const affiliateCode = localStorage.getItem('affiliate_code');
        console.log('🎯 Usuário criado com ID:', authData.user.id);
        console.log('🔍 Código de afiliado no localStorage:', affiliateCode);
        
        if (affiliateCode) {
          // Aguardar criação do perfil (trigger automático)
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          try {
            console.log('🚀 Iniciando processamento de conversão...');
            console.log('📋 Código do afiliado:', affiliateCode);
            console.log('👤 ID do usuário:', authData.user.id);
            
            // Chamar função SQL para processar conversão de forma atômica
            const { data: result, error: functionError } = await supabase.rpc(
              'process_affiliate_registration',
              {
                p_affiliate_code: affiliateCode,
                p_user_id: authData.user.id
              }
            );
            
            if (functionError) {
              console.error('❌ Erro ao processar conversão via função:', functionError);
              
              // Fallback: tentar processamento manual
              console.log('🔄 Tentando processamento manual...');
              
              // Buscar afiliado com diferentes formatos
              const possibleCodes = [
                affiliateCode,
                affiliateCode.startsWith('compuse-') ? affiliateCode : `compuse-${affiliateCode}`,
                affiliateCode.replace(/^compuse-/, '')
              ];
              
              let affiliate = null;
              for (const code of possibleCodes) {
                const { data, error } = await supabase
                  .from('affiliates')
                  .select('id, total_registrations, affiliate_code')
                  .eq('affiliate_code', code)
                  .eq('status', 'approved')
                  .maybeSingle();
                
                if (data) {
                  affiliate = data;
                  console.log('✅ Afiliado encontrado com código:', code);
                  break;
                }
              }
              
              if (!affiliate) {
                console.error('❌ Afiliado não encontrado');
                return;
              }
              
              // Processar manualmente
              try {
                await supabase.from('affiliate_conversions').insert({
                  affiliate_id: affiliate.id,
                  user_id: authData.user.id,
                  type: 'author_registration',
                  reference_id: authData.user.id
                });
                
                await supabase.from('affiliates').update({ 
                  total_registrations: (affiliate.total_registrations || 0) + 1
                }).eq('id', affiliate.id);
                
                await supabase.from('profiles').upsert({ 
                  id: authData.user.id,
                  moderator_notes: `Indicado por: ${affiliate.affiliate_code}`
                }, { onConflict: 'id' });
                
                console.log('✅ Conversão processada manualmente');
              } catch (manualError) {
                console.error('❌ Erro no processamento manual:', manualError);
              }
            } else if (result) {
              console.log('🎉 Conversão processada com sucesso via função SQL!');
            } else {
              console.warn('⚠️ Função retornou false - afiliado pode não existir');
            }
            
            localStorage.removeItem('affiliate_code');
            console.log('💾 Código removido do localStorage');
            
          } catch (error) {
            console.error('💥 ERRO CRÍTICO ao processar conversão:', error);
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
