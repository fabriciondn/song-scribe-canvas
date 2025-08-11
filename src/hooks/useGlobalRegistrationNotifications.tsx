import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/components/ui/notification';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonation } from '@/context/ImpersonationContext';

export const useGlobalRegistrationNotifications = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { isImpersonating, impersonatedUser } = useImpersonation();

  // Usar o ID do usuário correto (impersonado ou real)
  const currentUserId = isImpersonating && impersonatedUser ? impersonatedUser.id : user?.id;

  useEffect(() => {
    if (!currentUserId) return;

    console.log('🔔 Configurando notificações globais de registro para usuário:', currentUserId);

    const channel = supabase
      .channel('global-registration-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'author_registrations',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          const { new: updatedRegistration } = payload;
          console.log('🎵 Atualização de registro detectada:', updatedRegistration);

          // Se o status mudou para 'registered', mostrar notificação
          if (updatedRegistration.status === 'registered') {
            console.log('🎉 Música registrada! Enviando notificação...');
            
            // Notificação principal no canto da tela
            addNotification({
              title: '🎉 Parabéns! Sua obra está protegida!',
              message: `A música "${updatedRegistration.title}" foi analisada e registrada com sucesso. Seus direitos autorais estão agora protegidos.`,
              type: 'success',
              duration: 10000
            });

            // Toast adicional para garantir visibilidade
            toast.success('Obra registrada com sucesso!', {
              description: `"${updatedRegistration.title}" está agora protegida por direitos autorais.`,
              duration: 8000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 Removendo notificações globais de registro');
      supabase.removeChannel(channel);
    };
  }, [currentUserId, addNotification]);
};