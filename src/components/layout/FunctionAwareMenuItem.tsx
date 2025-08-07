import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFunctionStatus } from '@/hooks/useMenuFunctions';
import { FunctionStatusBadge } from '@/components/ui/function-status-wrapper';
import { AlertCircle, Construction } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FunctionAwareMenuItemProps {
  functionKey: string;
  to: string;
  icon: React.ComponentType<any>;
  label: string;
  isCollapsed?: boolean;
  className?: string;
}

export function FunctionAwareMenuItem({ 
  functionKey, 
  to, 
  icon: Icon, 
  label, 
  isCollapsed = false,
  className = ""
}: FunctionAwareMenuItemProps) {
  const { status, loading } = useFunctionStatus(functionKey);
  const location = useLocation();
  const isActive = location.pathname === to;

  // Se está carregando, mostrar item normal
  if (loading) {
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
          isActive ? 'bg-muted text-primary' : 'text-muted-foreground'
        } ${className}`}
      >
        <Icon className="h-4 w-4" />
        {!isCollapsed && <span>{label}</span>}
      </Link>
    );
  }

  // Se está "coming soon", desabilitar o link
  if (status === 'coming_soon') {
    return (
      <div 
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground/50 cursor-not-allowed ${className}`}
        title="Função em desenvolvimento"
      >
        <Icon className="h-4 w-4" />
        {!isCollapsed && (
          <div className="flex items-center gap-2 flex-1">
            <span>{label}</span>
            <Construction className="h-3 w-3" />
          </div>
        )}
      </div>
    );
  }

  // Se está em beta ou disponível, mostrar normalmente com badge
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
        isActive ? 'bg-muted text-primary' : 'text-muted-foreground'
      } ${className}`}
    >
      <Icon className="h-4 w-4" />
      {!isCollapsed && (
        <div className="flex items-center gap-2 flex-1">
          <span>{label}</span>
          <FunctionStatusBadge functionKey={functionKey} />
        </div>
      )}
    </Link>
  );
}

// Componente para mostrar alerta global quando há funções com problemas
export function FunctionStatusAlert() {
  // Este componente pode ser expandido para mostrar alertas gerais
  // sobre o status das funções do sistema
  return null;
}