import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:flex-shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] shadow-card",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20 hover:shadow-card",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-card hover:scale-[1.01] active:scale-[0.99]",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        success: "bg-success text-success-foreground hover:bg-success/90 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        info: "bg-info text-info-foreground hover:bg-info/90 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]",
        gradient: "bg-gradient-primary text-primary-foreground hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98]",
        glass: "glass text-foreground hover:bg-accent/20 backdrop-blur-sm",
      },
      size: {
        xs: "h-11 px-3 text-xs rounded-sm", // 44px minimum - Apple HIG compliant
        sm: "h-11 px-4 text-sm rounded-md", // 44px minimum - Apple HIG compliant
        default: "h-11 px-6 py-2", // 44px minimum - Apple HIG compliant
        lg: "h-12 px-8 text-base rounded-lg", // Already compliant
        xl: "h-14 px-10 text-lg rounded-xl", // Enhanced for better touch
        icon: "h-11 w-11", // 44px minimum - Apple HIG compliant
        "icon-sm": "h-11 w-11", // 44px minimum - consistency
        "icon-lg": "h-12 w-12", // Already compliant
      },
      loading: {
        true: "cursor-not-allowed",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        )}
        {!loading && leftIcon && leftIcon}
        <span className={cn(loading && "opacity-0")}>
          {loading && loadingText ? loadingText : children}
        </span>
        {!loading && rightIcon && rightIcon}
        
        {/* Ripple effect overlay */}
        <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute inset-0 bg-white/20 transform scale-0 group-active:scale-100 group-active:opacity-30 transition-all duration-150 ease-out opacity-0" />
        </div>
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
