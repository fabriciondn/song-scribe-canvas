import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Calendar, 
  Users, 
  CreditCard,
  Filter,
  Download
} from 'lucide-react';
import { useAffiliate } from '@/hooks/useAffiliate';

export const AffiliateCommissions = () => {
  const { commissions, stats } = useAffiliate();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pendente' },
      approved: { variant: 'default' as const, label: 'Aprovada' },
      paid: { variant: 'outline' as const, label: 'Paga' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelada' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      author_registration: { label: 'Registro Autoral', color: 'bg-blue-100 text-blue-800' },
      subscription_recurring: { label: 'Assinatura Recorrente', color: 'bg-green-100 text-green-800' }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig];
    return (
      <Badge variant="outline" className={config?.color}>
        {config?.label || type}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Acumulado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats?.total_earnings.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Desde o início
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {stats?.pending_earnings.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Processamento em 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Já Recebido</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats?.paid_earnings.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamentos realizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats?.this_month_earnings.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Histórico de Comissões</h2>
          <p className="text-muted-foreground">
            Acompanhe todas suas comissões e pagamentos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtrar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Lista de Comissões */}
      {commissions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma comissão ainda</h3>
            <p className="text-muted-foreground">
              Suas comissões aparecerão aqui quando você começar a indicar usuários
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Todas as Comissões</CardTitle>
            <CardDescription>
              {commissions.length} comissão{commissions.length !== 1 ? 'ões' : ''} registrada{commissions.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {commissions.map((commission) => (
                <div
                  key={commission.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      {getTypeBadge(commission.type)}
                      {getStatusBadge(commission.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(commission.created_at)}
                    </div>
                    {commission.processed_at && (
                      <div className="text-xs text-muted-foreground">
                        Processada em: {formatDate(commission.processed_at)}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold">
                      R$ {Number(commission.amount).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {commission.commission_rate}% de comissão
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona o Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Cronograma de Pagamentos</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Comissões são processadas semanalmente</li>
                <li>• Pagamentos realizados toda sexta-feira</li>
                <li>• Valor mínimo para saque: R$ 50,00</li>
                <li>• Prazo para compensação: 1-3 dias úteis</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Métodos de Pagamento</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• PIX (instantâneo)</li>
                <li>• Transferência bancária (1-3 dias)</li>
                <li>• Crédito na conta Compuse</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Dica</h4>
            <p className="text-sm text-blue-700">
              Configure seus dados bancários no perfil para receber pagamentos automáticos.
              Sem dados bancários, o valor fica disponível como crédito na plataforma.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};