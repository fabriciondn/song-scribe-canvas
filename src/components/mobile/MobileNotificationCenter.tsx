import React from 'react';
import { X, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componente para Material Symbols
const MaterialIcon: React.FC<{ name: string; filled?: boolean; className?: string }> = ({ 
  name, 
  filled = false, 
  className = '' 
}) => (
  <span 
    className={`material-symbols-rounded ${className}`}
    style={{ 
      fontVariationSettings: filled ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
    }}
  >
    {name}
  </span>
);

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'feature':
      return <MaterialIcon name="auto_awesome" className="text-blue-400" />;
    case 'fix':
      return <MaterialIcon name="build" className="text-orange-400" />;
    case 'announcement':
      return <MaterialIcon name="campaign" className="text-purple-400" />;
    default:
      return <MaterialIcon name="notifications" className="text-[#00C853]" />;
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
    default:
      return 'Atualização';
  }
};

export const MobileNotificationCenter: React.FC = () => {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useSystemNotifications();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
          <MaterialIcon name="notifications" className="text-2xl" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#000000] animate-pulse" />
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-[#0A0A0A] border-gray-800">
        <SheetHeader className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between pr-8">
            <SheetTitle className="text-white font-bold text-lg">Notificações</SheetTitle>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-gray-400 hover:text-white gap-1"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todas
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <div className="w-6 h-6 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1E1E1E] flex items-center justify-center mx-auto mb-4">
                <MaterialIcon name="notifications_off" className="text-3xl text-gray-600" />
              </div>
              <p className="text-gray-400 text-sm font-medium">Nenhuma notificação nova</p>
              <p className="text-gray-600 text-xs mt-1">Você está em dia!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className="p-4 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-[#1E1E1E]">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge className="text-[10px] px-2 py-0.5 bg-[#1E1E1E] text-gray-300 border-0">
                          {getTypeLabel(notification.type)}
                        </Badge>
                        <span className="text-[10px] text-gray-500">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-white leading-tight">
                        {notification.title}
                      </h4>
                      {notification.description && (
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">
                          {notification.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white hover:bg-white/10"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
