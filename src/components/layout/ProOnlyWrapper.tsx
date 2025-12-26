import React, { useState, useEffect } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { ProUpgradeModal } from '@/components/ui/pro-upgrade-modal';

interface ProOnlyWrapperProps {
  children: React.ReactNode;
  featureName: string;
}

export const ProOnlyWrapper: React.FC<ProOnlyWrapperProps> = ({ 
  children, 
  featureName 
}) => {
  const { isPro, isAdmin, isLoading } = useUserRole();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Mostrar modal automaticamente para usuários não-Pro
  useEffect(() => {
    if (!isLoading && !isPro && !isAdmin) {
      setShowUpgradeModal(true);
    }
  }, [isLoading, isPro, isAdmin]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Admins e Pro têm acesso total
  if (isAdmin || isPro) {
    return <>{children}</>;
  }

  // Usuários não-Pro veem o conteúdo parcialmente + modal
  return (
    <>
      <div className="opacity-50 pointer-events-none blur-sm">
        {children}
      </div>
      <ProUpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        featureName={featureName}
      />
    </>
  );
};