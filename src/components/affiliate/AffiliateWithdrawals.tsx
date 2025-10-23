import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAffiliate } from '@/hooks/useAffiliate';
import { DollarSign, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface WithdrawalRequest {
  id: string;
  affiliate_id: string;
  amount: number;
  status: string;
  payment_method?: string;
  payment_details?: any;
  requested_at: string;
  processed_at?: string;
  rejection_reason?: string;
}

export const AffiliateWithdrawals = () => {
  const { affiliate, stats } = useAffiliate();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const minimumWithdrawal = 50; // R$ 50 mínimo
  const availableBalance = stats?.total_earnings || 0;

  useEffect(() => {
    if (affiliate?.id) {
      loadWithdrawals();
    }

    // Listener para mudanças nas solicitações (status updates)
    const channel = supabase
      .channel(`affiliate-withdrawals-${affiliate?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'affiliate_withdrawal_requests',
          filter: `affiliate_id=eq.${affiliate?.id}`,
        },
        (payload) => {
          console.log('Status de saque atualizado:', payload);
          
          // Recarregar lista
          loadWithdrawals();
          
          // Notificar se mudou para 'paid'
          if (payload.new && (payload.new as any).status === 'paid') {
            toast({
              title: "💰 Saque Concluído!",
              description: `Seu saque de R$ ${(payload.new as any).amount} foi processado com sucesso.`,
            });
          } else if (payload.new && (payload.new as any).status === 'approved') {
            toast({
              title: "✅ Saque Aprovado!",
              description: "Sua solicitação foi aprovada e está em processamento.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [affiliate]);

  const loadWithdrawals = async () => {
    if (!affiliate?.id) return;

    try {
      const { data, error } = await supabase
        .from('affiliate_withdrawal_requests')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar solicitações de saque",
        variant: "destructive"
      });
    }
  };

  const handleRequestWithdrawal = async () => {
    const withdrawalAmount = parseFloat(amount);

    if (!withdrawalAmount || withdrawalAmount < minimumWithdrawal) {
      toast({
        title: "Valor inválido",
        description: `O valor mínimo para saque é R$ ${minimumWithdrawal}`,
        variant: "destructive"
      });
      return;
    }

    if (withdrawalAmount > availableBalance) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não possui saldo suficiente para este saque",
        variant: "destructive"
      });
      return;
    }

    if (!paymentDetails.trim()) {
      toast({
        title: "Dados obrigatórios",
        description: "Por favor, informe os dados para pagamento",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('affiliate_withdrawal_requests')
        .insert({
          affiliate_id: affiliate?.id,
          amount: withdrawalAmount,
          payment_method: paymentMethod,
          payment_details: { details: paymentDetails }
        });

      if (error) throw error;

      toast({
        title: "Saque solicitado!",
        description: "Sua solicitação de saque foi enviada e será processada em até 3 dias úteis"
      });

      setAmount('');
      setPaymentDetails('');
      setShowRequestModal(false);
      loadWithdrawals();
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast({
        title: "Erro",
        description: "Erro ao solicitar saque",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      approved: { label: 'Aprovado', variant: 'default' as const, icon: CheckCircle },
      processing: { label: 'Processando', variant: 'default' as const, icon: AlertCircle },
      paid: { label: 'Pago', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle }
    };
    
    const statusConfig = config[status as keyof typeof config];
    const Icon = statusConfig?.icon;
    
    return (
      <Badge variant={statusConfig?.variant} className="flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {statusConfig?.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const pendingAmount = withdrawals
    .filter(w => ['pending', 'approved', 'processing'].includes(w.status))
    .reduce((sum, w) => sum + w.amount, 0);

  const paidAmount = withdrawals
    .filter(w => w.status === 'paid')
    .reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                <p className="text-2xl font-bold">R$ {availableBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Aguardando</p>
                <p className="text-2xl font-bold">R$ {pendingAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Já Recebido</p>
                <p className="text-2xl font-bold">R$ {paidAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-center">
            <Button
              onClick={() => setShowRequestModal(true)}
              disabled={availableBalance < minimumWithdrawal}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Solicitar Saque
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Valor Mínimo</h4>
              <p className="text-muted-foreground">R$ {minimumWithdrawal},00</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Prazo</h4>
              <p className="text-muted-foreground">Até 3 dias úteis</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Formas de Pagamento</h4>
              <p className="text-muted-foreground">PIX, Transferência Bancária</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Saques</CardTitle>
          <CardDescription>
            Acompanhe todas as suas solicitações de saque
          </CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma solicitação de saque ainda</p>
              <p className="text-sm">Faça sua primeira solicitação quando atingir o valor mínimo</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>{formatDate(withdrawal.requested_at)}</TableCell>
                    <TableCell className="font-medium">R$ {withdrawal.amount.toFixed(2)}</TableCell>
                    <TableCell className="capitalize">{withdrawal.payment_method}</TableCell>
                    <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                    <TableCell>
                      {withdrawal.processed_at ? formatDate(withdrawal.processed_at) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Request Withdrawal Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Saque</DialogTitle>
            <DialogDescription>
              Preencha os dados para solicitar o saque de suas comissões
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium">Saldo Disponível</p>
              <p className="text-2xl font-bold text-green-600">R$ {availableBalance.toFixed(2)}</p>
            </div>

            <div>
              <Label htmlFor="amount">Valor do Saque *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Mínimo R$ ${minimumWithdrawal}`}
                min={minimumWithdrawal}
                max={availableBalance}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Valor mínimo: R$ {minimumWithdrawal} | Máximo: R$ {availableBalance.toFixed(2)}
              </p>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="pix">PIX</option>
                <option value="transfer">Transferência Bancária</option>
              </select>
            </div>

            <div>
              <Label htmlFor="paymentDetails">
                Dados para Pagamento *
              </Label>
              <Textarea
                id="paymentDetails"
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                placeholder={
                  paymentMethod === 'pix' 
                    ? 'Chave PIX (CPF, email, telefone ou chave aleatória)'
                    : 'Banco, Agência, Conta Corrente, Nome do titular'
                }
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowRequestModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRequestWithdrawal}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Solicitando...' : 'Solicitar Saque'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};