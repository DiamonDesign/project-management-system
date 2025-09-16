import React from 'react';
import { cn } from '@/lib/utils';
import { useSwipeActions } from '@/hooks/useSwipeActions';

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: 'destructive' | 'success' | 'warning' | 'info';
  action: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

const actionColors = {
  destructive: 'bg-destructive text-destructive-foreground',
  success: 'bg-green-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-500 text-white'
};

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  disabled = false,
  className
}) => {
  const {
    bind,
    containerRef,
    swipeOffset,
    leftActionsState,
    rightActionsState,
    isDragging
  } = useSwipeActions({
    leftActions,
    rightActions,
    threshold,
    disabled
  });

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {/* Left Actions Background */}
      {leftActionsState.visible && (
        <div 
          className="absolute inset-y-0 left-0 flex items-center justify-start pl-4"
          style={{ 
            width: Math.abs(swipeOffset),
            opacity: leftActionsState.progress
          }}
        >
          {leftActionsState.currentAction && (
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
              actionColors[leftActionsState.currentAction.color],
              leftActionsState.progress >= 1 && "scale-110"
            )}>
              {leftActionsState.currentAction.icon}
              <span className="text-sm font-medium">
                {leftActionsState.currentAction.label}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Right Actions Background */}
      {rightActionsState.visible && (
        <div 
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-4"
          style={{ 
            width: Math.abs(swipeOffset),
            opacity: rightActionsState.progress
          }}
        >
          {rightActionsState.currentAction && (
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
              actionColors[rightActionsState.currentAction.color],
              rightActionsState.progress >= 1 && "scale-110"
            )}>
              {rightActionsState.currentAction.icon}
              <span className="text-sm font-medium">
                {rightActionsState.currentAction.label}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Card Content */}
      <div
        {...bind()}
        className={cn(
          "transition-transform duration-200 touch-pan-y",
          isDragging && "transition-none"
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};