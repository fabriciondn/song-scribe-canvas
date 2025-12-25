import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Music, Gift, Camera, UserPlus, FileText, Star, ChevronRight, Loader2 } from 'lucide-react';
import { useAcordes } from '@/hooks/useAcordes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const iconMap: Record<string, React.ComponentType<any>> = {
  Camera,
  UserPlus,
  FileText,
  Star,
  Music,
  Gift
};

export function AcordesProgress() {
  const { progress, isLoading, isRedeeming, redeemAcordes } = useAcordes();

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/10 via-card to-card border-purple-500/20">
        <CardContent className="p-6 flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return null;
  }

  const availableActions = progress.available_actions?.filter(a => a.can_complete) || [];

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 via-card to-card border-purple-500/20 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Music className="h-5 w-5 text-purple-400" />
            Meus Acordes
          </CardTitle>
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            R$ 1,00 = 1 acorde
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{progress.available_acordes}</span>
              <span className="text-muted-foreground">/ 30 acordes</span>
            </div>
            {progress.can_redeem && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Gift className="h-3 w-3 mr-1" />
                {progress.credits_available} crédito{progress.credits_available > 1 ? 's' : ''} disponível
              </Badge>
            )}
          </div>
          <Progress 
            value={progress.progress_percentage} 
            className="h-3 bg-purple-500/20"
          />
          <p className="text-xs text-muted-foreground">
            {progress.can_redeem 
              ? 'Você pode resgatar seus acordes!'
              : `Faltam ${progress.acordes_to_next_credit} acordes para resgatar 1 crédito`
            }
          </p>
        </div>

        {/* Redeem Button */}
        {progress.can_redeem && (
          <Button 
            onClick={redeemAcordes}
            disabled={isRedeeming}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
          >
            {isRedeeming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resgatando...
              </>
            ) : (
              <>
                <Gift className="h-4 w-4 mr-2" />
                Resgatar {progress.credits_available} crédito{progress.credits_available > 1 ? 's' : ''}
              </>
            )}
          </Button>
        )}

        {/* Available Actions */}
        {availableActions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-400" />
              Próximos Objetivos
            </p>
            <div className="space-y-2">
              {availableActions.slice(0, 3).map((action) => {
                const IconComponent = iconMap[action.icon || 'Star'] || Star;
                return (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-card/50 border border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-primary/10 rounded">
                        <IconComponent className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{action.name}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                      +{action.acordes_reward}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent History */}
        {progress.recent_history && progress.recent_history.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Histórico Recente</p>
            <div className="space-y-1">
              {progress.recent_history.slice(0, 3).map((item) => {
                const IconComponent = iconMap[item.action_icon || 'Star'] || Star;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IconComponent className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[150px]">{item.description || item.action_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-medium">+{item.acordes_earned}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), 'dd/MM', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
