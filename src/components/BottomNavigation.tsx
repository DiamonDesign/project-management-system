import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  CheckSquare,
  BarChart3,
  User
} from 'lucide-react';

interface BottomNavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  isActive?: (pathname: string) => boolean;
}

const navItems: BottomNavItem[] = [
  {
    path: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    label: 'Dashboard',
    isActive: (pathname) => pathname === '/dashboard'
  },
  {
    path: '/projects',
    icon: <FolderOpen className="h-5 w-5" />,
    label: 'Projects',
    isActive: (pathname) => pathname.startsWith('/projects')
  },
  {
    path: '/clients',
    icon: <Users className="h-5 w-5" />,
    label: 'Clients',
    isActive: (pathname) => pathname.startsWith('/clients')
  },
  {
    path: '/tasks',
    icon: <CheckSquare className="h-5 w-5" />,
    label: 'Tasks',
    isActive: (pathname) => pathname === '/tasks'
  },
  {
    path: '/analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    label: 'Analytics',
    isActive: (pathname) => pathname === '/analytics'
  },
  {
    path: '/profile',
    icon: <User className="h-5 w-5" />,
    label: 'Profile',
    isActive: (pathname) => pathname === '/profile'
  }
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-lg"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="max-w-screen-xl mx-auto px-1">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = item.isActive 
              ? item.isActive(location.pathname)
              : location.pathname === item.path;

            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                className={cn(
                  // Base styles with Apple HIG compliant touch targets
                  "flex flex-col items-center justify-center gap-1 h-14 min-w-14 px-2 py-1",
                  "text-xs font-medium transition-all duration-200 rounded-lg",
                  "hover:bg-accent/50 active:bg-accent/80 active:scale-95",
                  // Active state with enhanced visibility
                  isActive 
                    ? "text-primary bg-primary/10 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground",
                  // Touch-friendly spacing
                  "relative"
                )}
                onClick={() => handleNavigation(item.path)}
                aria-label={`Navigate to ${item.label}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  {/* Icon with active indicator */}
                  <div className={cn(
                    "transition-transform duration-200",
                    isActive && "scale-110"
                  )}>
                    {item.icon}
                  </div>
                  
                  {/* Badge for notifications/counts */}
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center min-w-4"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </div>
                
                {/* Label */}
                <span className={cn(
                  "text-[10px] leading-tight truncate max-w-12 transition-colors duration-200",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>

                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -top-1 w-1 h-1 bg-primary rounded-full animate-pulse" />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Safe area padding for devices with home indicators */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
};

export default BottomNavigation;