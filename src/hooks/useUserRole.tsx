import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  isPro: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
}

export const useUserRole = (): UserRole => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>({
    isPro: false,
    isAdmin: false,
    isModerator: false,
    isLoading: true,
  });

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) {
        setRole({
          isPro: false,
          isAdmin: false,
          isModerator: false,
          isLoading: false,
        });
        return;
      }

      try {
        // Verificar se é admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (adminData) {
          setRole({
            isPro: true,
            isAdmin: adminData.role === 'admin',
            isModerator: adminData.role === 'moderator',
            isLoading: false,
          });
          return;
        }

        // Por enquanto, todos os usuários que não são admin/moderator são considerados usuários básicos
        // Aqui você pode implementar a lógica para verificar se o usuário é Pro
        // baseado em assinatura, pagamento, etc.
        setRole({
          isPro: false,
          isAdmin: false,
          isModerator: false,
          isLoading: false,
        });

      } catch (error) {
        console.error('Erro ao buscar role do usuário:', error);
        setRole({
          isPro: false,
          isAdmin: false,
          isModerator: false,
          isLoading: false,
        });
      }
    };

    fetchUserRole();
  }, [user?.id]);

  return role;
};