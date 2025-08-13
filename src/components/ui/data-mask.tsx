import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface DataMaskProps {
  data: string;
  type: 'email' | 'cpf' | 'phone';
  showButton?: boolean;
  className?: string;
}

const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return '***@***.***';
  
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.length > 3 
    ? `${localPart.slice(0, 3)}***`
    : '***';
  
  const domainParts = domain.split('.');
  const maskedDomain = domainParts.map(part => 
    part.length > 2 ? `${part.slice(0, 2)}***` : '***'
  ).join('.');
  
  return `${maskedLocal}@${maskedDomain}`;
};

const maskCPF = (cpf: string): string => {
  if (!cpf) return '***.***.***-**';
  
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return '***.***.***-**';
  
  return `***.***.***-${cleanCPF.slice(-2)}`;
};

const maskPhone = (phone: string): string => {
  if (!phone) return '(***) ***-***';
  
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 8) return '(***) ***-***';
  
  return `(***) ***-${cleanPhone.slice(-4)}`;
};

const getMaskedData = (data: string, type: DataMaskProps['type']): string => {
  switch (type) {
    case 'email':
      return maskEmail(data);
    case 'cpf':
      return maskCPF(data);
    case 'phone':
      return maskPhone(data);
    default:
      return '***';
  }
};

export const DataMask: React.FC<DataMaskProps> = ({ 
  data, 
  type, 
  showButton = true, 
  className = '' 
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const maskedData = getMaskedData(data, type);

  if (!showButton) {
    return <span className={className}>{maskedData}</span>;
  }

  const handleReveal = () => {
    setIsRevealed(true);
    // Log the access for audit purposes
    console.log(`🔍 PII Access: ${type} data accessed at ${new Date().toISOString()}`);
  };

  const handleHide = () => {
    setIsRevealed(false);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono">
        {isRevealed ? data : maskedData}
      </span>
      
      {isRevealed ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHide}
          className="h-6 w-6 p-0"
        >
          <EyeOff className="h-3 w-3" />
        </Button>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <Eye className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revelar Dados Sensíveis</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a visualizar dados pessoais identificáveis (PII). 
                Esta ação será registrada para fins de auditoria. 
                Confirma que deseja prosseguir?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleReveal}>
                Confirmar Acesso
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export const DataMaskSimple: React.FC<Omit<DataMaskProps, 'showButton'>> = (props) => (
  <DataMask {...props} showButton={false} />
);