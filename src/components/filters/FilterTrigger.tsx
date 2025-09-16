import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterTriggerProps {
  /** Texto del filtro */
  label: string;
  /** Icono líder opcional (16px) */
  icon?: LucideIcon;
  /** Número de elementos seleccionados */
  selectedCount?: number;
  /** Estado activo del filtro */
  isActive?: boolean;
  /** Función onClick */
  onClick?: () => void;
  /** Clases CSS adicionales */
  className?: string;
  /** aria-label para accesibilidad */
  'aria-label'?: string;
}

export const FilterTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  FilterTriggerProps
>(({
  label,
  icon: Icon,
  selectedCount,
  isActive = false,
  onClick,
  className,
  'aria-label': ariaLabel,
  ...props
}, ref) => {
  const hasSelection = selectedCount && selectedCount > 0;

  return (
    <Button
      ref={ref}
      variant={hasSelection ? "default" : "outline"}
      onClick={onClick}
      aria-label={ariaLabel || `Filtrar por ${label}`}
      className={cn(
        // Dimensiones exactas y posición relativa para absolutos
        "h-10 w-full relative",
        // Padding específico: left para icono, right para caret
        "pl-9 pr-8",
        // Layout interno y prevención de wrap
        "flex items-center justify-between whitespace-nowrap",
        // Tipografía
        "text-sm font-medium",
        className
      )}
      {...props}
    >
      {/* Icono líder - posición absoluta con pointer-events-none */}
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
      )}
      
      {/* Contenido central: texto + badge */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Texto del filtro */}
        <span className="text-sm font-medium leading-4 whitespace-nowrap">
          {label}
        </span>
        
        {/* Badge de selección */}
        {hasSelection && (
          <Badge 
            variant="secondary" 
            className="h-4 min-w-4 flex items-center justify-center text-xs leading-3 tabular-nums"
          >
            {selectedCount}
          </Badge>
        )}
      </div>

      {/* Caret derecho - posición absoluta con pointer-events-none */}
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
    </Button>
  );
});

FilterTrigger.displayName = "FilterTrigger";