import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// Enhanced Loading Spinner
const spinnerVariants = cva(
  "animate-spin rounded-full border-solid border-r-transparent",
  {
    variants: {
      size: {
        xs: "h-3 w-3 border",
        sm: "h-4 w-4 border",
        default: "h-6 w-6 border-2",
        lg: "h-8 w-8 border-2",
        xl: "h-12 w-12 border-4",
      },
      variant: {
        default: "border-primary",
        secondary: "border-secondary",
        muted: "border-muted-foreground",
        white: "border-white",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
}

export const Spinner = ({ className, size, variant }: SpinnerProps) => {
  return (
    <div className={cn(spinnerVariants({ size, variant }), className)} />
  );
};

// Enhanced Loading Skeleton
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangle" | "circle" | "text";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "rectangle", width, height, lines, ...props }, ref) => {
    if (variant === "text" && lines && lines > 1) {
      return (
        <div className="space-y-2" ref={ref} {...props}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "skeleton rounded-md h-4",
                i === lines - 1 && "w-3/4",
                className
              )}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "skeleton",
          {
            "rounded-md": variant === "rectangle",
            "rounded-full": variant === "circle",
            "rounded-md h-4": variant === "text",
          },
          className
        )}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
        }}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

// Page Loading Component
interface PageLoadingProps {
  message?: string;
  showSpinner?: boolean;
  className?: string;
}

export const PageLoading = ({ 
  message = "Cargando...", 
  showSpinner = true, 
  className 
}: PageLoadingProps) => {
  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-background/80 backdrop-blur-sm",
      className
    )}>
      <div className="flex flex-col items-center space-y-4 animate-fade-in">
        {showSpinner && <Spinner size="lg" />}
        <p className="text-lg text-muted-foreground animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
};

// Content Loading Component
interface ContentLoadingProps {
  lines?: number;
  className?: string;
  showAvatar?: boolean;
  showHeader?: boolean;
}

export const ContentLoading = ({ 
  lines = 3, 
  className,
  showAvatar = false,
  showHeader = false
}: ContentLoadingProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      {showAvatar && (
        <div className="flex items-center space-x-4">
          <Skeleton variant="circle" width={40} height={40} />
          <div className="space-y-2">
            <Skeleton width={120} height={16} />
            <Skeleton width={80} height={12} />
          </div>
        </div>
      )}
      
      {showHeader && (
        <div className="space-y-2">
          <Skeleton width="60%" height={24} />
          <Skeleton width="40%" height={16} />
        </div>
      )}
      
      <Skeleton variant="text" lines={lines} />
    </div>
  );
};

// Card Loading Component
export const CardLoading = ({ className }: { className?: string }) => {
  return (
    <div className={cn("p-6 space-y-4", className)}>
      <div className="space-y-2">
        <Skeleton width="70%" height={20} />
        <Skeleton width="50%" height={16} />
      </div>
      <Skeleton variant="text" lines={3} />
      <div className="flex justify-between items-center">
        <Skeleton width={80} height={32} />
        <Skeleton width={100} height={32} />
      </div>
    </div>
  );
};

// Progress Bar Component
interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  variant?: "default" | "success" | "warning" | "error";
  size?: "sm" | "default" | "lg";
  showValue?: boolean;
  indeterminate?: boolean;
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ 
    value, 
    max = 100, 
    className, 
    variant = "default",
    size = "default",
    showValue = false,
    indeterminate = false,
    ...props 
  }, ref) => {
    const percentage = Math.min((value / max) * 100, 100);
    
    const variants = {
      default: "bg-primary",
      success: "bg-success",
      warning: "bg-warning",
      error: "bg-destructive",
    };
    
    const sizes = {
      sm: "h-1",
      default: "h-2",
      lg: "h-3",
    };
    
    return (
      <div className={cn("w-full", className)} ref={ref} {...props}>
        <div className={cn(
          "bg-secondary rounded-full overflow-hidden",
          sizes[size]
        )}>
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out",
              variants[variant],
              indeterminate && "animate-progress-indeterminate"
            )}
            style={{
              width: indeterminate ? "30%" : `${percentage}%`,
              transform: indeterminate ? "translateX(-100%)" : undefined,
            }}
          />
        </div>
        {showValue && !indeterminate && (
          <div className="mt-1 text-xs text-muted-foreground text-right">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    );
  }
);
ProgressBar.displayName = "ProgressBar";

// Button Loading State
interface ButtonLoadingProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ButtonLoading = ({ loading, children, className }: ButtonLoadingProps) => {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      {loading && <Spinner size="xs" />}
      <span className={cn(loading && "opacity-70")}>{children}</span>
    </span>
  );
};