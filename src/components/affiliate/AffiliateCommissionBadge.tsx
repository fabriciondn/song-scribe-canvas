import { Badge } from '@/components/ui/badge';
import { Percent, Sparkles } from 'lucide-react';
import { getEffectiveCommissionRate } from '@/services/affiliateService';
import type { Affiliate } from '@/services/affiliateService';

interface AffiliateCommissionBadgeProps {
  affiliate: Affiliate;
  variant?: 'default' | 'large';
}

export function AffiliateCommissionBadge({ 
  affiliate, 
  variant = 'default' 
}: AffiliateCommissionBadgeProps) {
  const rate = getEffectiveCommissionRate(affiliate);
  const isCustom = affiliate.custom_commission_rate !== null && 
                   affiliate.custom_commission_rate !== undefined;
  
  if (variant === 'large') {
    return (
      <div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2">
          <Percent className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            {isCustom ? 'Comissão Personalizada' : 'Comissão Padrão'}
          </span>
          {isCustom && <Sparkles className="w-4 h-4 text-primary" />}
        </div>
        <div className="text-4xl font-bold text-primary">
          {rate}%
        </div>
        <p className="text-xs text-muted-foreground text-center">
          por registro autoral indicado
        </p>
      </div>
    );
  }
  
  return (
    <Badge 
      variant="outline" 
      className={`${isCustom ? 'bg-primary/10 text-primary border-primary' : 'bg-muted'}`}
    >
      {isCustom && <Sparkles className="w-3 h-3 mr-1" />}
      {rate}% comissão
    </Badge>
  );
}
