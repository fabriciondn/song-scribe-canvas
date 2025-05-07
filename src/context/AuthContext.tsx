
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';

// Define User interface
export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

// Define AuthContext interface
interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with a default value
export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

// Create the AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Inicializar a autenticação
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        if (currentSession?.user) {
          const userEmail = currentSession.user.email || '';
          setUser({
            id: currentSession.user.id,
            name: userEmail.split('@')[0],
            email: userEmail,
          });
        } else {
          setUser(null);
        }
        
        if (event === 'SIGNED_IN') {
          toast({
            title: 'Login realizado com sucesso!',
            description: 'Bem-vindo de volta ao Compuse.',
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: 'Desconectado',
            description: 'Você foi desconectado com sucesso.',
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        const userEmail = currentSession.user.email || '';
        setUser({
          id: currentSession.user.id,
          name: userEmail.split('@')[0],
          email: userEmail,
        });
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      cleanupAuthState();
      
      // Primeiro tenta deslogar completamente
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continua mesmo se falhar
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Não precisamos fazer nada aqui pois o onAuthStateChange já atualiza o estado
        toast({
          title: 'Login realizado com sucesso!',
          description: 'Bem-vindo de volta ao Compuse.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message || 'Houve um problema ao tentar fazer login.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      cleanupAuthState();
      
      // Primeiro tenta deslogar completamente
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continua mesmo se falhar
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        toast({
          title: 'Registro realizado com sucesso!',
          description: 'Bem-vindo ao Compuse.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar',
        description: error.message || 'Houve um problema ao tentar registrar.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Limpa o estado de autenticação
      cleanupAuthState();
      
      // Tenta fazer logout global (fallback se falhar)
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Ignora erros
      }
      
      // Força uma atualização de página para um estado limpo
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: 'Erro ao desconectar',
        description: error.message || 'Houve um problema ao tentar desconectar.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
