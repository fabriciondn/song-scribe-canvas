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
    <div className="max-w-sm">
      <div className="flex items-center justify-between py-1.5 px-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-medium text-amber-800">
            {trialDaysRemaining === 1 
              ? 'Último dia gratuito!'
              : `${trialDaysRemaining} dias restantes`}
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/subscription-checkout')}
          className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-sm h-6 px-3 text-xs ml-3"
        >
          <Crown className="mr-1 h-3 w-3" />
          Upgrade
        </Button>
      </div>
    </div>
  );
};