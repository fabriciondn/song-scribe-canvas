import { useEffect, useRef } from 'react';
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

  // Ref para manter a referência mais recente de addNotification
  const addNotificationRef = useRef(addNotification);
  
  // Atualizar a ref sempre que addNotification mudar
  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);

  useEffect(() => {
    if (!currentUserId) return;

    console.log('🔔 Configurando notificações globais de registro para usuário:', currentUserId);

    const channel = supabase
      .channel(`global-registration-notifications-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'author_registrations',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          const { new: updatedRegistration, old: oldRegistration } = payload;
          console.log('🎵 Atualização de registro detectada:', updatedRegistration);
          console.log('📝 Status anterior:', oldRegistration?.status);
          console.log('📝 Novo status:', updatedRegistration.status);

          // Se o status mudou para 'registered' (e não era 'registered' antes)
          if (updatedRegistration.status === 'registered' && oldRegistration?.status !== 'registered') {
            console.log('🎉 Música registrada! Enviando notificação...');
            
            // Usar a ref para garantir a referência mais recente
            addNotificationRef.current({
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
      .subscribe((status) => {
        console.log('📡 Status da subscrição realtime:', status);
      });

    return () => {
      console.log('🔔 Removendo notificações globais de registro');
      supabase.removeChannel(channel);
    };
  }, [currentUserId]); // Removido addNotification das dependências
};