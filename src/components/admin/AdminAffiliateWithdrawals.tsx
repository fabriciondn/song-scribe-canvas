import { useState } from 'react';
import { useAffiliateWithdrawals } from '@/hooks/useAffiliateWithdrawals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock, CheckCircle, XCircle, DollarSign, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AdminAffiliateWithdrawals = () => {
  const { withdrawals, stats, isLoading, approveWithdrawal, completePayment, rejectWithdrawal } =
    useAffiliateWithdrawals();

  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: any; icon: any }> = {
      pending: {
        label: 'Pendente',
        variant: 'default',
        icon: <Clock className="w-3 h-3 mr-1" />,
      },
      approved: {
        label: 'Aprovado',
        variant: 'secondary',
        icon: <AlertCircle className="w-3 h-3 mr-1" />,
      },
      paid: {
        label: 'Pago',
        variant: 'default',
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      },
      rejected: {
        label: 'Rejeitado',
        variant: 'destructive',
        icon: <XCircle className="w-3 h-3 mr-1" />,
      },
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const handleApprove = async (id: string) => {
    await approveWithdrawal(id);
  };

  const handleCompletePayment = async (id: string) => {
    await completePayment(id);
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) return;
    await rejectWithdrawal(selectedWithdrawal.id, rejectionReason);
    setShowRejectModal(false);
    setRejectionReason('');
    setSelectedWithdrawal(null);
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    const matchesSearch =
      w.affiliate?.profile?.[0]?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.affiliate?.profile?.[0]?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos (Mês)</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paidThisMonth}</div>
            <p className="text-xs text-muted-foreground">Processados este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Valor total pendente</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Saque</CardTitle>
          <CardDescription>Gerencie as solicitações de saque dos afiliados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Afiliado</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWithdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhuma solicitação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWithdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDistanceToNow(new Date(withdrawal.requested_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {withdrawal.affiliate?.profile?.[0]?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{withdrawal.affiliate?.profile?.[0]?.email || 'N/A'}</TableCell>
                      <TableCell className="font-medium">
                        R$ {Number(withdrawal.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="capitalize">{withdrawal.payment_method}</TableCell>
                      <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {withdrawal.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(withdrawal.id)}
                              >
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  setShowRejectModal(true);
                                }}
                              >
                                Rejeitar
                              </Button>
                            </>
                          )}
                          {withdrawal.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleCompletePayment(withdrawal.id)}
                            >
                              Concluir Pagamento
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setShowDetailsModal(true);
                            }}
                          >
                            Detalhes
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div>
                <Label>Afiliado</Label>
                <p className="text-sm">{selectedWithdrawal.affiliate?.profile?.[0]?.name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm">{selectedWithdrawal.affiliate?.profile?.[0]?.email}</p>
              </div>
              <div>
                <Label>Código de Afiliado</Label>
                <p className="text-sm font-mono">{selectedWithdrawal.affiliate?.affiliate_code}</p>
              </div>
              <div>
                <Label>Nível</Label>
                <p className="text-sm capitalize">{selectedWithdrawal.affiliate?.level}</p>
              </div>
              <div>
                <Label>Saldo Disponível</Label>
                <p className="text-sm">
                  R$ {Number(selectedWithdrawal.affiliate?.total_earnings || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <Label>Valor Solicitado</Label>
                <p className="text-sm font-bold">
                  R$ {Number(selectedWithdrawal.amount).toFixed(2)}
                </p>
              </div>
              <div>
                <Label>Método de Pagamento</Label>
                <p className="text-sm capitalize">{selectedWithdrawal.payment_method}</p>
              </div>
              <div>
                <Label>Dados de Pagamento</Label>
                <pre className="text-xs bg-muted p-2 rounded">
                  {JSON.stringify(selectedWithdrawal.payment_details, null, 2)}
                </pre>
              </div>
              {selectedWithdrawal.rejection_reason && (
                <div>
                  <Label>Motivo da Rejeição</Label>
                  <p className="text-sm text-destructive">
                    {selectedWithdrawal.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Rejeição */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. Esta informação será visível para o afiliado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo da Rejeição</Label>
              <Textarea
                placeholder="Digite o motivo..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
