import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign } from 'lucide-react';
import { moderatorTransactionService, ModeratorTransaction } from '@/services/moderatorTransactionService';
import { useToast } from '@/hooks/use-toast';

interface UserTransactionsListProps {
  userId: string;
  userName: string;
  refreshTrigger?: number;
}

export const UserTransactionsList = ({ userId, userName, refreshTrigger }: UserTransactionsListProps) => {
  const [transactions, setTransactions] = useState<ModeratorTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const userTransactions = await moderatorTransactionService.getUserTransactions(userId);
      const transactionTotal = await moderatorTransactionService.getUserTransactionTotal(userId);
      
      setTransactions(userTransactions);
      setTotal(transactionTotal);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar transações',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [userId, refreshTrigger]);

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Transações de {userName}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Transações de {userName}</span>
          </div>
          <Badge variant="secondary" className="text-lg font-bold">
            Total: {formatCurrency(total)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma transação encontrada
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{transaction.description}</p>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(transaction.created_at)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatCurrency(Number(transaction.amount))}
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