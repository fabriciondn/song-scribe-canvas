
import React from 'react';
import { Card, CardBody } from '@nextui-org/react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  isHoverable?: boolean;
  isPressable?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  isHoverable = true,
  isPressable = false
}) => {
  return (
    <Card
      className={cn(
        "backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl",
        "dark:bg-black/20 dark:border-white/5",
        isHoverable && "hover:shadow-3xl hover:scale-[1.02] transition-all duration-300",
        isPressable && "cursor-pointer active:scale-[0.98]",
        className
      )}
      isHoverable={isHoverable}
      isPressable={isPressable}
    >
      <CardBody className="p-6">
        {children}
      </CardBody>
    </Card>
  );
};
