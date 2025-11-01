import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  Users, 
  MousePointer, 
  Target,
  Calendar,
  Award,
  UserPlus,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAffiliate } from '@/hooks/useAffiliate';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ReferredUser {
  name: string;
  email: string;
  conversion_date: string;
  commission_amount: number | null;
  commission_status: string | null;
  has_registered_works: boolean;
  registered_works_count: number;
}

export const AffiliateMetrics = () => {
  const { affiliate, stats, refreshData } = useAffiliate();
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  
  // Atualizar dados a cada 10 segundos para mostrar em tempo real
  // Buscar usuários indicados (🆕 AGORA POR CLIQUES CONVERTIDOS)
  useEffect(() => {
    const loadReferredUsers = async () => {
      if (!affiliate?.id) {
        console.log('❌ Affiliate ID não disponível');
        return;
      }

      console.log('🔍 Buscando usuários indicados para affiliate_id:', affiliate.id);

      // 🆕 Buscar cliques convertidos (usuários que clicaram no link E se cadastraram)
      const { data: clicks, error } = await supabase
        .from('affiliate_clicks')
        .select('user_id, created_at')
        .eq('affiliate_id', affiliate.id)
        .eq('converted', true)
        .not('user_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar cliques:', error);
        return;
      }

      if (!clicks || clicks.length === 0) {
        console.log('⚠️ Nenhum clique convertido encontrado');
        setReferredUsers([]);
        return;
      }

      console.log(`✅ ${clicks.length} cliques convertidos encontrados`);

      // Para cada clique, buscar dados do perfil, comissões e obras registradas
      const usersData = await Promise.all(
        clicks.map(async (click) => {
          // Buscar perfil
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', click.user_id)
            .single();

          // Buscar comissões
          const { data: commissions } = await supabase
            .from('affiliate_commissions')
            .select('amount, status')
            .eq('affiliate_id', affiliate.id)
            .eq('user_id', click.user_id);

          const totalCommission = commissions?.reduce((acc, c) => acc + Number(c.amount), 0) || 0;
          const hasPaidCommission = commissions?.some(c => c.status === 'paid') || false;

          // Buscar obras registradas
          const { count: worksCount } = await supabase
            .from('author_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', click.user_id)
            .eq('status', 'registered');

          return {
            name: profile?.name || 'Sem nome',
            email: profile?.email || 'Sem email',
            conversion_date: click.created_at,
            commission_amount: totalCommission,
            commission_status: hasPaidCommission ? 'paid' : (worksCount || 0) > 0 ? 'pending' : 'none',
            has_registered_works: (worksCount || 0) > 0,
            registered_works_count: worksCount || 0
          };
        })
      );

      console.log('✅ Total de usuários processados:', usersData.length);
      setReferredUsers(usersData);
    };

    loadReferredUsers();
  }, [affiliate?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshData]);

  if (!stats || !affiliate) {
    return <div>Carregando métricas...</div>;
  }

  const getLevelProgress = () => {
    if (affiliate.level === 'bronze') {
      return {
        current: affiliate.total_registrations,
        target: 5,
        nextLevel: 'Silver',
        description: 'registros para desbloquear 50% de comissão'
      };
    } else if (affiliate.level === 'silver') {
      return {
        current: affiliate.total_registrations,
        target: 100,
        nextLevel: 'Gold',
        description: 'registros para desbloquear comissões recorrentes'
      };
    } else {
      return {
        current: affiliate.total_registrations,
        target: affiliate.total_registrations,
        nextLevel: 'Máximo',
        description: 'Parabéns! Você atingiu o nível máximo'
      };
    }
  };

  const levelProgress = getLevelProgress();
  const progressPercentage = (levelProgress.current / levelProgress.target) * 100;

  return (
    <div className="space-y-6 px-2">
      {/* Progresso do Nível */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Progresso do Nível
          </CardTitle>
          <CardDescription>
            Sua evolução no programa de parceiros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold">{affiliate.level.toUpperCase()}</div>
              <div className="text-sm text-muted-foreground">
                {levelProgress.current} de {levelProgress.target} {levelProgress.description}
              </div>
            </div>
            <Badge variant="outline">
              Próximo: {levelProgress.nextLevel}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques Totais</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_clicks}</div>
            <p className="text-xs text-muted-foreground">
              Links de parceiro acessados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_conversions}</div>
            <p className="text-xs text-muted-foreground">
              Registros + Assinaturas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversion_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_clicks > 0 ? 'Ótima performance!' : 'Comece a divulgar'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros Autorais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registrations_count}</div>
            <p className="text-xs text-muted-foreground">
              Obras registradas através do seu link
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscriptions_count}</div>
            <p className="text-xs text-muted-foreground">
              {affiliate.level === 'gold' ? 'Gerando comissão recorrente' : 'Disponível no nível Gold'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.this_month_earnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Ganhos em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-300">Ganho Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              R$ {((affiliate?.total_earnings || 0) + (affiliate?.total_paid || 0)).toFixed(2)}
            </div>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              Desde o início do programa
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-300">A Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
              R$ {(affiliate?.total_earnings || 0).toFixed(2)}
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              Comissões pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-300">Já Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              R$ {(affiliate?.total_paid || 0).toFixed(2)}
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Total de comissões pagas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* NOVA SEÇÃO: Meus Indicados */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Meus Indicados
          </CardTitle>
          <CardDescription>
            Usuários que se cadastraram através do seu link de parceiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum indicado ainda</p>
              <p className="text-sm mt-1">Compartilhe seu link para começar a ganhar comissões</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead>Obras Registradas</TableHead>
                    <TableHead>Comissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referredUsers.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {new Date(user.conversion_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {user.has_registered_works ? (
                          <Badge variant="default" className="bg-green-600">
                            {user.registered_works_count} {user.registered_works_count === 1 ? 'obra' : 'obras'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Nenhuma obra</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.commission_amount ? (
                          <div className="flex items-center gap-2">
                            {user.commission_status === 'paid' ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-green-600 font-semibold">
                                  R$ {user.commission_amount.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 text-orange-600" />
                                <span className="text-orange-600 font-semibold">
                                  R$ {user.commission_amount.toFixed(2)}
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">Aguardando</Badge>
                        )}
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