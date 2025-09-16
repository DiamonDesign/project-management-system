import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PROJECT_TYPE_CONFIG, type ProjectType } from '@/types/index';
import { Tag, X } from 'lucide-react';
import { FilterTrigger } from './FilterTrigger';
import { cn } from '@/lib/utils';

interface ProjectTypeFilterProps {
  selectedTypes: ProjectType[];
  onChange: (types: ProjectType[]) => void;
  className?: string;
}

export function ProjectTypeFilter({ selectedTypes, onChange, className }: ProjectTypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleType = (type: ProjectType) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    onChange(newTypes);
  };

  const clearAll = () => {
    onChange([]);
  };

  const hasSelection = selectedTypes.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <FilterTrigger
          label="Tipo"
          icon={Tag}
          selectedCount={selectedTypes.length}
          isActive={hasSelection}
          className={className}
          aria-label="Filtrar por tipo de proyecto"
        />
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Tipo de Proyecto</h4>
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
          
          <div className="grid grid-cols-1 gap-1">
            {Object.entries(PROJECT_TYPE_CONFIG).map(([key, config]) => (
              <label
                key={key}
                className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
              >
                <Checkbox
                  checked={selectedTypes.includes(key as ProjectType)}
                  onCheckedChange={() => toggleType(key as ProjectType)}
                />
                <div className="flex items-center space-x-2 flex-1">
                  <span className="text-sm">{config.icon}</span>
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