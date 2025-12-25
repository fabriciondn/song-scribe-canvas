import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SystemNotification {
  id: string;
  title: string;
  description: string | null;
  type: string;
  created_at: string;
  is_read?: boolean;
}

export const useSystemNotifications = () => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      // Buscar todas as notificações ativas
      const { data: allNotifications, error: notifError } = await supabase
        .from('system_notifications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (notifError) throw notifError;

      // Buscar quais o usuário já leu
      const { data: readNotifications, error: readError } = await supabase
        .from('user_notification_reads')
        .select('notification_id')
        .eq('user_id', user.id);

      if (readError) throw readError;

      const readIds = new Set(readNotifications?.map(r => r.notification_id) || []);

      // Marcar quais estão lidas
      const notificationsWithReadStatus = (allNotifications || []).map(notif => ({
        ...notif,
        is_read: readIds.has(notif.id)
      }));

      // Filtrar apenas não lidas para exibir
      const unreadNotifications = notificationsWithReadStatus.filter(n => !n.is_read);

      setNotifications(unreadNotifications);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_notification_reads')
        .insert({
          user_id: user.id,
          notification_id: notificationId
        });

      if (error) throw error;

      // Atualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;

    try {
      const inserts = notifications.map(n => ({
        user_id: user.id,
        notification_id: n.id
      }));

      const { error } = await supabase
        .from('user_notification_reads')
        .insert(inserts);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
};
