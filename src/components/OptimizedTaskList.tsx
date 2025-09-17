import React, { useMemo } from 'react';
import { Task } from '@/context/ProjectContext';
import { TaskCard } from '@/components/TaskCard';
import { VirtualTaskList } from '@/components/VirtualList';
// Note: This component may need updating if drag & drop is required
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListChildComponentProps } from 'react-window';
import { cn } from '@/lib/utils';

interface ExtendedTask extends Task {
  projectName: string;
  projectId: string;
}

interface OptimizedTaskListProps {
  tasks: ExtendedTask[];
  onEdit: (projectId: string, taskId: string, updatedFields: Partial<Task>) => void;
  onDelete: (projectId: string, taskId: string) => void;
  onUpdateStatus: (projectId: string, taskId: string, newStatus: Task['status']) => void;
  onDragEnd?: (result: { destination?: { index: number }; source: { index: number }; draggableId: string }) => void;
  droppableId: string;
  maxHeight?: number;
  virtualScrollThreshold?: number; // Number of tasks before activating virtual scrolling
  enableDragDrop?: boolean;
  className?: string;
}

export const OptimizedTaskList: React.FC<OptimizedTaskListProps> = ({
  tasks,
  onEdit,
  onDelete,
  onUpdateStatus,
  onDragEnd,
  droppableId,
  maxHeight = 400,
  virtualScrollThreshold = 50,
  enableDragDrop = true,
  className
}) => {
  const shouldUseVirtualScrolling = tasks.length > virtualScrollThreshold;

  // Memoize task components to improve performance
  const taskComponents = useMemo(() => {
    if (!shouldUseVirtualScrolling) {
      return tasks.map((task, index) => (
        <TaskCard
          key={task.id}
          task={task}
          projectId={task.projectId}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
        />
      ));
    }
    return null;
  }, [tasks, onEdit, onDelete, onUpdateStatus, shouldUseVirtualScrolling]);

  // Regular list with drag & drop (for smaller lists)
  const renderRegularList = () => {
    if (!enableDragDrop) {
      return (
        <ScrollArea className={cn("h-full w-full pr-2", className)} style={{ maxHeight }}>
          {tasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay tareas aquí.</p>
          ) : (
            <div className="space-y-3">
              {taskComponents}
            </div>
          )}
        </ScrollArea>
      );
    }

    // Drag & drop temporarily disabled - needs migration to @dnd-kit
    return (
      <ScrollArea className={cn("h-full w-full pr-2", className)} style={{ maxHeight }}>
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay tareas aquí.</p>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                projectId={task.projectId}
                onEdit={onEdit}
                onDelete={onDelete}
                onUpdateStatus={onUpdateStatus}
              />
            ))
          )}
        </div>
      </ScrollArea>
    );
  };

  // Virtual scrolling (for large lists - disables drag & drop)
  const renderVirtualList = () => {
    const renderTask = ({ index, style, item: task }: ListChildComponentProps & { item: ExtendedTask }) => (
      <div style={style} className="px-1 py-1">
        <TaskCard
          key={task.id}
          task={task}
          projectId={task.projectId}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
        />
      </div>
    );

    return (
      <div className={cn("w-full", className)}>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm p-4">No hay tareas aquí.</p>
        ) : (
          <VirtualTaskList
            items={tasks}
            renderItem={renderTask}
            height={maxHeight}
            threshold={virtualScrollThreshold}
            overscan={3}
            className="w-full"
          />
        )}
      </div>
    );
  };

  // Drag & drop temporarily disabled - needs migration to @dnd-kit
  // if (enableDragDrop && !shouldUseVirtualScrolling && onDragEnd) {
  //   return (
  //     <DragDropContext onDragEnd={onDragEnd}>
  //       {renderRegularList()}
  //     </DragDropContext>
  //   );
  // }

  // Return appropriate list based on size
  return shouldUseVirtualScrolling ? renderVirtualList() : renderRegularList();
};

// Performance monitoring component
interface TaskListPerformanceProps {
  taskCount: number;
  isVirtualized: boolean;
  renderTime?: number;
}

export const TaskListPerformanceIndicator: React.FC<TaskListPerformanceProps> = ({
  taskCount,
  isVirtualized,
  renderTime
}) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="text-xs text-muted-foreground p-2 border-t">
      📊 Tasks: {taskCount} | Mode: {isVirtualized ? 'Virtual' : 'Standard'}
      {renderTime && ` | Render: ${renderTime.toFixed(2)}ms`}
    </div>
  );
};