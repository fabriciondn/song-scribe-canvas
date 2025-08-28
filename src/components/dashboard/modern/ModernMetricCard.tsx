
import React from 'react';
import { Card, CardBody, Progress, Chip } from '@nextui-org/react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernMetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description: string;
  gradient: string;
  progress?: number;
  trend?: 'up' | 'down' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}

export const ModernMetricCard: React.FC<ModernMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  gradient,
  progress,
  trend,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'col-span-1',
    md: 'col-span-1 md:col-span-2',
    lg: 'col-span-1 md:col-span-2 lg:col-span-3'
  };

  const trendColors = {
    up: 'success',
    down: 'danger',
    neutral: 'default'
  };

  return (
    <Card className={cn(
      "group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500",
      "backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5",
      "dark:from-black/20 dark:to-black/10 border border-white/20",
      sizeClasses[size]
    )}>
      <CardBody className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm text-foreground/70 font-medium">{title}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {value}
              </span>
              {trend && (
                <Chip 
                  size="sm" 
                  color={trendColors[trend] as any}
                  variant="flat"
                  className="text-xs"
                >
                  {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
                </Chip>
              )}
            </div>
            <p className="text-xs text-foreground/60 mt-1">{description}</p>
          </div>
          
          <div className={cn(
            "p-4 rounded-2xl shadow-lg",
            "group-hover:scale-110 transition-transform duration-300",
            gradient
          )}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        
        {progress !== undefined && (
          <div className="mt-4">
            <Progress 
              value={progress} 
              color="primary" 
              size="sm"
              className="w-full"
              classNames={{
                track: "drop-shadow-md",
                indicator: "bg-gradient-to-r from-primary to-secondary"
              }}
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
};
