import React from 'react';
import { useLocation } from 'react-router-dom';
import { FunctionStatusWrapper as StatusWrapper } from '@/components/ui/function-status-wrapper';

// Mapeamento de rotas para chaves de função
const routeToFunctionMap: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/composer': 'composer',
  '/author-registration': 'author-registration',
  '/cifrador': 'cifrador',
  '/bases': 'bases',
  '/folders': 'folders',
  '/drafts': 'drafts',
  '/partnerships': 'partnerships',
  '/tutorials': 'tutorials',
  '/settings': 'settings',
  '/trash': 'trash',
  '/admin': 'admin',
  '/moderator': 'moderator',
};

interface PageFunctionStatusWrapperProps {
  children: React.ReactNode;
}

export function PageFunctionStatusWrapper({ children }: PageFunctionStatusWrapperProps) {
  const location = useLocation();
  const functionKey = routeToFunctionMap[location.pathname];

  // Se não há mapeamento para esta rota, mostrar normalmente
  if (!functionKey) {
    return <>{children}</>;
  }

  return (
    <StatusWrapper functionKey={functionKey} showBadge={true}>
      {children}
    </StatusWrapper>
  );
}