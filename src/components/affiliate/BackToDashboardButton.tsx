import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BackToDashboardButton = () => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.location.href = '/dashboard'}
      className="flex items-center gap-2"
    >
      <Home className="w-4 h-4" />
      Voltar ao Dashboard
    </Button>
  );
};