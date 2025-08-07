import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFunctionStatus } from '@/hooks/useMenuFunctions';
import { FunctionStatusBadge } from '@/components/ui/function-status-wrapper';
import { FunctionStatusModal } from '@/components/ui/function-status-modal';
import { useFunctionStatusModal } from '@/hooks/useFunctionStatusModal';
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
  const { modalState, showStatusModal, closeModal } = useFunctionStatusModal();
  const location = useLocation();
  const isActive = location.pathname === to;

  const handleClick = (e: React.MouseEvent) => {
    if (status === 'coming_soon' || status === 'beta') {
      e.preventDefault();
      showStatusModal(status, label);
      return;
    }
  };

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

  // Para todas as funções, mostrar como clicável mas com modal para "coming soon" e "beta"
  return (
    <>
      <Link 
        to={status === 'available' ? to : '#'}
        onClick={handleClick}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
          isActive && status === 'available' ? 'bg-muted text-primary' : 'text-muted-foreground'
        } ${status === 'coming_soon' ? 'text-muted-foreground/70' : ''} ${className}`}
      >
        <Icon className="h-4 w-4" />
        {!isCollapsed && (
          <div className="flex items-center gap-2 flex-1">
            <span>{label}</span>
            <FunctionStatusBadge functionKey={functionKey} />
          </div>
        )}
      </Link>
      
      <FunctionStatusModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        status={modalState.status}
        functionName={modalState.functionName}
        functionDescription={modalState.functionDescription}
      />
    </>
  );
}

// Componente para mostrar alerta global quando há funções com problemas
export function FunctionStatusAlert() {
  // Este componente pode ser expandido para mostrar alertas gerais
  // sobre o status das funções do sistema
  return null;
}