import React from 'react';
import { Task, Project } from '@/types/shared';
import { format, differenceInDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ComponentErrorBoundary } from './ErrorBoundary/';

interface GanttChartProps {
  projects: Project[];
}

export const GanttChart = ({ projects }: GanttChartProps) => {
  const allTasks: (Task & { projectName: string; projectId: string })[] = projects.flatMap(project =>
    (project.tasks || []).map(task => ({ ...task, projectName: project.name, projectId: project.id }))
  ).filter(task => task.start_date && task.end_date); // Solo tareas con fechas definidas

  if (allTasks.length === 0) {
    return <p className="text-muted-foreground text-sm">No hay tareas con fechas definidas para mostrar en el diagrama de Gantt.</p>;
  }

  const minDate = new Date(Math.min(...allTasks.map(task => new Date(task.start_date!).getTime())));
  const maxDate = new Date(Math.max(...allTasks.map(task => new Date(task.end_date!).getTime())));
  const startDate = startOfWeek(minDate, { locale: es });
  const endDate = endOfWeek(addDays(maxDate, 7), { locale: es }); // Una semana extra de margen

  const daysInChart = eachDayOfInterval({ start: startDate, end: endDate });
  const totalDays = daysInChart.length;

  return (
    <ComponentErrorBoundary>
      <div className="overflow-x-auto relative">
        <div className="flex flex-col min-w-max">
        <div className="flex border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-background z-10">
          <div className="w-48 flex-shrink-0 p-2 font-semibold text-sm">Tarea / Proyecto</div>
          {daysInChart.map((day, index) => (
            <div
              key={index}
              className={cn(
                "flex-shrink-0 w-8 h-10 text-center text-xs flex items-center justify-center border-l border-gray-100 dark:border-gray-800",
                isSameDay(day, new Date()) && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold"
              )}
              title={format(day, "PPP", { locale: es })}
            >
              {format(day, "dd", { locale: es })}
            </div>
          ))}
        </div>

        <div className="flex flex-col">
          {allTasks.map((task, taskIndex) => {
            const taskStartDate = new Date(task.start_date!);
            const taskEndDate = new Date(task.end_date!);

            const offsetDays = differenceInDays(taskStartDate, startDate);
            const durationDays = differenceInDays(taskEndDate, taskStartDate) + 1;

            return (
              <div key={task.id} className="flex items-center border-b border-gray-100 dark:border-gray-800 h-10">
                <div className="w-48 flex-shrink-0 p-2 text-sm truncate" title={`${task.title} (${task.projectName})`}>
                  <span className="font-medium">{task.title}</span>
                  <span className="text-xs text-muted-foreground block">{task.projectName}</span>
                </div>
                <div className="flex-grow relative h-full grid" style={{ gridTemplateColumns: `repeat(${totalDays}, 1fr)` }}>
                  <div
                    className={cn(
                      "absolute h-3 rounded-sm opacity-80 flex items-center justify-center text-xs text-white px-1",
                      task.status === 'completed' ? 'bg-green-500' :
                      task.status === 'in-progress' ? 'bg-blue-500' :
                      'bg-gray-500'
                    )}
                    style={{
                      left: `${(offsetDays / totalDays) * 100}%`,
                      width: `${(durationDays / totalDays) * 100}%`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                    title={`${task.title} (${format(taskStartDate, "PPP", { locale: es })} - ${format(taskEndDate, "PPP", { locale: es })})`}
                  >
                    {durationDays > 2 && format(taskStartDate, "dd", { locale: es })}
                    {durationDays > 4 && ` - ${format(taskEndDate, "dd", { locale: es })}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </ComponentErrorBoundary>
  );
};