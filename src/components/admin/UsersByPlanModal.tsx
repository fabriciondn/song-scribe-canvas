import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserByPlan } from '@/services/adminService';
import { User, Calendar, Clock } from 'lucide-react';

interface UsersByPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserByPlan[];
  isLoading: boolean;
  planType: 'pro' | 'trial' | 'free' | 'inactive';
}

const planTitles = {
  pro: 'Usuários no Plano Pro',
  trial: 'Usuários em Trial',
  free: 'Usuários no Plano Grátis',
  inactive: 'Usuários Inativos (+30 dias)',
};

const planDescriptions = {
  pro: 'Usuários com assinatura ativa',
  trial: 'Usuários em período de teste',
  free: 'Usuários no plano gratuito',
  inactive: 'Usuários sem acesso há mais de 30 dias',
};

export const UsersByPlanModal: React.FC<UsersByPlanModalProps> = ({
  open,
  onOpenChange,
  users,
  isLoading,
  planType,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500">Pro Ativo</Badge>;
      case 'trial':
        return <Badge className="bg-amber-500">Trial</Badge>;
      case 'free':
      case 'expired':
        return <Badge variant="secondary">Grátis</Badge>;
      case 'inactive':
        return <Badge variant="destructive">Inativo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{planTitles[planType]}</DialogTitle>
          <DialogDescription>
            {planDescriptions[planType]} · Total: {users.length}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <User className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum usuário encontrado nesta categoria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || ''} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">
                          {user.name}
                        </p>
                        {getStatusBadge(user.subscription_status)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {user.email}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Cadastrado {formatDate(user.created_at)}</span>
                        </div>
                        
                        {planType === 'inactive' && user.last_activity && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Último acesso {formatDate(user.last_activity)}</span>
                          </div>
                        )}
                        
                        {(planType === 'pro' || planType === 'trial') && user.expires_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Expira {formatDate(user.expires_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
