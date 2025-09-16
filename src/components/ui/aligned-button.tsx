import React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlignedButtonProps extends Omit<ButtonProps, 'children'> {
  /** Texto del botón */
  children: React.ReactNode;
  /** Icono líder opcional (izquierda) */
  leadingIcon?: LucideIcon;
  /** Icono trailing opcional (derecha) */
  trailingIcon?: LucideIcon;
  /** Comportamiento del layout */
  layout?: 'centered' | 'justified' | 'leading' | 'trailing';
  /** Clases CSS adicionales */
  className?: string;
}

export const AlignedButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  AlignedButtonProps
>(({
  children,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  layout = 'centered',
  className,
  ...props
}, ref) => {

  const getLayoutClasses = () => {
    switch (layout) {
      case 'justified':
        return 'justify-between'; // Extremos opuestos (como el actual)
      case 'leading':
        return 'justify-start'; // Todo a la izquierda
      case 'trailing':
        return 'justify-end'; // Todo a la derecha
      case 'centered':
      default:
        return 'justify-center'; // Centrado con gap consistente
    }
  };

  return (
    <Button
      ref={ref}
      className={cn(
        // Layout base
        "relative flex items-center whitespace-nowrap",
        getLayoutClasses(),
        // Spacing condicional
        layout === 'centered' && "gap-2",
        className
      )}
      {...props}
    >
      {/* Icono líder con posicionamiento condicional */}
      {LeadingIcon && (
        <LeadingIcon 
          className={cn(
            "h-4 w-4 flex-shrink-0",
            // Para layout centered/leading, usar posición normal
            (layout === 'centered' || layout === 'leading') && "mr-0",
            // Para justified, usar posición absoluta
            layout === 'justified' && "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          )}
        />
      )}
      
      {/* Contenido central */}
      <span 
        className={cn(
          "flex-1 text-center",
          // Compensar padding para iconos absolutos en justified
          layout === 'justified' && LeadingIcon && "pl-6",
          layout === 'justified' && TrailingIcon && "pr-6"
        )}
      >
        {children}
      </span>
      
      {/* Icono trailing con posicionamiento condicional */}
      {TrailingIcon && (
        <TrailingIcon 
          className={cn(
            "h-4 w-4 flex-shrink-0",
            // Para layout centered/trailing, usar posición normal
            (layout === 'centered' || layout === 'trailing') && "ml-0",
            // Para justified, usar posición absoluta
            layout === 'justified' && "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          )}
        />
      )}
    </Button>
  );
});

AlignedButton.displayName = "AlignedButton";