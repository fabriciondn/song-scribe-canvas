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
    <div className="w-full mb-4">
      <div className="flex items-center justify-between py-2 px-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-amber-600" />
          <div>
            <span className="font-medium text-amber-800 text-sm">
              Período de teste ativo
            </span>
            <span className="mx-2 text-amber-600">•</span>
            <span className="text-sm text-amber-700">
              {trialDaysRemaining === 1 
                ? 'Último dia do seu período gratuito!'
                : `Restam ${trialDaysRemaining} dias do seu período gratuito`}
            </span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/subscription-checkout')}
          className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-sm"
        >
          <Crown className="mr-2 h-4 w-4" />
          Upgrade agora
        </Button>
      </div>
    </div>
  );
};