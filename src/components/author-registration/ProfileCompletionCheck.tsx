import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProfileValidation } from '@/hooks/useProfileValidation';

interface ProfileCompletionCheckProps {
  onContinue?: () => void;
}

export const ProfileCompletionCheck: React.FC<ProfileCompletionCheckProps> = ({ 
  onContinue 
}) => {
  const { isComplete, missingFields, completionPercentage } = useProfileValidation();

  if (isComplete) {
    return null;
  }

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="space-y-4">
        <div>
          <h4 className="font-semibold text-amber-800 mb-2">
            Perfil Incompleto ({completionPercentage}%)
          </h4>
          <Progress value={completionPercentage} className="mb-3" />
          <p className="text-amber-700 mb-3">
            Para registrar uma obra, você precisa completar seu perfil. 
            Os seguintes campos são obrigatórios:
          </p>
          <ul className="list-disc list-inside text-sm text-amber-700 space-y-1 mb-4">
            {missingFields.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
        </div>
        
        <div className="flex justify-center">
          <Button asChild variant="default" size="sm">
            <Link to="/dashboard/settings">
              <User className="h-4 w-4 mr-2" />
              Completar Perfil
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};