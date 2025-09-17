import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BackToDashboardButton = () => {
  return (
    <Link to="/dashboard">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Home className="w-4 h-4" />
        Voltar ao Dashboard
      </Button>
    </Link>
  );
};