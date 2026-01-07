import React from 'react';
import { Bell, X, Sparkles, Wrench, Megaphone, CheckCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'feature':
      return <Sparkles className="h-4 w-4 text-blue-400" />;
    case 'fix':
      return <Wrench className="h-4 w-4 text-orange-400" />;
    case 'announcement':
      return <Megaphone className="h-4 w-4 text-purple-400" />;
    case 'update':
      return <RefreshCw className="h-4 w-4 text-emerald-400" />;
    default:
      return <Bell className="h-4 w-4 text-green-400" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'feature':
      return 'Nova Função';
    case 'fix':
      return 'Correção';
    case 'announcement':
      return 'Anúncio';
    case 'update':
      return 'Atualização';
    default:
      return 'Notificação';
  }
};

export const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, refreshApp } = useSystemNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 bg-primary rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center text-primary-foreground animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Notificações</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhuma notificação nova</p>
              <p className="text-muted-foreground/70 text-xs mt-1">Você está em dia!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className="p-4 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted/80">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {getTypeLabel(notification.type)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm text-foreground leading-tight">
                        {notification.title}
                      </h4>
                      {notification.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.description}
                        </p>
                      )}
                      {/* Botão de atualizar para notificações do tipo 'update' */}
                      {notification.type === 'update' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 h-7 text-xs gap-1.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                          onClick={refreshApp}
                        >
                          <RefreshCw className="h-3 w-3" />
                          Atualizar agora
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
