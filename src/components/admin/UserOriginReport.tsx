import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, Link, PieChart } from 'lucide-react';

interface OriginStats {
  total: number;
  byAffiliate: number;
  byModerator: number;
  direct: number;
  percentages: {
    affiliate: number;
    moderator: number;
    direct: number;
  };
}

async function getUserOriginStats(): Promise<OriginStats> {
  // Total de usuários
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Usuários por afiliado (conversões)
  const { count: affiliateUsers } = await supabase
    .from('affiliate_conversions')
    .select('*', { count: 'exact', head: true });

  // Usuários criados por moderador
  const { count: moderatorUsers } = await supabase
    .from('moderator_users')
    .select('*', { count: 'exact', head: true });

  const total = totalUsers || 0;
  const byAffiliate = affiliateUsers || 0;
  const byModerator = moderatorUsers || 0;
  const direct = total - byAffiliate - byModerator;

  return {
    total,
    byAffiliate,
    byModerator,
    direct,
    percentages: {
      affiliate: total > 0 ? (byAffiliate / total) * 100 : 0,
      moderator: total > 0 ? (byModerator / total) * 100 : 0,
      direct: total > 0 ? (direct / total) * 100 : 0,
    }
  };
}

export const UserOriginReport: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-origin-stats'],
    queryFn: getUserOriginStats,
    refetchInterval: 30000, // Atualizar a cada 30s
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Origem dos Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Origem dos Usuários
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Total */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
            </div>
          </div>

          {/* Gráfico Visual */}
          <div className="space-y-3">
            {/* Por Afiliado */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium">Por Afiliado</span>
                </div>
                <div className="text-sm font-bold">
                  {stats?.byAffiliate || 0} ({stats?.percentages.affiliate.toFixed(1)}%)
                </div>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${stats?.percentages.affiliate || 0}%` }}
                />
              </div>
            </div>

            {/* Por Moderador */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium">Por Moderador</span>
                </div>
                <div className="text-sm font-bold">
                  {stats?.byModerator || 0} ({stats?.percentages.moderator.toFixed(1)}%)
                </div>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${stats?.percentages.moderator || 0}%` }}
                />
              </div>
            </div>

            {/* Cadastro Direto */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium">Cadastro Direto</span>
                </div>
                <div className="text-sm font-bold">
                  {stats?.direct || 0} ({stats?.percentages.direct.toFixed(1)}%)
                </div>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-500"
                  style={{ width: `${stats?.percentages.direct || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="pt-4 border-t space-y-2">
            <p className="text-xs text-muted-foreground">
              <strong>Por Afiliado:</strong> Usuários que se cadastraram via link de parceiro
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Por Moderador:</strong> Usuários criados manualmente por moderadores
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Cadastro Direto:</strong> Usuários que se registraram normalmente na plataforma
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
