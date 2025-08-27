import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImpersonationUser {
  id: string;
  name: string | null;
  email: string | null;
  artistic_name: string | null;
  role: 'user' | 'moderator' | 'admin';
}

interface ImpersonationContextType {
  isImpersonating: boolean;
  impersonatedUser: ImpersonationUser | null;
  originalUser: ImpersonationUser | null;
  startImpersonation: (targetUser: ImpersonationUser) => void;
  stopImpersonation: () => void;
  canImpersonate: (targetRole: 'user' | 'moderator' | 'admin', targetUserId?: string) => boolean;
  managedUserIds: string[];
}

export const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

interface ImpersonationProviderProps {
  children: React.ReactNode;
}

export const ImpersonationProvider: React.FC<ImpersonationProviderProps> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonationUser | null>(null);
  const [originalUser, setOriginalUser] = useState<ImpersonationUser | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'moderator' | 'user' | null>(null);
  const [managedUserIds, setManagedUserIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserRoleAndManagedUsers = async () => {
      if (!user) {
        setUserRole(null);
        setManagedUserIds([]);
        return;
      }
      try {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        let role: 'admin' | 'moderator' | 'user' = 'user';
        if (adminData && !adminError) {
          if (adminData.role === 'super_admin' || adminData.role === 'admin') {
            role = 'admin';
          } else if (adminData.role === 'moderator') {
            role = 'moderator';
          }
        }
        setUserRole(role);

        if (role === 'moderator') {
          const { data: moderatorUsers, error: modError } = await supabase
            .from('moderator_users')
            .select('user_id, moderator_id')
            .eq('moderator_id', user.id);
          if (!modError && moderatorUsers) {
            console.log('🟣 moderator_users rows:', moderatorUsers);
            setManagedUserIds(moderatorUsers.map((mu: any) => mu.user_id));
          } else {
            setManagedUserIds([]);
          }
        } else {
          setManagedUserIds([]);
        }
      } catch (error) {
        setUserRole('user');
        setManagedUserIds([]);
      }
    };
    fetchUserRoleAndManagedUsers();
  }, [user]);

  const stopImpersonation = () => {
    if (impersonatedUser) {
      // Log parada da impersonação
      supabase.rpc('log_impersonation_activity', {
        p_impersonated_user_id: impersonatedUser.id,
        p_impersonated_role: impersonatedUser.role,
        p_action: 'impersonation_stopped'
      });
    }
    
    setImpersonatedUser(null);
    setIsImpersonating(false);
    localStorage.removeItem('impersonation_data');
    setUserRole(null);
    setManagedUserIds([]);
  };

  const canImpersonate = (targetRole: 'user' | 'moderator' | 'admin', targetUserId?: string): boolean => {
    if (!userRole) return false;
    
    // Super Admin pode impersonar todos
    if (userRole === 'admin') {
      return true;
    }
    
    // Moderador pode impersonar apenas usuários que ele cadastrou
    if (userRole === 'moderator' && targetRole === 'user' && targetUserId) {
      return managedUserIds.includes(targetUserId);
    }
    
    return false;
  };

  const startImpersonation = async (targetUser: ImpersonationUser) => {
    if (!user || !canImpersonate(targetUser.role, targetUser.id)) {
      toast.error('Você não tem permissão para operar como este usuário.');
      return;
    }
    
    try {
      if (isImpersonating) {
        stopImpersonation();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      let currentOriginalUser = originalUser;
      if (!currentOriginalUser) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id, name, email, artistic_name')
          .eq('id', user.id)
          .single();
        if (profileData && !error) {
          currentOriginalUser = {
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            artistic_name: profileData.artistic_name,
            role: userRole as 'user' | 'moderator' | 'admin'
          };
        } else {
          currentOriginalUser = {
            id: user.id,
            name: user.user_metadata?.full_name || null,
            email: user.email || null,
            artistic_name: null,
            role: userRole as 'user' | 'moderator' | 'admin'
          };
        }
        setOriginalUser(currentOriginalUser);
      }
      
      // Log início da impersonação
      await supabase.rpc('log_impersonation_activity', {
        p_impersonated_user_id: targetUser.id,
        p_impersonated_role: targetUser.role,
        p_action: 'impersonation_started'
      });
      
      setImpersonatedUser(targetUser);
      setIsImpersonating(true);
      localStorage.setItem('impersonation_data', JSON.stringify({
        targetUser,
        originalUser: currentOriginalUser,
        timestamp: Date.now()
      }));
      
      const displayName = targetUser.name || targetUser.email;
      const roleDisplay = targetUser.role === 'admin' ? 'Administrador' : 
                         targetUser.role === 'moderator' ? 'Moderador' : 'Usuário';
      toast.success(`Operando como ${roleDisplay}: ${displayName}`);
    } catch (error) {
      console.error('Erro ao iniciar impersonação:', error);
      toast.error('Erro ao iniciar impersonação');
    }
  };

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const storedData = localStorage.getItem('impersonation_data');
        if (storedData && !isImpersonating && user) {
          const parsedData = JSON.parse(storedData);
          if (parsedData.targetUser) {
            setImpersonatedUser(parsedData.targetUser);
            setIsImpersonating(true);
            if (parsedData.originalUser) {
              setOriginalUser(parsedData.originalUser);
            }
          } else {
            setImpersonatedUser(parsedData);
            setIsImpersonating(true);
          }
        }
      } catch (error) {
        localStorage.removeItem('impersonation_data');
      }
    };
    if (user) {
      syncFromStorage();
    }
  }, [user, isImpersonating]);

  useEffect(() => {
    if (!user) {
      setImpersonatedUser(null);
      setOriginalUser(null);
      setIsImpersonating(false);
      setUserRole(null);
      setManagedUserIds([]);
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
    managedUserIds
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
