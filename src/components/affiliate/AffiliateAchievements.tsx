import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Star, 
  Award, 
  Target, 
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  Lock
} from 'lucide-react';
import { type Affiliate, getEffectiveCommissionRate } from '@/services/affiliateService';

interface AffiliateAchievementsProps {
  affiliate: Affiliate;
}

export const AffiliateAchievements = ({ affiliate }: AffiliateAchievementsProps) => {
  const commissionRate = getEffectiveCommissionRate(affiliate);
  
  const achievements = [
    {
      id: 'first_registration',
      title: 'Primeira Indicação',
      description: 'Realize sua primeira indicação de registro autoral',
      icon: Target,
      unlocked: affiliate.total_registrations >= 1,
      progress: Math.min(affiliate.total_registrations, 1),
      target: 1,
      reward: 'Badge de Iniciante'
    },
    {
      id: 'bronze_level',
      title: 'Nível Bronze',
      description: 'Complete seu cadastro como parceiro',
      icon: Star,
      unlocked: true,
      progress: 1,
      target: 1,
      reward: `${commissionRate}% de comissão por registro`
    },
    {
      id: 'silver_level',
      title: 'Nível Silver',
      description: 'Alcance 5 registros autorais indicados',
      icon: Trophy,
      unlocked: affiliate.total_registrations >= 5,
      progress: Math.min(affiliate.total_registrations, 5),
      target: 5,
      reward: `${commissionRate}% de comissão por registro`
    },
    {
      id: 'gold_level',
      title: 'Nível Gold',
      description: 'Alcance 100 registros autorais indicados',
      icon: Award,
      unlocked: affiliate.total_registrations >= 100,
      progress: Math.min(affiliate.total_registrations, 100),
      target: 100,
      reward: 'Comissões recorrentes desbloqueadas'
    },
    {
      id: 'first_payout',
      title: 'Primeiro Pagamento',
      description: 'Receba seu primeiro pagamento de comissões',
      icon: DollarSign,
      unlocked: affiliate.total_paid > 0,
      progress: affiliate.total_paid > 0 ? 1 : 0,
      target: 1,
      reward: 'Badge de Parceiro Ativo'
    },
    {
      id: 'recurring_master',
      title: 'Mestre das Recorrências',
      description: 'Tenha 10 assinantes ativos gerando comissão recorrente',
      icon: TrendingUp,
      unlocked: affiliate.total_subscriptions >= 10,
      progress: Math.min(affiliate.total_subscriptions, 10),
      target: 10,
      reward: '50% de comissão recorrente'
    }
  ];

  const milestones = [
    { registrations: 1, reward: 'Primeiro registro - R$ 12,50' },
    { registrations: 5, reward: 'Nível Silver - 50% comissão' },
    { registrations: 10, reward: 'Badge de Consistência' },
    { registrations: 25, reward: 'Badge de Dedicação' },
    { registrations: 50, reward: 'Badge de Especialista' },
    { registrations: 100, reward: 'Nível Gold - Comissões recorrentes' },
    { registrations: 250, reward: 'Badge de Super Afiliado' },
    { registrations: 500, reward: 'Badge de Elite' }
  ];

  const getNextMilestone = () => {
    return milestones.find(m => m.registrations > affiliate.total_registrations);
  };

  const nextMilestone = getNextMilestone();

  return (
    <div className="space-y-6">
      {/* Progresso do Próximo Marco */}
      {nextMilestone && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Próximo Marco
            </CardTitle>
            <CardDescription>
              Continue indicando para desbloquear novas recompensas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">{nextMilestone.reward}</span>
                <Badge variant="outline">
                  {affiliate.total_registrations}/{nextMilestone.registrations}
                </Badge>
              </div>
              <Progress 
                value={(affiliate.total_registrations / nextMilestone.registrations) * 100} 
                className="h-3"
              />
              <p className="text-sm text-muted-foreground">
                Faltam {nextMilestone.registrations - affiliate.total_registrations} registros
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conquistas */}
      <div>
        <h3 className="text-xl font-bold mb-4">Conquistas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            const progressPercentage = (achievement.progress / achievement.target) * 100;
            
            return (
              <Card 
                key={achievement.id} 
                className={`transition-all ${
                  achievement.unlocked 
                    ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' 
                    : 'opacity-75'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        achievement.unlocked 
                          ? 'bg-green-500 text-white' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {achievement.unlocked ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{achievement.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {achievement.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Icon className={`w-6 h-6 ${
                      achievement.unlocked ? 'text-green-600' : 'text-muted-foreground'
                    }`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span>Progresso:</span>
                      <span className="font-medium">
                        {achievement.progress}/{achievement.target}
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      <strong>Recompensa:</strong> {achievement.reward}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Marcos de Registros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Marcos de Registros
          </CardTitle>
          <CardDescription>
            Recompensas baseadas no número de registros indicados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {milestones.map((milestone, index) => {
              const isUnlocked = affiliate.total_registrations >= milestone.registrations;
              const isCurrent = milestone === nextMilestone;
              
              return (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isUnlocked 
                      ? 'bg-green-50 border-green-200' 
                      : isCurrent
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-muted/30 border-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isUnlocked 
                        ? 'bg-green-500 text-white' 
                        : isCurrent
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {milestone.registrations}
                    </div>
                    <span className="font-medium">{milestone.reward}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isUnlocked && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        Desbloqueado
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        Próximo
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Conquistas</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {achievements.filter(a => a.unlocked).length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {achievements.length} disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nível Atual</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {affiliate.level}
            </div>
            <p className="text-xs text-muted-foreground">
              Desde {new Date(affiliate.created_at).toLocaleDateString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Conquistas desbloqueadas
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};