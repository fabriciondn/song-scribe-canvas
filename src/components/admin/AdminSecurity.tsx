import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Key, 
  UserX, 
  Eye,
  Clock,
  Globe,
  Database,
  Activity
} from 'lucide-react';

interface SecurityAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

interface SuspiciousActivity {
  id: string;
  user_id: string;
  activity: string;
  ip_address: string;
  timestamp: string;
  risk_level: 'low' | 'medium' | 'high';
  location: string;
}

export const AdminSecurity: React.FC = () => {
  const [securityMetrics, setSecurityMetrics] = useState({
    totalLogins: 1247,
    failedLogins: 23,
    activeBlocks: 5,
    securityScore: 92,
    lastScan: '2025-01-31 14:30:00'
  });

  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([
    {
      id: '1',
      type: 'critical',
      title: 'Múltiplas tentativas de login falharam',
      description: 'IP 192.168.1.100 tentou fazer login com 5 usuários diferentes em 2 minutos',
      timestamp: '2025-01-31 15:45:00',
      resolved: false
    },
    {
      id: '2',
      type: 'warning',
      title: 'Acesso de localização incomum',
      description: 'Usuário admin@example.com fez login de um país diferente',
      timestamp: '2025-01-31 14:20:00',
      resolved: false
    },
    {
      id: '3',
      type: 'info',
      title: 'Atualização de segurança aplicada',
      description: 'Sistema atualizado com patches de segurança mais recentes',
      timestamp: '2025-01-31 12:00:00',
      resolved: true
    }
  ]);

  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([
    {
      id: '1',
      user_id: 'user-123',
      activity: 'Múltiplas tentativas de acesso a dados de outros usuários',
      ip_address: '203.45.67.89',
      timestamp: '2025-01-31 16:30:00',
      risk_level: 'high',
      location: 'São Paulo, Brasil'
    },
    {
      id: '2',
      user_id: 'user-456',
      activity: 'Download em massa de arquivos',
      ip_address: '192.168.1.50',
      timestamp: '2025-01-31 15:15:00',
      risk_level: 'medium',
      location: 'Rio de Janeiro, Brasil'
    },
    {
      id: '3',
      user_id: 'user-789',
      activity: 'Login fora do horário habitual',
      ip_address: '10.0.0.25',
      timestamp: '2025-01-31 03:22:00',
      risk_level: 'low',
      location: 'Brasília, Brasil'
    }
  ]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRiskBadge = (level: string) => {
    const variants = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    };
    
    return (
      <Badge variant={variants[level as keyof typeof variants] as any}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  const resolveAlert = (alertId: string) => {
    setSecurityAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  };

  const blockUser = (userId: string) => {
    console.log(`Bloqueando usuário: ${userId}`);
    // Implementar lógica de bloqueio
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Métricas de Segurança */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Score de Segurança</p>
                <p className={`text-2xl font-bold ${getSecurityScoreColor(securityMetrics.securityScore)}`}>
                  {securityMetrics.securityScore}%
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Logins Hoje</p>
                <p className="text-2xl font-bold text-blue-900">{securityMetrics.totalLogins}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Logins Falharam</p>
                <p className="text-2xl font-bold text-red-900">{securityMetrics.failedLogins}</p>
              </div>
              <UserX className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">IPs Bloqueados</p>
                <p className="text-2xl font-bold text-orange-900">{securityMetrics.activeBlocks}</p>
              </div>
              <Lock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Última Varredura</p>
                <p className="text-sm font-bold text-purple-900">
                  {new Date(securityMetrics.lastScan).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Alertas de Segurança
          </CardTitle>
          <CardDescription>
            Alertas críticos e avisos de segurança que requerem atenção
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {securityAlerts.filter(alert => !alert.resolved).map((alert) => (
            <Alert key={alert.id} variant={getAlertVariant(alert.type) as any}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  {getAlertIcon(alert.type)}
                  <div>
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription className="mt-1">
                      {alert.description}
                    </AlertDescription>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(alert.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolveAlert(alert.id)}
                >
                  Resolver
                </Button>
              </div>
            </Alert>
          ))}
          
          {securityAlerts.filter(alert => !alert.resolved).length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">Nenhum alerta de segurança ativo</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Atividades Suspeitas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Atividades Suspeitas
          </CardTitle>
          <CardDescription>
            Monitoramento de comportamentos anômalos dos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Atividade</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suspiciousActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.user_id}</TableCell>
                  <TableCell className="max-w-xs truncate">{activity.activity}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {activity.location}
                    </div>
                  </TableCell>
                  <TableCell>{activity.ip_address}</TableCell>
                  <TableCell>{getRiskBadge(activity.risk_level)}</TableCell>
                  <TableCell>
                    {new Date(activity.timestamp).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => blockUser(activity.user_id)}
                      >
                        Bloquear
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                      >
                        Investigar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Configurações de Segurança */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Políticas de Senha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Comprimento mínimo</span>
              <Badge variant="outline">8 caracteres</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Requer caracteres especiais</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <span>Requer números</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <span>Expiração de senha</span>
              <Badge variant="outline">90 dias</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Status de Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Último backup</span>
              <Badge variant="outline">31/01/2025 02:00</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Frequência</span>
              <Badge variant="outline">Diário</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Sucesso</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Próximo backup</span>
              <Badge variant="outline">01/02/2025 02:00</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};