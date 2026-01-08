import React, { useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Music, Gift, Camera, UserPlus, FileText, Star, Loader2, ArrowLeft, Check, Copy } from 'lucide-react';
import { useAcordes } from '@/hooks/useAcordes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';

const iconMap: Record<string, React.ComponentType<any>> = {
  Camera,
  UserPlus,
  FileText,
  Star,
  Music,
  Gift
};

export default function Acordes() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { progress, isLoading, isRedeeming, redeemAcordes } = useAcordes();

  const copyReferralLink = () => {
    if (!user?.id) return;
    const referralLink = `${window.location.origin}/ref/compuse-${user.id}`;
    navigator.clipboard.writeText(referralLink);
    toast.success('Link de indicação copiado!');
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="text-center text-muted-foreground">
          Não foi possível carregar o progresso de acordes.
        </div>
      </div>
    );
  }

  const availableActions = progress.available_actions?.filter(a => a.can_complete) || [];
  const completedActions = progress.available_actions?.filter(a => !a.can_complete) || [];

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Music className="h-6 w-6 text-purple-400" />
            Meus Acordes
          </h1>
          <p className="text-muted-foreground text-sm">
            Complete objetivos para ganhar acordes e trocar por créditos
          </p>
        </div>
      </div>

      {/* Main Progress Card */}
      <Card className="bg-gradient-to-br from-purple-500/10 via-card to-card border-purple-500/20">
        <CardContent className="p-6 space-y-6">
          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">{progress.available_acordes}</span>
                <span className="text-muted-foreground">/ 20 acordes</span>
              </div>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                R$ 1,00 = 1 acorde
              </Badge>
            </div>
            <Progress 
              value={progress.progress_percentage} 
              className="h-4 bg-purple-500/20"
            />
            <p className="text-sm text-muted-foreground">
              {progress.can_redeem 
                ? `Você pode resgatar ${progress.credits_available} crédito${progress.credits_available > 1 ? 's' : ''}!`
                : `Faltam ${progress.acordes_to_next_credit} acordes para resgatar 1 crédito`
              }
            </p>
          </div>

          {/* Redeem Button */}
          {progress.can_redeem && (
            <Button 
              onClick={redeemAcordes}
              disabled={isRedeeming}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
            >
              {isRedeeming ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Resgatando...
                </>
              ) : (
                <>
                  <Gift className="h-5 w-5 mr-2" />
                  Resgatar {progress.credits_available} crédito{progress.credits_available > 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Available Objectives */}
      {availableActions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400" />
              Objetivos Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableActions.map((action) => {
              const IconComponent = iconMap[action.icon || 'Star'] || Star;
              const isReferralAction = action.action_key === 'refer_friend_purchase';
              return (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{action.name}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isReferralAction && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={copyReferralLink}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="Copiar link de indicação"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-base px-3">
                      +{action.acordes_reward}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Completed Objectives */}
      {completedActions.length > 0 && (
        <Card className="opacity-75">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
              <Check className="h-5 w-5 text-green-400" />
              Objetivos Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedActions.map((action) => {
              const IconComponent = iconMap[action.icon || 'Star'] || Star;
              return (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <IconComponent className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground line-through">{action.name}</p>
                      <p className="text-sm text-muted-foreground/70">{action.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-400 border-green-400/30">
                    <Check className="h-3 w-3 mr-1" />
                    +{action.acordes_reward}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent History */}
      {progress.recent_history && progress.recent_history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Histórico Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {progress.recent_history.map((item) => {
                const IconComponent = iconMap[item.action_icon || 'Star'] || Star;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <IconComponent className="h-4 w-4" />
                      <span>{item.description || item.action_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 font-medium">+{item.acordes_earned}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), "dd 'de' MMM", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
