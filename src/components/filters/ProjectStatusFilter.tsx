import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { type ProjectStatus } from '@/types/index';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  Pause,
  PlayCircle
} from 'lucide-react';
import { FilterTrigger } from './FilterTrigger';
import { cn } from '@/lib/utils';

interface ProjectStatusFilterProps {
  selectedStatuses: ProjectStatus[];
  onChange: (statuses: ProjectStatus[]) => void;
  className?: string;
}

const statusConfig: Record<ProjectStatus, { name: string; icon: React.ReactNode; color: string }> = {
  'pending': {
    name: 'Pendiente',
    icon: <Clock className="h-3 w-3" />,
    color: 'text-yellow-700'
  },
  'in-progress': {
    name: 'En Progreso',
    icon: <PlayCircle className="h-3 w-3" />,
    color: 'text-blue-700'
  },
  'completed': {
    name: 'Completado',
    icon: <CheckCircle2 className="h-3 w-3" />,
    color: 'text-green-700'
  },
  'on-hold': {
    name: 'En Pausa',
    icon: <Pause className="h-3 w-3" />,
    color: 'text-gray-700'
  }
};

export function ProjectStatusFilter({ selectedStatuses, onChange, className }: ProjectStatusFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleStatus = (status: ProjectStatus) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];
    onChange(newStatuses);
  };

  const clearAll = () => {
    onChange([]);
  };

  const hasSelection = selectedStatuses.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <FilterTrigger
          label="Estado"
          icon={CheckCircle2}
          selectedCount={selectedStatuses.length}
          isActive={hasSelection}
          className={className}
          aria-label="Filtrar por estado del proyecto"
        />
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Estado del Proyecto</h4>
            {hasSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-6 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
          
          <div className="space-y-1">
            {Object.entries(statusConfig).map(([key, config]) => (
              <label
                key={key}
                className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
              >
                <Checkbox
                  checked={selectedStatuses.includes(key as ProjectStatus)}
                  onCheckedChange={() => toggleStatus(key as ProjectStatus)}
                />
                <div className="flex items-center space-x-2 flex-1">
                  <span className={config.color}>{config.icon}</span>
                  <span className="text-sm">{config.name}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}