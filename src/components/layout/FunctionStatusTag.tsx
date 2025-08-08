import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useFunctionStatus } from '@/hooks/useMenuFunctions';

interface FunctionStatusTagProps {
  functionKey: string;
}

export const FunctionStatusTag: React.FC<FunctionStatusTagProps> = ({ functionKey }) => {
  const { status, loading } = useFunctionStatus(functionKey);

  if (loading || status === 'available') {
    return null;
  }

  const getTagVariant = () => {
    switch (status) {
      case 'coming_soon':
        return 'destructive'; // Laranja/vermelho para "EM BREVE"
      case 'beta':
        return 'default'; // Verde para "Beta"
      default:
        return 'secondary';
    }
  };

  const getTagText = () => {
    switch (status) {
      case 'coming_soon':
        return 'EM BREVE';
      case 'beta':
        return 'Beta';
      default:
        return '';
    }
  };

  if (!getTagText()) {
    return null;
  }

  return (
    <Badge 
      variant={getTagVariant()}
      className="ml-2 text-xs px-1.5 py-0.5 text-[10px] font-medium"
    >
      {getTagText()}
    </Badge>
  );
};