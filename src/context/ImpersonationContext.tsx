import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ImpersonationUser {
  id: string;
  name: string | null;
  email: string | null;
  artistic_name: string | null;
  role: 'user' | 'moderator';
}

interface ImpersonationContextType {
  isImpersonating: boolean;
  impersonatedUser: ImpersonationUser | null;
  originalUser: ImpersonationUser | null;
  startImpersonation: (targetUser: ImpersonationUser) => void;
  stopImpersonation: () => void;
  canImpersonate: (targetRole: 'user' | 'moderator') => boolean;
}

export const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export const ImpersonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonationUser | null>(null);
  const [originalUser, setOriginalUser] = useState<ImpersonationUser | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'moderator' | 'user' | null>(null);

  // Buscar role do usuário atual
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        return;
      }

      try {
        // Verificar se é admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (adminData) {
          setUserRole('admin');
          return;
        }

        // Verificar se é moderador
        const { data: moderatorData } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'moderator')
          .single();

        if (moderatorData) {
          setUserRole('moderator');
          return;
        }

        setUserRole('user');
      } catch (error) {
        console.error('Erro ao buscar role do usuário:', error);
        setUserRole('user');
      }
    };

    fetchUserRole();
  }, [user]);

  // Verificar se pode impersonar determinado role
  const canImpersonate = (targetRole: 'user' | 'moderator'): boolean => {
    if (!userRole) return false;
    
    // Admin pode impersonar qualquer um
    if (userRole === 'admin') return true;
    
    // Moderador só pode impersonar usuários
    if (userRole === 'moderator' && targetRole === 'user') return true;
    
    return false;
  };

  // Iniciar impersonação
  const startImpersonation = async (targetUser: ImpersonationUser) => {
    if (!user || !canImpersonate(targetUser.role)) {
      console.error('Não é possível impersonar este usuário');
      return;
    }

    // Se já está impersonando, parar primeiro
    if (isImpersonating) {
      stopImpersonation();
    }

    // Salvar usuário original se não estiver salvo
    if (!originalUser) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, email, artistic_name')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setOriginalUser({
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          artistic_name: profileData.artistic_name,
          role: userRole as 'user' | 'moderator'
        });
      }
    }

    // Iniciar impersonação
    setImpersonatedUser(targetUser);
    setIsImpersonating(true);

    // Salvar no localStorage para sincronizar entre abas
    localStorage.setItem('impersonation_data', JSON.stringify(targetUser));

    console.log('🎭 Impersonação iniciada:', targetUser);
    console.log('🎭 Estado da impersonação:', { isImpersonating: true, targetUser });
  };

  // Parar impersonação
  const stopImpersonation = () => {
    setImpersonatedUser(null);
    setIsImpersonating(false);
    
    // Remover do localStorage
    localStorage.removeItem('impersonation_data');
    
    console.log('🎭 Impersonação finalizada');
  };

  // Limpar estado quando usuário deslogar
  useEffect(() => {
    if (!user) {
      setImpersonatedUser(null);
      setOriginalUser(null);
      setIsImpersonating(false);
      setUserRole(null);
    }
  }, [user]);

  const value: ImpersonationContextType = {
    isImpersonating,
    impersonatedUser,
    originalUser,
    startImpersonation,
    stopImpersonation,
    canImpersonate,
  };

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
};

export const useImpersonation = () => {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
};