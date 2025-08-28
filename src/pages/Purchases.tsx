
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, Download, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CreditTransaction {
  id: string;
  credits_purchased: number;
  bonus_credits: number;
  unit_price: number;
  total_amount: number;
  payment_id: string;
  payment_provider: string;
  status: string;
  created_at: string;
}

export default function Purchases() {
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['credit-transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CreditTransaction[];
    },
    enabled: !!user?.id
  });

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Pago</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Minhas Compras</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Minhas Compras</h1>
          <p className="text-muted-foreground">
            Histórico completo de suas compras de créditos
          </p>
        </div>
      </div>

      {!transactions || transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma compra encontrada</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Você ainda não realizou nenhuma compra de créditos.
            </p>
            <Button onClick={() => window.location.href = '/credits-checkout'}>
              <CreditCard className="w-4 h-4 mr-2" />
              Comprar Créditos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Compra de Créditos
                  </CardTitle>
                  {getStatusBadge(transaction.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Créditos</p>
                    <p className="font-semibold">
                      {transaction.credits_purchased}
                      {transaction.bonus_credits > 0 && (
                        <span className="text-green-600">
                          {' '}+ {transaction.bonus_credits} bônus
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-semibold">{formatCurrency(transaction.total_amount)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Data da Compra</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">ID do Pagamento</p>
                    <p className="font-mono text-xs">{transaction.payment_id}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Processado via {transaction.payment_provider}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
