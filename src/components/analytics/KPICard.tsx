import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'cyan';
  className?: string;
}

const colorVariants = {
  blue: {
    card: 'border-blue-200/50 bg-blue-50/50',
    icon: 'text-blue-600 bg-blue-100',
    trend: {
      increase: 'text-blue-600 bg-blue-100',
      decrease: 'text-blue-600 bg-blue-100',
      neutral: 'text-blue-600 bg-blue-100',
    }
  },
  green: {
    card: 'border-green-200/50 bg-green-50/50',
    icon: 'text-green-600 bg-green-100',
    trend: {
      increase: 'text-green-600 bg-green-100',
      decrease: 'text-green-600 bg-green-100',
      neutral: 'text-green-600 bg-green-100',
    }
  },
  orange: {
    card: 'border-orange-200/50 bg-orange-50/50',
    icon: 'text-orange-600 bg-orange-100',
    trend: {
      increase: 'text-orange-600 bg-orange-100',
      decrease: 'text-orange-600 bg-orange-100',
      neutral: 'text-orange-600 bg-orange-100',
    }
  },
  red: {
    card: 'border-red-200/50 bg-red-50/50',
    icon: 'text-red-600 bg-red-100',
    trend: {
      increase: 'text-red-600 bg-red-100',
      decrease: 'text-red-600 bg-red-100',
      neutral: 'text-red-600 bg-red-100',
    }
  },
  purple: {
    card: 'border-purple-200/50 bg-purple-50/50',
    icon: 'text-purple-600 bg-purple-100',
    trend: {
      increase: 'text-purple-600 bg-purple-100',
      decrease: 'text-purple-600 bg-purple-100',
      neutral: 'text-purple-600 bg-purple-100',
    }
  },
  cyan: {
    card: 'border-cyan-200/50 bg-cyan-50/50',
    icon: 'text-cyan-600 bg-cyan-100',
    trend: {
      increase: 'text-cyan-600 bg-cyan-100',
      decrease: 'text-cyan-600 bg-cyan-100',
      neutral: 'text-cyan-600 bg-cyan-100',
    }
  },
};

const getTrendIcon = (type: 'increase' | 'decrease' | 'neutral') => {
  switch (type) {
    case 'increase':
      return TrendingUp;
    case 'decrease':
      return TrendingDown;
    default:
      return Minus;
  }
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  className,
}) => {
  const colors = colorVariants[color];
  const TrendIcon = trend ? getTrendIcon(trend.type) : null;

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      colors.card,
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          'p-2 rounded-lg',
          colors.icon
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-2xl font-bold">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {trend && TrendIcon && (
            <Badge 
              variant="secondary" 
              className={cn(
                'flex items-center gap-1',
                colors.trend[trend.type]
              )}
            >
              <TrendIcon className="h-3 w-3" />
              <span className="text-xs font-medium">
                {trend.value > 0 && '+'}
                {trend.value}%
              </span>
            </Badge>
          )}
        </div>
        
        {trend && (
          <p className="text-xs text-muted-foreground mt-2">
            {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
};