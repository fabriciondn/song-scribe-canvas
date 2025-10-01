import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  Music,
  Edit,
  Users,
  FileText,
  Folder,
  Hash,
  Volume2,
  Search,
  Download,
  RefreshCw,
  Clock,
  User as UserIcon,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  metadata: any;
  timestamp: string;
  ip_address?: string;
  profiles?: {
    name: string;
    artistic_name: string;
    avatar_url: string;
    email: string;
  };
}

export const AdminLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-activity-logs'],
    queryFn: async () => {
      const { data: logs, error: logsError } = await supabase
        .from('user_activity_logs')
        .select('id, user_id, action, metadata, timestamp, ip_address')
        .order('timestamp', { ascending: false })
        .limit(200);

      if (logsError) throw logsError;
      if (!logs) return [];

      // Buscar perfis dos usuários
      const userIds = [...new Set(logs.map(log => log.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, artistic_name, avatar_url, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Mapear perfis para logs
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return logs.map(log => ({
        ...log,
        profiles: profilesMap.get(log.user_id)
      })) as ActivityLog[];
    },
    refetchInterval: 30000,
  });

  const filteredActivities = activities.filter(activity => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const userName = activity.profiles?.name?.toLowerCase() || '';
    const artisticName = activity.profiles?.artistic_name?.toLowerCase() || '';
    const email = activity.profiles?.email?.toLowerCase() || '';
    const action = activity.action?.toLowerCase() || '';
    
    return userName.includes(searchLower) || 
           artisticName.includes(searchLower) || 
           email.includes(searchLower) ||
           action.includes(searchLower);
  });

  const getActivityIcon = (action: string) => {
    if (action.includes('song') || action.includes('música')) return <Music className="h-4 w-4 text-blue-500" />;
    if (action.includes('draft') || action.includes('rascunho')) return <Edit className="h-4 w-4 text-orange-500" />;
    if (action.includes('partnership') || action.includes('parceria')) return <Users className="h-4 w-4 text-purple-500" />;
    if (action.includes('registration') || action.includes('registro')) return <FileText className="h-4 w-4 text-green-500" />;
    if (action.includes('folder') || action.includes('pasta')) return <Folder className="h-4 w-4 text-yellow-500" />;
    if (action.includes('cifrador')) return <Hash className="h-4 w-4 text-cyan-500" />;
    if (action.includes('base')) return <Volume2 className="h-4 w-4 text-pink-500" />;
    if (action.includes('login')) return <UserIcon className="h-4 w-4 text-teal-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getActivityDescription = (activity: ActivityLog) => {
    const metadata = activity.metadata || {};
    
    switch (activity.action) {
      case 'song_created':
        return `Nova música criada: ${metadata.title || 'Sem título'}`;
      case 'draft_created':
        return `Novo rascunho criado: ${metadata.title || 'Sem título'}`;
      case 'partnership_created':
        return `Nova parceria criada: ${metadata.title || 'Sem título'}`;
      case 'author_registration_submitted':
        return `Obra registrada: ${metadata.title || 'Registro autoral'}`;
      case 'folder_created':
        return `Nova pasta criada: ${metadata.name || 'Sem nome'}`;
      case 'user_login':
        return 'Usuário fez login no sistema';
      case 'user_logout':
        return 'Usuário saiu do sistema';
      case 'profile_updated':
        return 'Perfil atualizado';
      case 'credits_updated':
        return `Créditos atualizados: ${metadata.oldCredits || 0} → ${metadata.newCredits || 0}`;
      case 'public_registration_submitted':
        return 'Novo cadastro público realizado';
      default:
        return activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), "dd/MM/yyyy, HH:mm:ss");
  };

  const exportLogs = () => {
    const csvContent = [
      ['Data/Hora', 'Ação', 'Usuário', 'Email', 'IP'].join(','),
      ...filteredActivities.map(activity => [
        formatTimestamp(activity.timestamp),
        activity.action,
        activity.profiles?.name || 'N/A',
        activity.profiles?.email || 'N/A',
        activity.ip_address || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atividades-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 px-1 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Atividades Recentes</h2>
          <p className="text-sm text-muted-foreground">
            Últimas ações realizadas na plataforma
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Pesquisar por usuário, ação ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Últimas Ações Realizadas na Plataforma
          </CardTitle>
          <CardDescription>
            Todas as atividades dos usuários em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ScrollArea className="h-[700px]">
              <div className="space-y-2">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.action)}
                    </div>

                    {/* User Avatar */}
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={activity.profiles?.avatar_url} />
                      <AvatarFallback>
                        {activity.profiles?.name?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium break-words">
                        {getActivityDescription(activity)}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="font-medium">
                          por {activity.profiles?.name || activity.profiles?.artistic_name || 'Usuário'}
                        </span>
                        {activity.profiles?.email && (
                          <span>• {activity.profiles.email}</span>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredActivities.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      {searchTerm 
                        ? 'Nenhuma atividade encontrada com o filtro aplicado' 
                        : 'Nenhuma atividade recente'
                      }
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};