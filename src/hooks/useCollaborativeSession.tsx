import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  CollaborativeSession, 
  CollaborativeParticipant,
  getSessionParticipants,
  updateParticipantActivity,
  leaveSession
} from '@/services/collaborativeSessionService';
import { Draft } from '@/services/drafts/types';

interface UseCollaborativeSessionProps {
  session: CollaborativeSession | null;
  draftId: string | null;
  onDraftUpdate?: (draft: Partial<Draft>) => void;
}

export const useCollaborativeSession = ({ 
  session, 
  draftId, 
  onDraftUpdate 
}: UseCollaborativeSessionProps) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<CollaborativeParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar participantes
  const loadParticipants = useCallback(async () => {
    if (!session) return;
    try {
      const data = await getSessionParticipants(session.id);
      setParticipants(data);
    } catch (error) {
      console.error('Erro ao carregar participantes:', error);
    }
  }, [session]);

  // Configurar realtime para mudanças no draft
  useEffect(() => {
    if (!session || !draftId || !user) return;

    console.log('Configurando realtime para draft:', draftId);

    // Canal para mudanças no draft
    const draftChannel = supabase
      .channel(`draft-${draftId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drafts',
          filter: `id=eq.${draftId}`
        },
        (payload) => {
          console.log('Draft atualizado:', payload);
          if (onDraftUpdate && payload.new) {
            onDraftUpdate(payload.new as Partial<Draft>);
          }
        }
      )
      .subscribe((status) => {
        console.log('Status do canal de draft:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = draftChannel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [session, draftId, user, onDraftUpdate]);

  // Configurar canal de presença
  useEffect(() => {
    if (!session || !user) return;

    console.log('Configurando canal de presença para sessão:', session.id);

    const presenceChannel = supabase
      .channel(`presence-${session.id}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        console.log('Presença sincronizada:', state);
        
        // Atualizar lista de participantes online
        const onlineUsers = Object.values(state).flat() as any[];
        setParticipants(prev => 
          prev.map(p => ({
            ...p,
            is_online: onlineUsers.some(u => u.user_id === p.user_id)
          }))
        );
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Usuário entrou:', key, newPresences);
        loadParticipants();
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Usuário saiu:', key, leftPresences);
        loadParticipants();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });

    presenceChannelRef.current = presenceChannel;

    return () => {
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, [session, user, loadParticipants]);

  // Atualizar atividade periodicamente
  useEffect(() => {
    if (!session) return;

    loadParticipants();

    activityIntervalRef.current = setInterval(() => {
      updateParticipantActivity(session.id);
    }, 30000); // A cada 30 segundos

    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
    };
  }, [session, loadParticipants]);

  // REMOVIDO: Não chamar leaveSession automaticamente ao desmontar
  // A sessão só deve ser encerrada quando o usuário clicar explicitamente em "Sair" ou "Encerrar"
  // O status online/offline é gerenciado pelo canal de presença real-time

  const onlineParticipants = participants.filter(p => p.is_online);
  const isHost = session?.host_user_id === user?.id;

  return {
    participants,
    onlineParticipants,
    isConnected,
    isHost,
    loadParticipants
  };
};
