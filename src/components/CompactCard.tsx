import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CompactCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  onClick?: () => void;
  className?: string;
}

const variantStyles = {
  default: {
    iconBg: 'bg-primary/10 group-hover:bg-primary/20',
    iconColor: 'text-primary',
    ring: ''
  },
  success: {
    iconBg: 'bg-success/10 group-hover:bg-success/20',
    iconColor: 'text-success',
    ring: ''
  },
  warning: {
    iconBg: 'bg-warning/10 group-hover:bg-warning/20',
    iconColor: 'text-warning',
    ring: ''
  },
  destructive: {
    iconBg: 'bg-destructive/10 group-hover:bg-destructive/20',
    iconColor: 'text-destructive',
    ring: 'ring-2 ring-destructive/20 border-destructive/30'
  },
  info: {
    iconBg: 'bg-info/10 group-hover:bg-info/20',
    iconColor: 'text-info',
    ring: ''
  }
};

export const CompactCard: React.FC<CompactCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  onClick,
  className
}) => {
  const styles = variantStyles[variant];
  const isClickable = !!onClick;

  return (
    <Card 
      hover
      className={cn(
        "group cursor-pointer",
        styles.ring,
        isClickable && "hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <div className="text-xl font-bold truncate">{value}</div>
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn(
              "p-2 rounded-lg transition-colors flex-shrink-0 ml-3",
              styles.iconBg
            )}>
              <div className={cn("h-4 w-4", styles.iconColor)}>
                {icon}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};