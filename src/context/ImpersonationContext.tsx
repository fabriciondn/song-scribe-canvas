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
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminData && !adminError) {
          console.log('👤 Role detectado:', adminData.role);
          const role = adminData.role === 'super_admin' ? 'admin' : adminData.role;
          if (['admin', 'moderator', 'user'].includes(role)) {
            setUserRole(role as 'admin' | 'moderator' | 'user');
          } else {
            setUserRole('user');
          }
          return;
        }

        if (adminError && adminError.code !== 'PGRST116') {
          console.error('Erro ao verificar role:', adminError);
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

    console.log('🎭 Iniciando impersonação...', targetUser);

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
        const original = {
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          artistic_name: profileData.artistic_name,
          role: userRole as 'user' | 'moderator'
        };
        
        setOriginalUser(original);
        console.log('💾 Usuário original salvo:', original);
      }
    }

    // Iniciar impersonação
    setImpersonatedUser(targetUser);
    setIsImpersonating(true);

    // Salvar no localStorage para sincronizar entre abas
    localStorage.setItem('impersonation_data', JSON.stringify({
      targetUser,
      originalUser: originalUser || {
        id: user.id,
        name: user.user_metadata?.full_name || null,
        email: user.email || null,
        artistic_name: null,
        role: userRole as 'user' | 'moderator'
      }
    }));

    console.log('🎭 Impersonação iniciada com sucesso:', targetUser);
  };

  // Parar impersonação
  const stopImpersonation = () => {
    setImpersonatedUser(null);
    setIsImpersonating(false);
    
    // Remover do localStorage
    localStorage.removeItem('impersonation_data');
    
    console.log('🎭 Impersonação finalizada');
  };

  // Sincronizar com localStorage na inicialização
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const storedData = localStorage.getItem('impersonation_data');
        if (storedData && !isImpersonating && user) {
          const parsedData = JSON.parse(storedData);
          console.log('🔄 Sincronizando impersonação do localStorage:', parsedData);
          
          if (parsedData.targetUser) {
            setImpersonatedUser(parsedData.targetUser);
            setIsImpersonating(true);
            if (parsedData.originalUser) {
              setOriginalUser(parsedData.originalUser);
            }
          } else {
            // Formato antigo - compatibilidade
            setImpersonatedUser(parsedData);
            setIsImpersonating(true);
          }
        }
      } catch (error) {
        console.error('Erro ao sincronizar impersonação:', error);
        localStorage.removeItem('impersonation_data');
      }
    };

    if (user) {
      syncFromStorage();
    }
  }, [user, isImpersonating]);

  // Limpar estado quando usuário deslogar
  useEffect(() => {
    if (!user) {
      setImpersonatedUser(null);
      setOriginalUser(null);
      setIsImpersonating(false);
      setUserRole(null);
      localStorage.removeItem('impersonation_data');
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