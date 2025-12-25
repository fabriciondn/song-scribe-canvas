import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Shield, Edit, Mic, Users, Clock, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'registration' | 'edit' | 'recording' | 'partnership';
  title: string;
  description: string;
  timestamp: Date;
}

const activityIcons = {
  registration: { icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/20' },
  edit: { icon: Edit, color: 'text-blue-500', bg: 'bg-blue-500/20' },
  recording: { icon: Mic, color: 'text-orange-500', bg: 'bg-orange-500/20' },
  partnership: { icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/20' },
};

export const RecentActivity: React.FC = () => {
  const user = useCurrentUser();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['recent-activity', user?.id],
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!user?.id) return [];

      // Buscar atividades de diferentes tabelas
      const [registrations, drafts, partnerships] = await Promise.all([
        supabase
          .from('author_registrations')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('drafts')
          .select('id, title, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(3),
        supabase
          .from('partnerships')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2),
      ]);

      const items: ActivityItem[] = [];

      registrations.data?.forEach(reg => {
        items.push({
          id: reg.id,
          type: 'registration',
          title: 'Obra registrada',
          description: reg.title,
          timestamp: new Date(reg.created_at),
        });
      });

      drafts.data?.forEach(draft => {
        items.push({
          id: draft.id,
          type: 'edit',
          title: 'Composição editada',
          description: draft.title,
          timestamp: new Date(draft.updated_at),
        });
      });

      partnerships.data?.forEach(partnership => {
        items.push({
          id: partnership.id,
          type: 'partnership',
          title: 'Parceria criada',
          description: partnership.title,
          timestamp: new Date(partnership.created_at),
        });
      });

      // Ordenar por data mais recente
      return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhuma atividade recente</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link to="/composer">Começar a compor</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Atividade Recente
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
            <Link to="/dashboard/registered-works">
              Ver tudo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => {
            const { icon: IconComponent, color, bg } = activityIcons[activity.type];
            return (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
              >
                <div className={`p-2.5 rounded-xl ${bg} group-hover:scale-110 transition-transform`}>
                  <IconComponent className={`h-4 w-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{activity.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
