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
  // Buscar usuários indicados pelo código do afiliado
  useEffect(() => {
    const loadReferredUsers = async () => {
      if (!affiliate?.affiliate_code) {
        console.log('❌ Affiliate code não disponível');
        return;
      }

      console.log('🔍 Buscando usuários indicados para código:', affiliate.affiliate_code);

      // Buscar perfis que têm o código do afiliado nas notas
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, email, created_at, moderator_notes')
        .ilike('moderator_notes', `%${affiliate.affiliate_code}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar perfis:', error);
        return;
      }

      if (!profiles || profiles.length === 0) {
        console.log('⚠️ Nenhum usuário indicado encontrado');
        setReferredUsers([]);
        return;
      }

      console.log(`✅ ${profiles.length} usuários indicados encontrados`);

      // Para cada perfil, buscar comissões e obras registradas
      const usersData = await Promise.all(
        profiles.map(async (profile) => {
          // Buscar comissões
          const { data: commissions } = await supabase
            .from('affiliate_commissions')
            .select('amount, status')
            .eq('affiliate_id', affiliate.id)
            .eq('user_id', profile.id);

          const totalCommission = commissions?.reduce((acc, c) => acc + Number(c.amount), 0) || 0;
          const hasPaidCommission = commissions?.some(c => c.status === 'paid') || false;

          // Buscar obras registradas
          const { count: worksCount } = await supabase
            .from('author_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .eq('status', 'registered');

          return {
            name: profile.name || 'Sem nome',
            email: profile.email || 'Sem email',
            conversion_date: profile.created_at,
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
  }, [affiliate?.affiliate_code, affiliate?.id]);

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
                     <TableHead>Data</TableHead>
                     <TableHead>Registrou Obra?</TableHead>
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
                           <Badge className="bg-green-600 hover:bg-green-700">
                             Sim
                           </Badge>
                         ) : (
                           <Badge variant="secondary">
                             Não
                           </Badge>
                         )}
                       </TableCell>
                       <TableCell>
                         {user.commission_amount && user.commission_amount > 0 ? (
                           <Badge className="bg-yellow-600 hover:bg-yellow-700">
                             Aguardando
                           </Badge>
                         ) : (
                           <Badge variant="secondary">
                             Aguardando
                           </Badge>
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