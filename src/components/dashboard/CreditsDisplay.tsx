import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Gift, Snowflake, AlertTriangle, Crown } from 'lucide-react';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useSubscriptionCredits } from '@/hooks/useSubscriptionCredits';
import { useSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

export const CreditsDisplay: React.FC = () => {
  const { credits, isLoading: creditsLoading } = useUserCredits();
  const { 
    bonusCredits, 
    isFrozen, 
    daysUntilExpiration, 
    isLoading: bonusLoading 
  } = useSubscriptionCredits();
  const { isPro } = useSubscription();

  const isLoading = creditsLoading || bonusLoading;
  const totalCredits = (credits || 0) + (isFrozen ? 0 : bonusCredits);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="pt-4">
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Meus Créditos
          </h3>
          {isPro && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Crown className="h-3 w-3 mr-1" />
              Pro
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {/* Créditos Regulares */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Créditos</span>
            </div>
            <span className="text-xl font-bold">{credits || 0}</span>
          </div>

          {/* Créditos Bônus - Só mostra para Pro ou se tem bônus */}
          {(isPro || bonusCredits > 0) && (
            <div className={cn(
              "flex items-center justify-between p-3 rounded-lg",
              isFrozen 
                ? "bg-blue-50 border border-blue-200" 
                : "bg-green-50 border border-green-200"
            )}>
              <div className="flex items-center gap-2">
                {isFrozen ? (
                  <Snowflake className="h-4 w-4 text-blue-500" />
                ) : (
                  <Gift className="h-4 w-4 text-green-600" />
                )}
                <div>
                  <span className="text-sm font-medium">
                    Créditos Bônus
                  </span>
                  {isFrozen && (
                    <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-700">
                      Congelados
                    </Badge>
                  )}
                </div>
              </div>
              <span className={cn(
                "text-xl font-bold",
                isFrozen ? "text-blue-600" : "text-green-600"
              )}>
                {bonusCredits}
              </span>
            </div>
          )}

          {/* Alerta de expiração */}
          {isFrozen && daysUntilExpiration !== null && daysUntilExpiration <= 30 && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-amber-700">
                {daysUntilExpiration === 0 
                  ? 'Bônus expiram hoje!' 
                  : `Bônus expiram em ${daysUntilExpiration} dias. Renove sua assinatura Pro!`
                }
              </span>
            </div>
          )}

          {/* Total */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total disponível</span>
              <span className="text-2xl font-bold text-primary">{totalCredits}</span>
            </div>
            {isFrozen && bonusCredits > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                +{bonusCredits} bônus liberados ao renovar Pro
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
