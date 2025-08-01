import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  Search, 
  Filter, 
  Download,
  RefreshCw,
  Clock,
  User,
  Activity
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  user_id?: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
}

export const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Gerar logs simulados para demonstração
  const generateMockLogs = (): LogEntry[] => {
    const actions = [
      'User login',
      'User logout', 
      'Song created',
      'Draft saved',
      'Partnership created',
      'Registration submitted',
      'Template created',
      'Folder created',
      'Credits updated',
      'Profile updated'
    ];

    const levels: LogEntry['level'][] = ['info', 'warning', 'error', 'success'];
    const mockLogs: LogEntry[] = [];

    for (let i = 0; i < 50; i++) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - i * 5);
      
      mockLogs.push({
        id: `log-${i}`,
        timestamp: now.toISOString(),
        level: levels[Math.floor(Math.random() * levels.length)],
        message: `${actions[Math.floor(Math.random() * actions.length)]} completed ${i > 30 ? 'with issues' : 'successfully'}`,
        user_id: `user-${Math.floor(Math.random() * 100)}`,
        action: actions[Math.floor(Math.random() * actions.length)],
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 Chrome/91.0'
      });
    }

    return mockLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  useEffect(() => {
    const loadLogs = () => {
      // Em uma implementação real, você buscaria os logs do Supabase
      const mockLogs = generateMockLogs();
      setLogs(mockLogs);
      setFilteredLogs(mockLogs);
      setIsLoading(false);
    };

    loadLogs();

    // Auto-refresh dos logs
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadLogs, 30000); // Atualiza a cada 30 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  useEffect(() => {
    let filtered = logs;

    // Filtrar por nível
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, selectedLevel]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const variants = {
      error: 'destructive',
      warning: 'secondary',
      success: 'default',
      info: 'outline'
    };
    
    return (
      <Badge variant={variants[level as keyof typeof variants] as any}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Level', 'Action', 'Message', 'User ID', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.level,
        log.action,
        `"${log.message}"`,
        log.user_id || '',
        log.ip_address || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const levelCounts = logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas dos Logs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Erros</p>
                <p className="text-2xl font-bold text-red-900">{levelCounts.error || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Avisos</p>
                <p className="text-2xl font-bold text-yellow-900">{levelCounts.warning || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Sucessos</p>
                <p className="text-2xl font-bold text-green-900">{levelCounts.success || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Informações</p>
                <p className="text-2xl font-bold text-blue-900">{levelCounts.info || 0}</p>
              </div>
              <Info className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel Principal de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Logs do Sistema
          </CardTitle>
          <CardDescription>
            Monitoramento em tempo real das atividades da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controles de Filtro */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Pesquisar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">Todos os níveis</option>
                <option value="error">Erros</option>
                <option value="warning">Avisos</option>
                <option value="success">Sucessos</option>
                <option value="info">Informações</option>
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto-refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportLogs}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Lista de Logs */}
          <ScrollArea className="h-[600px] rounded-md border">
            <div className="p-4 space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getLevelIcon(log.level)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getLevelBadge(log.level)}
                          <span className="text-sm font-medium">{log.action}</span>
                        </div>
                        <p className="text-sm text-muted-foreground break-words">
                          {log.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(log.timestamp)}
                          </div>
                          {log.user_id && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.user_id}
                            </div>
                          )}
                          {log.ip_address && (
                            <span>{log.ip_address}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredLogs.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm || selectedLevel !== 'all' 
                      ? 'Nenhum log encontrado com os filtros aplicados' 
                      : 'Nenhum log disponível'
                    }
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};