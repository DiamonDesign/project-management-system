import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, useProjectContext } from '@/context/ProjectContext';
import { TaskCard } from '@/components/TaskCard';
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { CheckCircle2, PlayCircle, Clock } from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  projectId: string;
  layout: 'kanban' | 'list';
  containerClass?: string;
}

export const TaskBoard = ({ tasks, projectId, layout, containerClass }: TaskBoardProps) => {
  const { deleteTaskFromProject, updateTaskStatus, updateTask } = useProjectContext();

  const handleDeleteTask = (taskId: string) => {
    deleteTaskFromProject(projectId, taskId);
  };

  const handleEditTask = (taskId: string, updatedFields: Partial<Task>) => {
    updateTask(projectId, taskId, updatedFields);
    showSuccess("Tarea actualizada.");
  };

  const handleUpdateTaskStatus = (pId: string, taskId: string, newStatus: Task['status']) => {
    updateTaskStatus(projectId, taskId, newStatus);
  };

  const onDragEnd = (result: DropResult) => {
    // Restore scroll capability
    document.body.style.overflowX = 'auto';

    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const taskId = draggableId;
    const newStatus = destination.droppableId as Task['status'];

    handleUpdateTaskStatus(projectId, taskId, newStatus);
  };

  const onDragStart = () => {
    // Disable scroll during drag to prevent positioning issues
    document.body.style.overflowX = 'hidden';
  };

  const onDragUpdate = () => {
    // Force recalculation of container bounds
    window.requestAnimationFrame(() => {
      const dragLayer = document.querySelector('[data-rbd-drag-handle-context-id]');
      if (dragLayer) {
        dragLayer.scrollTop = 0;
        dragLayer.scrollLeft = 0;
      }
    });
  };

  // Filter tasks by status
  const notStartedTasks = tasks.filter(task => task.status === 'not-started');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  const renderColumn = (status: Task['status'], title: string, columnTasks: Task[], bgColor: string, textColor: string) => (
    <Droppable droppableId={status}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            "rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col min-h-[500px]",
            bgColor,
            snapshot.isDraggingOver
              ? "border-primary/50 bg-primary/5 scale-[1.02] shadow-lg"
              : "border-border/30 hover:border-border/50",
            "p-4 sm:p-5 backdrop-blur-sm"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn(
              "font-bold text-base sm:text-lg tracking-tight",
              textColor
            )}>
              {title}
            </h3>
            <div className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold border-2",
              columnTasks.length > 0 ? "bg-background/80 text-foreground border-border" : "bg-muted/50 text-muted-foreground border-muted"
            )}>
              {columnTasks.length}
            </div>
          </div>

          <div
            className="flex-1 w-full space-y-3 pb-2"
            style={{
              maxHeight: '500px',
              overflowY: columnTasks.length > 8 ? 'auto' : 'visible',
            }}
          >
            {columnTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300",
                  status === 'not-started' && "bg-muted/20 text-muted-foreground",
                  status === 'in-progress' && "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
                  status === 'completed' && "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                )}>
                  {status === 'not-started' && <Clock className="h-6 w-6" />}
                  {status === 'in-progress' && <PlayCircle className="h-6 w-6" />}
                  {status === 'completed' && <CheckCircle2 className="h-6 w-6" />}
                </div>
                <p className="text-sm text-muted-foreground font-medium mb-2">
                  No hay tareas {title.toLowerCase()}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  {status === 'not-started' && 'Arrastra tareas aquí para comenzar'}
                  {status === 'in-progress' && 'Las tareas en progreso aparecerán aquí'}
                  {status === 'completed' && 'Las tareas completadas se mostrarán aquí'}
                </p>
              </div>
            ) : (
              columnTasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(providedDraggable, dragSnapshot) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectId={projectId}
                      onEdit={(pId, tId, updatedFields) => handleEditTask(tId, updatedFields)}
                      onDelete={(pId, tId) => handleDeleteTask(tId)}
                      onUpdateStatus={handleUpdateTaskStatus}
                      draggableProps={providedDraggable.draggableProps}
                      dragHandleProps={providedDraggable.dragHandleProps}
                      innerRef={providedDraggable.innerRef}
                      isDragging={dragSnapshot.isDragging}
                    />
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );

  return (
    <DragDropContext
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onDragUpdate={onDragUpdate}
    >
      <div className={cn(
        layout === 'kanban'
          ? "grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 auto-rows-fr"
          : "grid grid-cols-1 md:grid-cols-2 gap-6",
        containerClass
      )}>
        {renderColumn(
          'not-started',
          'Sin empezar',
          notStartedTasks,
          'bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-900/30 dark:to-slate-800/30',
          'text-slate-700 dark:text-slate-200'
        )}
        {renderColumn(
          'in-progress',
          'En Progreso',
          inProgressTasks,
          'bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/30',
          'text-blue-700 dark:text-blue-200'
        )}
        {renderColumn(
          'completed',
          'Completadas',
          completedTasks,
          'bg-gradient-to-br from-green-50/50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/30',
          'text-green-700 dark:text-green-200'
        )}
      </div>
    </DragDropContext>
  );
};