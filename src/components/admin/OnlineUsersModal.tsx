import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OnlineUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OnlineUser {
  user_id: string;
  name: string;
  email: string;
  avatar_url: string;
  last_activity: string;
}

const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({ isOpen, onClose }) => {
  const { data: onlineUsers, isLoading } = useQuery({
    queryKey: ['online-users'],
    queryFn: async (): Promise<OnlineUser[]> => {
      const { data, error } = await supabase.rpc('get_online_users');
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Usuários Online</DialogTitle>
          <DialogDescription>
            Usuários ativos nos últimos 5 minutos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : onlineUsers?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum usuário online no momento
            </p>
          ) : (
            onlineUsers?.map((user) => (
              <div key={user.user_id} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar_url} alt={user.name} />
                  <AvatarFallback>
                    {user.name?.slice(0, 2).toUpperCase() || user.email?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ativo {formatDistanceToNow(new Date(user.last_activity), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnlineUsersModal;