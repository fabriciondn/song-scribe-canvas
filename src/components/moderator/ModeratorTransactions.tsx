import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { moderatorTransactionService } from '@/services/moderatorTransactionService';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Coins, TrendingUp, Users, FileText, DollarSign, Music } from 'lucide-react';

const PRICE_PER_CREDIT = 30; // R$30 por crédito
const PRICE_PER_REGISTRATION = 30; // R$30 por registro de obra

export const ModeratorTransactions = () => {
  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['moderator-transactions'],
    queryFn: moderatorTransactionService.getModeratorTransactions,
  });

  // Buscar usuários gerenciados pelo moderador
  const { data: managedUsers = [] } = useQuery({
    queryKey: ['moderator-managed-users-ids'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('moderator_users')
        .select('user_id')
        .eq('moderator_id', user.id);
      
      if (error) {
        console.error('Erro ao buscar usuários gerenciados:', error);
        return [];
      }
      
      return data?.map(u => u.user_id) || [];
    },
  });

  // Buscar registros de obras dos usuários gerenciados
  const { data: registrations = [], isLoading: loadingRegistrations } = useQuery({
    queryKey: ['moderator-user-registrations', managedUsers],
    queryFn: async () => {
      if (managedUsers.length === 0) return [];
      
      const { data, error } = await supabase
        .from('author_registrations')
        .select(`
          id,
          title,
          author,
          user_id,
          created_at,
          status
        `)
        .in('user_id', managedUsers)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar registros:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: managedUsers.length > 0,
  });

  // Buscar nomes dos usuários para exibição
  const { data: userProfiles = {} } = useQuery({
    queryKey: ['moderator-user-profiles', managedUsers],
    queryFn: async () => {
      if (managedUsers.length === 0) return {};
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, artistic_name')
        .in('id', managedUsers);
      
      if (error) {
        console.error('Erro ao buscar perfis:', error);
        return {};
      }
      
      const profilesMap: Record<string, { name: string; email: string; artistic_name: string }> = {};
      data?.forEach(p => {
        profilesMap[p.id] = { 
          name: p.name || 'Sem nome', 
          email: p.email || '',
          artistic_name: p.artistic_name || ''
        };
      });
      
      return profilesMap;
    },
    enabled: managedUsers.length > 0,
  });

  const isLoading = loadingTransactions || loadingRegistrations;

  // Calcular estatísticas
  const totalCreditsDistributed = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const uniqueUsers = new Set([
    ...transactions.map(t => t.user_id),
    ...registrations.map(r => r.user_id)
  ]).size;
  
  // Faturamento total
  const revenueFromCredits = totalCreditsDistributed * PRICE_PER_CREDIT;
  const revenueFromRegistrations = registrations.length * PRICE_PER_REGISTRATION;
  const totalRevenue = revenueFromCredits + revenueFromRegistrations;

  // Combinar transações e registros em uma lista unificada
  const allTransactions = [
    ...transactions.map(t => ({
      id: t.id,
      type: 'credit' as const,
      description: t.description,
      user_id: t.user_id,
      user_name: userProfiles[t.user_id]?.name || 'Usuário',
      amount: Number(t.amount),
      value: Number(t.amount) * PRICE_PER_CREDIT,
      created_at: t.created_at,
    })),
    ...registrations.map(r => ({
      id: r.id,
      type: 'registration' as const,
      description: `Registro de obra: ${r.title}`,
      user_id: r.user_id,
      user_name: userProfiles[r.user_id]?.name || r.author,
      amount: 1,
      value: PRICE_PER_REGISTRATION,
      created_at: r.created_at,
      status: r.status,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-32"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Transações e Faturamento</h2>
        <p className="text-muted-foreground">
          Histórico de créditos distribuídos e registros de obras
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Créditos
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCreditsDistributed}</div>
            <p className="text-xs text-muted-foreground">
              R$ {revenueFromCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Obras Registradas
            </CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registrations.length}</div>
            <p className="text-xs text-muted-foreground">
              R$ {revenueFromRegistrations.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuários Atendidos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">
              Usuários únicos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Total Faturado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.length} transações + {registrations.length} registros
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de valores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resumo de Faturamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Créditos distribuídos ({totalCreditsDistributed} x R$30)</span>
              <span className="font-medium">R$ {revenueFromCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Registros de obras ({registrations.length} x R$30)</span>
              <span className="font-medium">R$ {revenueFromRegistrations.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center py-2 text-lg font-bold">
              <span>Total Faturado</span>
              <span className="text-primary">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de todas as transações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Completo</CardTitle>
        </CardHeader>
        <CardContent>
          {allTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Badge variant={transaction.type === 'credit' ? 'default' : 'secondary'}>
                          {transaction.type === 'credit' ? (
                            <><Coins className="h-3 w-3 mr-1" /> Crédito</>
                          ) : (
                            <><Music className="h-3 w-3 mr-1" /> Registro</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell>{transaction.user_name}</TableCell>
                      <TableCell>
                        {transaction.type === 'credit' ? (
                          <span className="text-green-500">+{transaction.amount} créditos</span>
                        ) : (
                          <span>1 obra</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {transaction.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
