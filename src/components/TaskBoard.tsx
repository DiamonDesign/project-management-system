import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
  MouseSensor,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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

// Droppable Column Component
const DroppableColumn = ({
  status,
  title,
  columnTasks,
  bgColor,
  textColor,
  projectId,
  handleEditTask,
  handleDeleteTask,
  handleUpdateTaskStatus,
  activeId
}: {
  status: Task['status'];
  title: string;
  columnTasks: Task[];
  bgColor: string;
  textColor: string;
  projectId: string;
  handleEditTask: (taskId: string, updatedFields: Partial<Task>) => void;
  handleDeleteTask: (taskId: string) => void;
  handleUpdateTaskStatus: (pId: string, taskId: string, newStatus: Task['status']) => void;
  activeId: string | null;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const taskIds = columnTasks.map(task => task.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col min-h-[500px]",
        bgColor,
        isOver
          ? "border-primary/70 bg-primary/10 scale-[1.01] shadow-lg ring-2 ring-primary/20"
          : "border-border/30 hover:border-border/50",
        activeId && "transition-all duration-200",
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

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
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
            columnTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                projectId={projectId}
                onEdit={(pId, tId, updatedFields) => handleEditTask(tId, updatedFields)}
                onDelete={(pId, tId) => handleDeleteTask(tId)}
                onUpdateStatus={handleUpdateTaskStatus}
                isDragging={activeId === task.id}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export const TaskBoard = ({ tasks, projectId, layout, containerClass }: TaskBoardProps) => {
  const { deleteTaskFromProject, updateTaskStatus, updateTask } = useProjectContext();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors for better touch and mouse interactions
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);

    // Add subtle haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over) {
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as Task['status'];

    // Only update if status actually changed
    const currentTask = tasks.find(task => task.id === taskId);
    if (currentTask && currentTask.status !== newStatus) {
      handleUpdateTaskStatus(projectId, taskId, newStatus);
      showSuccess("Tarea movida correctamente.");

      // Success haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Add any drag over logic here
  };

  // Filter tasks by status
  const notStartedTasks = tasks.filter(task => task.status === 'not-started');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  // Get active task for overlay
  const activeTask = activeId ? tasks.find(task => task.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={cn(
        layout === 'kanban'
          ? "grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 auto-rows-fr"
          : "grid grid-cols-1 md:grid-cols-2 gap-6",
        containerClass
      )}>
        <DroppableColumn
          status='not-started'
          title='Sin empezar'
          columnTasks={notStartedTasks}
          bgColor='bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-900/30 dark:to-slate-800/30'
          textColor='text-slate-700 dark:text-slate-200'
          projectId={projectId}
          handleEditTask={handleEditTask}
          handleDeleteTask={handleDeleteTask}
          handleUpdateTaskStatus={handleUpdateTaskStatus}
          activeId={activeId}
        />
        <DroppableColumn
          status='in-progress'
          title='En Progreso'
          columnTasks={inProgressTasks}
          bgColor='bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/30'
          textColor='text-blue-700 dark:text-blue-200'
          projectId={projectId}
          handleEditTask={handleEditTask}
          handleDeleteTask={handleDeleteTask}
          handleUpdateTaskStatus={handleUpdateTaskStatus}
          activeId={activeId}
        />
        <DroppableColumn
          status='completed'
          title='Completadas'
          columnTasks={completedTasks}
          bgColor='bg-gradient-to-br from-green-50/50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/30'
          textColor='text-green-700 dark:text-green-200'
          projectId={projectId}
          handleEditTask={handleEditTask}
          handleDeleteTask={handleDeleteTask}
          handleUpdateTaskStatus={handleUpdateTaskStatus}
          activeId={activeId}
        />
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard
            task={activeTask}
            projectId={projectId}
            onEdit={() => {}}
            onDelete={() => {}}
            onUpdateStatus={() => {}}
            isDragging={true}
            isOverlay={true}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};