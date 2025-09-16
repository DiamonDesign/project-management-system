import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Type,
  BarChart3,
  Clock
} from 'lucide-react';
import { FilterTrigger } from './FilterTrigger';
import { cn } from '@/lib/utils';

interface ProjectSortFilterProps {
  sortBy: 'name' | 'created_at' | 'updated_at' | 'status';
  sortOrder: 'asc' | 'desc';
  onSortByChange: (sortBy: 'name' | 'created_at' | 'updated_at' | 'status') => void;
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void;
  className?: string;
}

const sortOptions = {
  name: { name: 'Nombre', icon: <Type className="h-3 w-3" /> },
  created_at: { name: 'Fecha de creación', icon: <Calendar className="h-3 w-3" /> },
  updated_at: { name: 'Última actualización', icon: <Clock className="h-3 w-3" /> },
  status: { name: 'Estado', icon: <BarChart3 className="h-3 w-3" /> }
};

export function ProjectSortFilter({ 
  sortBy, 
  sortOrder, 
  onSortByChange, 
  onSortOrderChange, 
  className 
}: ProjectSortFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentSort = sortOptions[sortBy];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <FilterTrigger
          label="Ordenar"
          icon={ArrowUpDown}
          isActive={true}
          className={className}
          aria-label="Ordenar proyectos"
        />
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-3">Ordenar por</h4>
            <RadioGroup
              value={sortBy}
              onValueChange={(value) => onSortByChange(value as 'name' | 'created_at' | 'updated_at' | 'status')}
              className="space-y-2"
            >
              {Object.entries(sortOptions).map(([key, option]) => (
                <div key={key} className="flex items-center space-x-2">
                  <RadioGroupItem value={key} id={key} />
                  <Label htmlFor={key} className="flex items-center space-x-2 cursor-pointer">
                    {option.icon}
                    <span className="text-sm">{option.name}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium text-sm mb-3">Dirección</h4>
            <RadioGroup
              value={sortOrder}
              onValueChange={(value) => onSortOrderChange(value as 'asc' | 'desc')}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="asc" id="asc" />
                <Label htmlFor="asc" className="flex items-center space-x-2 cursor-pointer">
                  <ArrowUp className="h-3 w-3" />
                  <span className="text-sm">Ascendente (A-Z)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="desc" id="desc" />
                <Label htmlFor="desc" className="flex items-center space-x-2 cursor-pointer">
                  <ArrowDown className="h-3 w-3" />
                  <span className="text-sm">Descendente (Z-A)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}