import React, { useMemo, useState } from 'react';
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
import { RevenueTransaction } from '@/services/adminService';
import { CreditCard, User, TrendingUp, Users, Shield } from 'lucide-react';

interface RevenueDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: RevenueTransaction[];
  isLoading: boolean;
}

type Filter = 'all' | 'with_mod' | 'without_mod';

export const RevenueDetailsModal: React.FC<RevenueDetailsModalProps> = ({
  open,
  onOpenChange,
  transactions,
  isLoading,
}) => {
  const [filter, setFilter] = useState<Filter>('all');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não disponível';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR });
  };

  const filtered = useMemo(() => {
    if (filter === 'with_mod') return transactions.filter((t) => t.via_moderator);
    if (filter === 'without_mod') return transactions.filter((t) => !t.via_moderator);
    return transactions;
  }, [transactions, filter]);

  const totals = useMemo(() => {
    const withMod = transactions.filter((t) => t.via_moderator);
    const withoutMod = transactions.filter((t) => !t.via_moderator);
    return {
      all: transactions.reduce((a, t) => a + Number(t.total_amount || 0), 0),
      withMod: withMod.reduce((a, t) => a + Number(t.total_amount || 0), 0),
      withoutMod: withoutMod.reduce((a, t) => a + Number(t.total_amount || 0), 0),
      countAll: transactions.length,
      countWithMod: withMod.length,
      countWithoutMod: withoutMod.length,
    };
  }, [transactions]);

  const displayTotal = filter === 'with_mod' ? totals.withMod : filter === 'without_mod' ? totals.withoutMod : totals.all;
  const displayCount = filter === 'with_mod' ? totals.countWithMod : filter === 'without_mod' ? totals.countWithoutMod : totals.countAll;

  const FilterPill: React.FC<{ value: Filter; label: string; value$: number; count: number; tone?: 'emerald' | 'amber' | 'neutral' }> = ({
    value, label, value$, count, tone = 'neutral'
  }) => {
    const active = filter === value;
    const dot =
      tone === 'emerald' ? 'bg-emerald-400' : tone === 'amber' ? 'bg-amber-400' : 'bg-white/60';
    return (
      <button
        onClick={() => setFilter(value)}
        className={`group relative text-left rounded-xl overflow-hidden p-3 flex-1
          bg-white/[0.025] hover:bg-white/[0.045]
          shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_14px_28px_-22px_rgba(0,0,0,0.55)]
          transition-all duration-200
          ${active ? 'ring-1 ring-white/15 bg-white/[0.05]' : ''}`}
      >
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 truncate">{label}</span>
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <p className="text-lg font-light tracking-tight text-white tabular-nums">{formatCurrency(value$)}</p>
        </div>
        <p className="text-[10px] text-white/35 mt-0.5">{count} {count === 1 ? 'transação' : 'transações'}</p>
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] p-0 overflow-hidden border-white/[0.06] bg-[#0c0c0e]">
        {/* Header */}
        <div className="relative p-5 border-b border-white/[0.05] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_55%)] pointer-events-none" />
          <DialogHeader className="relative space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">Receita acumulada</span>
            </div>
            <DialogTitle className="text-white text-2xl font-light tracking-tight">
              Detalhes do faturamento
            </DialogTitle>
            <DialogDescription className="text-white/45 text-[12px]">
              Transações via Mercado Pago, OpenPix e moderadores
            </DialogDescription>

            <div className="pt-3 flex items-baseline gap-3">
              <p className="text-[34px] leading-none font-light tracking-tight text-white tabular-nums">
                {formatCurrency(displayTotal)}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300/90">
                <TrendingUp className="h-3 w-3" />
                {displayCount} {displayCount === 1 ? 'transação' : 'transações'}
              </span>
            </div>
          </DialogHeader>
        </div>

        {/* Filters */}
        <div className="px-5 pt-4 pb-3">
          <div className="grid grid-cols-3 gap-2">
            <FilterPill value="all" label="Todos" value$={totals.all} count={totals.countAll} tone="emerald" />
            <FilterPill value="without_mod" label="Sem moderadores" value$={totals.withoutMod} count={totals.countWithoutMod} />
            <FilterPill value="with_mod" label="Com moderadores" value$={totals.withMod} count={totals.countWithMod} tone="amber" />
          </div>
        </div>

        {/* List */}
        <ScrollArea className="h-[520px] px-5 pb-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t border-white/40" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/40">
              <CreditCard className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((t) => {
                const isMod = !!t.via_moderator;
                const typeLabel =
                  t.transaction_type === 'credits'
                    ? 'Compra de créditos'
                    : `Assinatura ${(t.subscription_plan || 'pro').toUpperCase()}`;
                const TypeIcon = t.transaction_type === 'credits' ? CreditCard : Shield;
                return (
                  <div
                    key={t.id}
                    className="group relative rounded-2xl overflow-hidden p-4
                      bg-white/[0.025] hover:bg-white/[0.04]
                      shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_14px_28px_-22px_rgba(0,0,0,0.55)]
                      transition-colors duration-200"
                  >
                    <div
                      className={`absolute inset-0 pointer-events-none ${
                        isMod
                          ? 'bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.07),transparent_60%)]'
                          : 'bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.06),transparent_60%)]'
                      }`}
                    />
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <Avatar className="h-10 w-10 ring-1 ring-white/[0.06]">
                          <AvatarImage src={t.user_avatar || ''} />
                          <AvatarFallback className="bg-white/[0.04] text-white/50">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[13px] font-medium text-white truncate">{t.user_name}</p>
                            {isMod && (
                              <span className="text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20">
                                Moderador
                              </span>
                            )}
                            <span className="text-[10px] text-white/35">· {formatDate(t.completed_at)}</span>
                          </div>
                          <p className="text-[11px] text-white/40 truncate mt-0.5">{t.user_email}</p>

                          <div className="mt-2 flex items-center gap-3 flex-wrap text-[11px] text-white/55">
                            <span className="inline-flex items-center gap-1.5">
                              <TypeIcon className="h-3 w-3 text-white/45" />
                              <span className="text-white/75">{typeLabel}</span>
                            </span>

                            {t.transaction_type === 'credits' && (
                              <span>
                                <span className="text-white/40">Créditos </span>
                                <span className="text-white/80 tabular-nums">{t.credits_purchased ?? 0}</span>
                                {(t.bonus_credits ?? 0) > 0 && (
                                  <span className="text-emerald-300/90"> +{t.bonus_credits} bônus</span>
                                )}
                              </span>
                            )}

                            {(t.transaction_type === 'subscription' || t.transaction_type === 'moderator') && (
                              <span>
                                <span className="text-white/40">Período </span>
                                <span className="text-white/80">30 dias</span>
                              </span>
                            )}

                            {isMod && t.moderator_name && (
                              <span className="inline-flex items-center gap-1">
                                <Users className="h-3 w-3 text-amber-300/80" />
                                <span className="text-white/40">Recebido por </span>
                                <span className="text-white/80">{t.moderator_name}</span>
                              </span>
                            )}
                          </div>

                          {t.payment_id && (
                            <p className="text-[10px] text-white/25 mt-1.5 font-mono truncate">
                              {t.payment_id}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[17px] font-light tracking-tight text-white tabular-nums">
                          {formatCurrency(t.total_amount)}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-300/70 mt-0.5">
                          Recebido
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
