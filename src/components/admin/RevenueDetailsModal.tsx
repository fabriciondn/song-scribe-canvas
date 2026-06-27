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
import { CreditCard, User } from 'lucide-react';

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

  const total = useMemo(
    () => filtered.reduce((acc, t) => acc + Number(t.total_amount || 0), 0),
    [filtered]
  );

  const FilterBtn: React.FC<{ value: Filter; label: string }> = ({ value, label }) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
        filter === value
          ? 'bg-white/[0.08] text-white'
          : 'bg-white/[0.02] text-white/55 hover:text-white/80'
      }`}
    >
      {label}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Detalhes do Faturamento</DialogTitle>
          <DialogDescription>
            Transações via Mercado Pago, OpenPix e moderadores
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between flex-wrap gap-2 pb-2">
          <div className="flex items-center gap-2">
            <FilterBtn value="all" label="Todos" />
            <FilterBtn value="with_mod" label="Com moderadores" />
            <FilterBtn value="without_mod" label="Sem moderadores" />
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground mr-2">Total:</span>
            <span className="font-semibold text-emerald-500">{formatCurrency(total)}</span>
          </div>
        </div>

        
        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <CreditCard className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={transaction.user_avatar || ''} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">
                            {transaction.user_name}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(transaction.completed_at)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground truncate">
                          {transaction.user_email}
                        </p>
                        
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Serviço: </span>
                          <span className="font-medium">
                            {transaction.transaction_type === 'credits' 
                              ? 'Compra de Créditos' 
                              : `Assinatura ${transaction.subscription_plan?.toUpperCase()}`}
                          </span>
                        </div>
                        
                        {transaction.transaction_type === 'credits' && (
                          <div>
                            <span className="text-muted-foreground">Créditos: </span>
                            <span className="font-medium">
                              {transaction.credits_purchased ?? 0}
                              {(transaction.bonus_credits ?? 0) > 0 && (
                                <span className="text-green-600 dark:text-green-400">
                                  {' '}+{transaction.bonus_credits ?? 0} bônus
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        
                        {transaction.transaction_type === 'subscription' && (
                          <div>
                            <span className="text-muted-foreground">Período: </span>
                            <span className="font-medium">30 dias</span>
                          </div>
                        )}
                      </div>
                        
                        {transaction.payment_id && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ID: {transaction.payment_id}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(transaction.total_amount)}
                      </p>
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
