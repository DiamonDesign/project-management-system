import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  compact?: boolean;
  className?: string;
  onExpandedChange?: (expanded: boolean) => void;
  actionButton?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  icon,
  children,
  defaultExpanded = false,
  compact = false,
  className,
  onExpandedChange,
  actionButton
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandedChange?.(newExpanded);
  };

  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <Card hover className={cn("transition-all duration-200", className)}>
      <CardHeader 
        className={cn(
          "cursor-pointer select-none",
          compact ? "p-4" : "pb-3"
        )}
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {icon && (
              <div className="flex-shrink-0">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className={cn(
                "flex items-center gap-2",
                compact ? "text-base" : "text-lg"
              )}>
                <ChevronIcon className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                <span className="truncate">{title}</span>
              </CardTitle>
              {subtitle && (
                <p className={cn(
                  "text-muted-foreground mt-1",
                  compact ? "text-xs" : "text-sm"
                )}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actionButton && (
            <div 
              className="flex-shrink-0 ml-2"
              onClick={(e) => e.stopPropagation()}
            >
              {actionButton}
            </div>
          )}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className={cn(
          "animate-fade-in",
          compact ? "p-4 pt-0" : "pt-0"
        )}>
          {children}
        </CardContent>
      )}
    </Card>
  );
};