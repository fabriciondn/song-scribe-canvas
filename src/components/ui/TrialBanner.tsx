import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

export const TrialBanner: React.FC = () => {
  const navigate = useNavigate();
  const { isTrialActive, trialDaysRemaining } = useSubscription();

  if (!isTrialActive || trialDaysRemaining === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">
                Período de teste ativo
              </p>
              <p className="text-sm text-amber-700">
                {trialDaysRemaining === 1 
                  ? 'Último dia do seu período gratuito!'
                  : `Restam ${trialDaysRemaining} dias do seu período gratuito`}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/subscription-checkout')}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <Crown className="mr-2 h-4 w-4" />
            Upgrade agora
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};