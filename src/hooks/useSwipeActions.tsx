import { useState, useRef } from 'react';
import { useDrag } from '@use-gesture/react';

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: 'destructive' | 'success' | 'warning' | 'info';
  action: () => void;
}

interface UseSwipeActionsProps {
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  disabled?: boolean;
}

export const useSwipeActions = ({
  leftActions = [],
  rightActions = [],
  threshold = 80,
  disabled = false
}: UseSwipeActionsProps) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [activeAction, setActiveAction] = useState<SwipeAction | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const actionTriggered = useRef(false);

  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], direction: [dx], cancel }) => {
      if (disabled) return;

      // Prevent vertical scrolling interference
      if (Math.abs(mx) < 10) return;

      if (down) {
        // Update swipe position
        setSwipeOffset(mx);
        actionTriggered.current = false;

        // Determine active action based on swipe direction and distance
        let action: SwipeAction | null = null;
        
        if (mx < -threshold && rightActions.length > 0) {
          // Swiping left - show right actions
          const actionIndex = Math.min(
            Math.floor(Math.abs(mx) / threshold) - 1,
            rightActions.length - 1
          );
          action = rightActions[actionIndex];
        } else if (mx > threshold && leftActions.length > 0) {
          // Swiping right - show left actions  
          const actionIndex = Math.min(
            Math.floor(mx / threshold) - 1,
            leftActions.length - 1
          );
          action = leftActions[actionIndex];
        }
        
        setActiveAction(action);
      } else {
        // Released - trigger action if threshold exceeded
        if (activeAction && Math.abs(mx) >= threshold && Math.abs(vx) > 0.2) {
          actionTriggered.current = true;
          activeAction.action();
        }

        // Reset state with animation
        setSwipeOffset(0);
        setActiveAction(null);
      }
    },
    {
      filterTaps: true,
      axis: 'x',
      threshold: 10,
      rubberband: true
    }
  );

  // Calculate action visibility and progress
  const getActionProgress = (actions: SwipeAction[], isLeft: boolean) => {
    const direction = isLeft ? 1 : -1;
    const distance = swipeOffset * direction;
    
    if (distance <= 0) return { visible: false, progress: 0, currentAction: null };
    
    const progress = Math.min(distance / threshold, 2); // Allow up to 2x threshold
    const actionIndex = Math.min(Math.floor(progress), actions.length - 1);
    const currentAction = progress >= 1 ? actions[actionIndex] : null;
    
    return {
      visible: progress > 0.1,
      progress,
      currentAction
    };
  };

  const leftActionsState = getActionProgress(leftActions, true);
  const rightActionsState = getActionProgress(rightActions, false);

  return {
    bind,
    containerRef,
    swipeOffset,
    activeAction,
    leftActionsState,
    rightActionsState,
    isDragging: swipeOffset !== 0
  };
};