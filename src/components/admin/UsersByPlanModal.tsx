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
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserByPlan } from '@/services/adminService';
import { User, Calendar, Clock, CreditCard, UserCheck, UserX } from 'lucide-react';

interface UsersByPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserByPlan[];
  isLoading: boolean;
  planType: 'pro' | 'trial' | 'free' | 'inactive';
}

const planMeta: Record<
  UsersByPlanModalProps['planType'],
  {
    title: string;
    description: string;
    dot: string;
    kicker: string;
    tint: string;
    Icon: React.ElementType;
    badge: (u: UserByPlan) => React.ReactNode;
  }
> = {
  pro: {
    title: 'Usuários no Plano Pro',
    description: 'Usuários com assinatura ativa',
    dot: 'bg-emerald-400',
    kicker: 'Plano Pro',
    tint: 'bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_55%)]',
    Icon: CreditCard,
    badge: () => (
      <span className="text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20">
        Pro Ativo
      </span>
    ),
  },
  trial: {
    title: 'Usuários em Trial',
    description: 'Usuários em período de teste',
    dot: 'bg-amber-400',
    kicker: 'Trial',
    tint: 'bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_55%)]',
    Icon: Clock,
    badge: () => (
      <span className="text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20">
        Trial
      </span>
    ),
  },
  free: {
    title: 'Usuários no Plano Grátis',
    description: 'Usuários no plano gratuito',
    dot: 'bg-white/60',
    kicker: 'Plano Grátis',
    tint: 'bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_55%)]',
    Icon: UserCheck,
    badge: () => (
      <span className="text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/70 ring-1 ring-white/10">
        Grátis
      </span>
    ),
  },
  inactive: {
    title: 'Usuários Inativos (+30 dias)',
    description: 'Usuários sem acesso há mais de 30 dias',
    dot: 'bg-red-400/80',
    kicker: 'Inativos +30d',
    tint: 'bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.07),transparent_55%)]',
    Icon: UserX,
    badge: () => (
      <span className="text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full bg-red-400/10 text-red-300 ring-1 ring-red-400/20">
        Inativo
      </span>
    ),
  },
};

export const UsersByPlanModal: React.FC<UsersByPlanModalProps> = ({
  open,
  onOpenChange,
  users,
  isLoading,
  planType,
}) => {
  const meta = planMeta[planType];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data não disponível';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] p-0 overflow-hidden border-white/[0.06] bg-[#0c0c0e]">
        {/* Header */}
        <div className="relative p-5 border-b border-white/[0.05] overflow-hidden">
          <div className={`absolute inset-0 ${meta.tint} pointer-events-none`} />
          <DialogHeader className="relative space-y-2">
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                {meta.kicker}
              </span>
            </div>
            <DialogTitle className="text-white text-2xl font-light tracking-tight">
              {meta.title}
            </DialogTitle>
            <DialogDescription className="text-white/45 text-[12px]">
              {meta.description}
            </DialogDescription>

            <div className="pt-3 flex items-baseline gap-3">
              <p className="text-[34px] leading-none font-light tracking-tight text-white tabular-nums">
                {users.length}
              </p>
              <span className="text-[11px] text-white/45">
                {users.length === 1 ? 'usuário' : 'usuários'} no total
              </span>
            </div>
          </DialogHeader>
        </div>

        {/* List */}
        <ScrollArea className="h-[520px] px-5 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t border-white/40" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/40">
              <meta.Icon className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">Nenhum usuário encontrado nesta categoria</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="group relative rounded-2xl overflow-hidden p-4
                             bg-white/[0.025] hover:bg-white/[0.04]
                             shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_14px_28px_-22px_rgba(0,0,0,0.55)]
                             transition-colors duration-200"
                >
                  <div className={`absolute inset-0 pointer-events-none ${meta.tint} opacity-60`} />
                  <div className="relative flex items-start gap-3">
                    <Avatar className="h-10 w-10 ring-1 ring-white/[0.06]">
                      <AvatarImage src={user.avatar_url || ''} />
                      <AvatarFallback className="bg-white/[0.04] text-white/50">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-medium text-white truncate">
                          {user.name}
                        </p>
                        {meta.badge(user)}
                      </div>

                      <p className="text-[11px] text-white/40 truncate mt-0.5">
                        {user.email}
                      </p>

                      <div className="mt-2 flex items-center gap-3 flex-wrap text-[11px] text-white/55">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-white/45" />
                          <span className="text-white/40">Cadastrado </span>
                          <span className="text-white/75">{formatDate(user.created_at)}</span>
                        </span>

                        {planType === 'inactive' && user.last_activity && (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-white/45" />
                            <span className="text-white/40">Último acesso </span>
                            <span className="text-white/75">{formatDate(user.last_activity)}</span>
                          </span>
                        )}

                        {(planType === 'pro' || planType === 'trial') && user.expires_at && (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-white/45" />
                            <span className="text-white/40">Expira </span>
                            <span className="text-white/75">{formatDate(user.expires_at)}</span>
                          </span>
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
