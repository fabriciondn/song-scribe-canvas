import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface RealtimeConfig {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onUpdate?: (payload: any) => void;
  filter?: string;
}

export const useRealtimeUpdates = (configs: RealtimeConfig[]) => {
  const { user } = useAuth();

  const setupRealtimeSubscriptions = useCallback(() => {
    if (!user || configs.length === 0) return;

    const channels: any[] = [];

    configs.forEach((config, index) => {
      const channelName = `realtime-${config.table}-${index}`;
      
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes' as any,
          {
            event: config.event || '*',
            schema: 'public',
            table: config.table,
            filter: config.filter
          },
          (payload) => {
            console.log(`Realtime update for ${config.table}:`, payload);
            
            // Executar callback personalizado se fornecido
            if (config.onUpdate) {
              config.onUpdate(payload);
            }
            
            // Mostrar notificação para atualizações importantes baseado no eventType
            const eventType = (payload as any).eventType || (payload as any).event_type;
            if (eventType === 'INSERT') {
              toast.success(`Novo item adicionado em ${config.table}`);
            } else if (eventType === 'UPDATE') {
              toast.info(`Item atualizado em ${config.table}`);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to realtime updates for ${config.table}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Error subscribing to ${config.table} updates`);
          }
        });

      channels.push(channel);
    });

    // Cleanup function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user, configs]);

  useEffect(() => {
    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
  }, [setupRealtimeSubscriptions]);

  return {
    isConnected: !!user
  };
};

// Hook específico para atualizações de perfil
export const useProfileRealtimeUpdates = (onProfileUpdate?: (profile: any) => void) => {
  const { user } = useAuth();
  
  return useRealtimeUpdates([
    {
      table: 'profiles',
      event: 'UPDATE',
      filter: user ? `user_id=eq.${user.id}` : undefined,
      onUpdate: (payload) => {
        if (onProfileUpdate) {
          onProfileUpdate(payload.new);
        }
      }
    }
  ]);
};

// Hook específico para atualizações de obras registradas
export const useRegisteredWorksRealtimeUpdates = (onWorkUpdate?: (work: any) => void) => {
  const { user } = useAuth();
  
  return useRealtimeUpdates([
    {
      table: 'registered_works',
      event: '*',
      filter: user ? `user_id=eq.${user.id}` : undefined,
      onUpdate: (payload) => {
        if (onWorkUpdate) {
          onWorkUpdate(payload);
        }
      }
    }
  ]);
};

// Hook específico para atualizações de drafts
export const useDraftsRealtimeUpdates = (onDraftUpdate?: (draft: any) => void) => {
  const { user } = useAuth();
  
  return useRealtimeUpdates([
    {
      table: 'drafts',
      event: '*',
      filter: user ? `user_id=eq.${user.id}` : undefined,
      onUpdate: (payload) => {
        if (onDraftUpdate) {
          onDraftUpdate(payload);
        }
      }
    }
  ]);
};