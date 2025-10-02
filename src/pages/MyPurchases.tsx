
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserTransactions } from '@/hooks/useUserTransactions';
import { CreditCard, RefreshCw, Search, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyPurchases() {
  const { transactions, isLoading, refetch, getStatusBadge, formatCurrency, formatDate } = useUserTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.payment_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Minhas Compras</h1>
        </div>
        
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Minhas Compras</h1>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID do pagamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma compra encontrada</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros para encontrar suas transações.'
                : 'Você ainda não realizou nenhuma compra de créditos.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4 font-medium">Data</th>
                        <th className="p-4 font-medium">ID Pagamento</th>
                        <th className="p-4 font-medium">Tipo</th>
                        <th className="p-4 font-medium">Valor</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Método</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => {
                        const statusInfo = getStatusBadge(transaction.status);
                        return (
                          <tr key={transaction.id} className="border-b hover:bg-muted/50">
                            <td className="p-4">{formatDate(transaction.created_at)}</td>
                            <td className="p-4 font-mono text-sm">{transaction.payment_id}</td>
                            <td className="p-4">
                              {transaction.transaction_type === 'subscription' ? (
                                <div className="flex flex-col">
                                  <span className="font-medium">Assinatura {transaction.plan_type === 'pro' ? 'Pro' : 'Trial'}</span>
                                  <span className="text-xs text-muted-foreground">Recorrente</span>
                                </div>
                              ) : (
                                <div className="flex flex-col">
                                  <span className="font-medium">{transaction.total_credits} créditos</span>
                                  {transaction.bonus_credits > 0 && (
                                    <span className="text-xs text-green-600">
                                      +{transaction.bonus_credits} bônus
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-4 font-medium">{formatCurrency(transaction.amount)}</td>
                            <td className="p-4">
                              <Badge className={`${statusInfo.color} text-white`}>
                                {statusInfo.text}
                              </Badge>
                            </td>
                            <td className="p-4">{transaction.payment_method}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredTransactions.map((transaction) => {
              const statusInfo = getStatusBadge(transaction.status);
              return (
                <Card key={transaction.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                      <Badge className={`${statusInfo.color} text-white`}>
                        {statusInfo.text}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tipo:</span>
                        {transaction.transaction_type === 'subscription' ? (
                          <div className="text-right">
                            <span className="text-sm font-medium">Assinatura {transaction.plan_type === 'pro' ? 'Pro' : 'Trial'}</span>
                            <span className="text-xs text-muted-foreground block">Recorrente</span>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="text-sm font-medium">{transaction.total_credits} créditos</span>
                            {transaction.bonus_credits > 0 && (
                              <span className="text-xs text-green-600 ml-1">
                                (+{transaction.bonus_credits} bônus)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Método:</span>
                        <span className="text-sm">{transaction.payment_method}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">ID:</span>
                        <span className="text-xs font-mono">{transaction.payment_id}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
