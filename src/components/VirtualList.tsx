import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { FixedSizeList as List, ListChildComponentProps, FixedSizeListProps } from 'react-window';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> extends Omit<FixedSizeListProps, 'children' | 'itemCount'> {
  items: T[];
  renderItem: (props: ListChildComponentProps & { item: T; isScrolling?: boolean }) => React.ReactElement;
  className?: string;
  listClassName?: string;
  threshold?: number; // Items to render before virtual scrolling kicks in
  estimatedItemSize?: number;
  overscan?: number; // Items to render outside visible area
}

interface VirtualListHandle {
  scrollToItem: (index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start') => void;
  scrollToOffset: (offset: number) => void;
}

function VirtualListInner<T>(
  {
    items,
    renderItem,
    className,
    listClassName,
    height = 400,
    itemSize = 80,
    threshold = 50,
    estimatedItemSize,
    overscan = 5,
    ...props
  }: VirtualListProps<T>,
  ref: React.Ref<VirtualListHandle>
) {
  const listRef = useRef<List>(null);

  useImperativeHandle(ref, () => ({
    scrollToItem: (index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start') => {
      listRef.current?.scrollToItem(index, align);
    },
    scrollToOffset: (offset: number) => {
      listRef.current?.scrollTo(offset);
    }
  }));

  // If items are below threshold, render normally without virtualization
  if (items.length <= threshold) {
    return (
      <div className={cn("w-full", className)}>
        <div className={cn("space-y-2", listClassName)}>
          {items.map((item, index) => (
            <div key={index}>
              {renderItem({
                index,
                style: {},
                data: items,
                item,
                isScrolling: false
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Enhanced item renderer that passes through the original item
  const itemRenderer = ({ index, style, isScrolling }: ListChildComponentProps) => {
    const item = items[index];
    
    return (
      <div style={style}>
        {renderItem({
          index,
          style,
          data: items,
          item,
          isScrolling
        })}
      </div>
    );
  };

  return (
    <div className={cn("w-full", className)}>
      <List
        ref={listRef}
        height={height}
        itemCount={items.length}
        itemSize={itemSize}
        overscanCount={overscan}
        className={cn("scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border", listClassName)}
        {...props}
      >
        {itemRenderer}
      </List>
    </div>
  );
}

export const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: React.Ref<VirtualListHandle> }
) => React.ReactElement;

// Specialized components for common use cases

interface VirtualProjectListProps<T> extends Omit<VirtualListProps<T>, 'itemSize' | 'height'> {
  height?: number;
  compact?: boolean;
}

export function VirtualProjectList<T>({ 
  compact = false, 
  height = 400,
  ...props 
}: VirtualProjectListProps<T>) {
  const itemSize = compact ? 120 : 160; // Adjust based on ProjectCard height
  
  return (
    <VirtualList
      itemSize={itemSize}
      height={height}
      {...props}
    />
  );
}

interface VirtualTaskListProps<T> extends Omit<VirtualListProps<T>, 'itemSize' | 'height'> {
  height?: number;
  compact?: boolean;
}

export function VirtualTaskList<T>({ 
  compact = false, 
  height = 300,
  ...props 
}: VirtualTaskListProps<T>) {
  const itemSize = compact ? 60 : 80; // Adjust based on TaskCard height
  
  return (
    <VirtualList
      itemSize={itemSize}
      height={height}
      {...props}
    />
  );
}

// Hook for dynamic height calculation based on container
export function useVirtualListHeight(
  containerRef: React.RefObject<HTMLElement>, 
  offset: number = 200
) {
  const [height, setHeight] = React.useState(400);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const newHeight = Math.max(300, containerHeight - offset);
        setHeight(newHeight);
      }
    };

    updateHeight();
    
    const resizeObserver = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, offset]);

  return height;
}

export type { VirtualListHandle, ListChildComponentProps };