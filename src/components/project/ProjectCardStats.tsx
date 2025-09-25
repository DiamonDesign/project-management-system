import React from "react";
import { Progress } from "@/components/ui/progress";
import { Task } from "@/types/shared";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface ProjectCardStatsProps {
  tasks: Task[];
  dueDate?: string;
  variant?: 'card' | 'list';
}

export const ProjectCardStats: React.FC<ProjectCardStatsProps> = ({
  tasks,
  dueDate,
  variant = 'card'
}) => {
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const getDueDateStatus = () => {
    if (!dueDate) return null;

    const due = new Date(dueDate);
    const today = new Date();
    const warningThreshold = addDays(today, 3);

    if (isBefore(due, today)) {
      return {
        status: 'overdue',
        icon: AlertCircle,
        className: 'text-destructive',
        text: 'Vencido'
      };
    } else if (isBefore(due, warningThreshold)) {
      return {
        status: 'warning',
        icon: Clock,
        className: 'text-warning',
        text: 'Próximo a vencer'
      };
    } else {
      return {
        status: 'normal',
        icon: Calendar,
        className: 'text-muted-foreground',
        text: 'En tiempo'
      };
    }
  };

  const dueDateStatus = getDueDateStatus();

  if (variant === 'list') {
    return (
      <>
        {/* Type Badge */}
        <div className="col-span-1 flex justify-center">
          {/* This will be handled by parent component */}
        </div>

        {/* Status Badge */}
        <div className="col-span-1 flex justify-center">
          {/* This will be handled by parent component */}
        </div>

        {/* Progress */}
        <div className="col-span-3 hidden sm:flex justify-center items-center gap-2">
          <div className="flex items-center gap-2 w-full max-w-[120px]">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {completedTasks}/{totalTasks}
            </span>
          </div>
        </div>

        {/* Date */}
        <div className="col-span-2 hidden md:flex justify-center items-center">
          {dueDate && (
            <div className="flex items-center gap-1">
              {dueDateStatus && (
                <dueDateStatus.icon className={cn("h-3 w-3", dueDateStatus.className)} />
              )}
              <span className={cn("text-xs", dueDateStatus?.className || "text-muted-foreground")}>
                {format(new Date(dueDate), "dd MMM", { locale: es })}
              </span>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progreso</span>
          <span className="font-medium">{completedTasks}/{totalTasks} tareas</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Due Date */}
      {dueDate && (
        <div className="flex items-center gap-2 text-xs">
          {dueDateStatus && (
            <dueDateStatus.icon className={cn("h-3 w-3", dueDateStatus.className)} />
          )}
          <span className={cn(dueDateStatus?.className || "text-muted-foreground")}>
            {format(new Date(dueDate), "dd 'de' MMMM, yyyy", { locale: es })}
          </span>
        </div>
      )}

      {/* Task Status Icons */}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          <span className="text-muted-foreground">{completedTasks}</span>
        </div>
        <div className="flex items-center gap-1">
          <PlayCircle className="h-3 w-3 text-blue-600" />
          <span className="text-muted-foreground">
            {tasks.filter(t => t.status === 'in-progress').length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-orange-600" />
          <span className="text-muted-foreground">
            {tasks.filter(t => t.status === 'not-started').length}
          </span>
        </div>
      </div>
    </div>
  );
};