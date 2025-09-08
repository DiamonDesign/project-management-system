import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useUniqueId, useScreenReader } from '@/hooks/useAccessibility';

// Skip Link Component for keyboard navigation
export const SkipLink: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
}> = ({ href, children, className }) => (
  <a
    href={href}
    className={cn(
      'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
      'bg-primary text-primary-foreground px-4 py-2 rounded-md z-50',
      'focus:outline-none focus:ring-2 focus:ring-ring',
      className
    )}
  >
    {children}
  </a>
);

// Accessible Heading with automatic level management
interface AccessibleHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const AccessibleHeading: React.FC<AccessibleHeadingProps> = ({ 
  level, 
  children, 
  className, 
  id 
}) => {
  const uniqueId = useUniqueId('heading');
  const headingId = id || uniqueId;

  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  
  return React.createElement(
    Component,
    {
      id: headingId,
      className: cn(
        'scroll-m-20 tracking-tight',
        {
          'text-4xl font-extrabold lg:text-5xl': level === 1,
          'text-3xl font-semibold': level === 2,
          'text-2xl font-semibold': level === 3,
          'text-xl font-semibold': level === 4,
          'text-lg font-medium': level === 5,
          'text-base font-medium': level === 6,
        },
        className
      ),
    },
    children
  );
};

// Accessible Button with loading and disabled states
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ children, loading, loadingText, disabled, className, ...props }, ref) => {
    const isDisabled = disabled || loading;
    
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-describedby={loading ? 'loading-description' : undefined}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium',
          'ring-offset-background transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        {...props}
      >
        {loading && (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="sr-only">Loading...</span>
          </>
        )}
        {loading ? loadingText || 'Loading...' : children}
        {loading && (
          <span id="loading-description" className="sr-only">
            Please wait while the operation completes
          </span>
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

// Accessible Form Field with error handling
interface AccessibleFormFieldProps {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  label,
  error,
  description,
  required,
  children,
  className,
}) => {
  const fieldId = useUniqueId('field');
  const errorId = useUniqueId('error');
  const descriptionId = useUniqueId('description');

  // Clone children to add accessibility props
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === 'input') {
      return React.cloneElement(child as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>, {
        id: fieldId,
        'aria-describedby': [
          description ? descriptionId : null,
          error ? errorId : null,
        ].filter(Boolean).join(' ') || undefined,
        'aria-invalid': !!error,
        'aria-required': required,
      });
    }
    return child;
  });

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={fieldId}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          error && 'text-destructive'
        )}
      >
        {label}
        {required && <span className="ml-1 text-destructive" aria-label="required">*</span>}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {enhancedChildren}
      
      {error && (
        <p
          id={errorId}
          className="text-sm text-destructive"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible Modal/Dialog
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}) => {
  const titleId = useUniqueId('modal-title');
  const descriptionId = useUniqueId('modal-description');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div
        className={cn(
          'fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
          'w-full max-w-lg p-6 bg-background rounded-lg shadow-lg',
          'focus:outline-none',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Close dialog"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>
        
        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground mb-4">
            {description}
          </p>
        )}
        
        {children}
      </div>
    </div>
  );
};

// Accessible Status/Toast Component
interface AccessibleStatusProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onDismiss?: () => void;
  className?: string;
}

export const AccessibleStatus: React.FC<AccessibleStatusProps> = ({
  type,
  title,
  message,
  onDismiss,
  className,
}) => {
  const { announce } = useScreenReader();

  React.useEffect(() => {
    announce(`${type}: ${title}${message ? `. ${message}` : ''}`, 'assertive');
  }, [type, title, message, announce]);

  const typeClasses = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  return (
    <div
      className={cn(
        'rounded-md border p-4',
        typeClasses[type],
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          {message && <p className="mt-1 text-sm">{message}</p>}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-auto -mx-1.5 -my-1.5 rounded-md p-1.5 hover:bg-current hover:bg-opacity-10 focus:ring-2 focus:ring-current"
            aria-label="Dismiss notification"
          >
            <span className="sr-only">Dismiss</span>
            ×
          </button>
        )}
      </div>
    </div>
  );
};

// Accessible Progress Indicator
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label: string;
  description?: string;
  showValue?: boolean;
  className?: string;
}

export const AccessibleProgress: React.FC<AccessibleProgressProps> = ({
  value,
  max = 100,
  label,
  description,
  showValue = true,
  className,
}) => {
  const percentage = Math.round((value / max) * 100);
  const progressId = useUniqueId('progress');

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={progressId} className="text-sm font-medium">
          {label}
        </label>
        {showValue && (
          <span className="text-sm text-muted-foreground">
            {percentage}%
          </span>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground mb-2">
          {description}
        </p>
      )}
      
      <div
        id={progressId}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${percentage}% complete`}
        className="w-full bg-secondary rounded-full h-2"
      >
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="sr-only" aria-live="polite">
        {label}: {percentage}% complete
      </div>
    </div>
  );
};

// Accessible Navigation Menu
interface AccessibleNavProps {
  items: Array<{
    href: string;
    label: string;
    current?: boolean;
    disabled?: boolean;
  }>;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const AccessibleNav: React.FC<AccessibleNavProps> = ({
  items,
  orientation = 'horizontal',
  className,
}) => {
  return (
    <nav className={className} role="navigation">
      <ul
        className={cn(
          'flex',
          orientation === 'vertical' ? 'flex-col space-y-2' : 'flex-row space-x-4'
        )}
        role="menubar"
        aria-orientation={orientation}
      >
        {items.map((item, index) => (
          <li key={item.href} role="none">
            <a
              href={item.href}
              role="menuitem"
              tabIndex={item.disabled ? -1 : 0}
              aria-current={item.current ? 'page' : undefined}
              aria-disabled={item.disabled}
              className={cn(
                'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                item.current
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {item.label}
              {item.current && (
                <span className="sr-only">(current page)</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};