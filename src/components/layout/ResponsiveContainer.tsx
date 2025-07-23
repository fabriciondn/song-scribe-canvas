import React from 'react';
import { useMobileDetection } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  mobileClassName,
  tabletClassName,
  desktopClassName
}) => {
  const { isMobile, isTablet, isDesktop } = useMobileDetection();

  const computedClassName = cn(
    className,
    isMobile && mobileClassName,
    isTablet && tabletClassName,
    isDesktop && desktopClassName
  );

  return (
    <div className={computedClassName}>
      {children}
    </div>
  );
};