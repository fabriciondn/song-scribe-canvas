import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp } from 'lucide-react';
import { moderatorTransactionService, ModeratorTransaction } from '@/services/moderatorTransactionService';
import { useAuth } from '@/hooks/useAuth';
import { useUserCredits } from '@/hooks/useUserCredits';

export const TransactionCard = () => {
  const [transactions, setTransactions] = useState<ModeratorTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { credits, refreshCredits } = useUserCredits();

  useEffect(() => {
    const loadUserTransactions = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const userTransactions = await moderatorTransactionService.getUserTransactions(user.id);
        setTransactions(userTransactions.slice(0, 3)); // Mostrar apenas as 3 mais recentes
        
        // Não forçar refresh dos créditos aqui para melhorar performance
        // O useUserCredits já cuida disso via realtime
      } catch (error) {
        console.error('Erro ao carregar transações:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserTransactions();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valores Lançados</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="text-2xl font-bold h-8 bg-muted rounded mb-2"></div>
            <div className="text-xs text-muted-foreground h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Valores Lançados</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-600">
          {formatCurrency(credits || 0)}
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {credits || 0} crédito{(credits || 0) !== 1 ? 's' : ''} disponível{(credits || 0) !== 1 ? 'is' : ''}
        </p>
        
        {transactions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Recentes:</p>
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center text-xs">
                <span className="truncate max-w-[120px]" title={transaction.description}>
                  {transaction.description}
                </span>
                <div className="text-right">
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {formatCurrency(Number(transaction.amount))}
                  </Badge>
                  <p className="text-muted-foreground text-[10px] mt-1">
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};