import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  Briefcase, 
  LogOut, 
  ListChecks, 
  Settings,
  ChevronRight,
  BarChart3,
  Bell,
  Search,
  Zap,
  Star,
  Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { useProjectContext } from "@/context/ProjectContext";
import { useClientContext } from "@/context/ClientContext";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { QuickActionsButton } from "@/components/QuickActionsButton";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
  onOpenSearch?: () => void;
}

export const Sidebar = ({ isMobile = false, onClose, onOpenSearch }: SidebarProps) => {
  const { signOut, user } = useSession();
  const location = useLocation();

  const { projects, archivedProjects } = useProjectContext();
  const { clients } = useClientContext();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Calculate stats for badges
  const activeProjects = projects.filter(p => p.status === 'in-progress').length;
  const pendingTasks = projects.flatMap(p => p.tasks.filter(t => t.status !== 'completed')).length;
  const totalClients = clients.length;
  const archivedCount = archivedProjects.length;
  
  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      requiresAuth: true,
      badge: null,
    },
    {
      name: "Proyectos",
      href: "/projects",
      icon: Briefcase,
      requiresAuth: true,
      badge: activeProjects > 0 ? activeProjects.toString() : null,
    },
    {
      name: "Tareas",
      href: "/tasks",
      icon: ListChecks,
      requiresAuth: true,
      badge: pendingTasks > 0 ? pendingTasks.toString() : null,
    },
    {
      name: "Clientes",
      href: "/clients",
      icon: Users,
      requiresAuth: true,
      badge: null,
    },
    {
      name: "Archivados",
      href: "/projects/archived",
      icon: Archive,
      requiresAuth: true,
      badge: archivedCount > 0 ? archivedCount.toString() : null,
    },
    {
      name: "Analíticas",
      href: "/analytics",
      icon: BarChart3,
      requiresAuth: true,
      badge: null,
    },
  ];
  
  const userInitials = user?.email?.charAt(0).toUpperCase() || 'U';
  const userName = user?.email?.split('@')[0] || 'Usuario';

  const handleSignOut = async () => {
    await signOut();
    if (onClose) onClose();
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-sidebar/95 backdrop-blur-sm text-sidebar-foreground border-r border-sidebar-border/50 shadow-lg",
        isMobile ? "w-64 p-4" : "w-64 p-4",
        "animate-slide-right"
      )}
    >
      {/* Enhanced Header */}
      <div className="flex items-center justify-center h-16 mb-6">
        <Link 
          to="/dashboard" 
          className="group flex items-center gap-3 hover:scale-105 transition-transform duration-200"
          onClick={onClose}
        >
          <div className="p-2 bg-gradient-primary rounded-xl shadow-glow group-hover:shadow-glow-lg transition-all">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold bg-gradient-to-r from-sidebar-primary to-sidebar-primary/70 bg-clip-text text-transparent">
              FreelanceFlow
            </span>
            <span className="text-xs text-muted-foreground">Gestión de proyectos</span>
          </div>
        </Link>
      </div>
      
      {/* Removed user profile from top - moved to bottom */}
      <Separator className="mb-4" />
      
      {/* Navigation */}
      <nav className="flex-grow space-y-1">
        <div className="px-2 mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Principal
          </p>
        </div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const isHovered = hoveredItem === item.name;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-0 h-full w-1 bg-white rounded-r-full" />
              )}
              
              {/* Icon with animation */}
              <div className={cn(
                "flex items-center justify-center w-5 h-5 shrink-0 transition-all duration-200",
                isActive && "scale-110",
                isHovered && !isActive && "scale-105"
              )}>
                <item.icon className="h-5 w-5" />
              </div>
              
              {/* Label */}
              <span className="flex-1">{item.name}</span>
              
              {/* Badge */}
              {item.badge && (
                <Badge 
                  variant={isActive ? "secondary" : "outline"} 
                  className={cn(
                    "h-5 px-2 text-xs font-medium animate-pulse-glow",
                    isActive && "bg-white/20 text-white border-white/30"
                  )}
                >
                  {item.badge}
                </Badge>
              )}
              
              {/* Chevron indicator */}
              <ChevronRight className={cn(
                "h-4 w-4 opacity-0 transition-all duration-200",
                isHovered && "opacity-50 translate-x-1"
              )} />
              
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </Link>
          );
        })}
        
        <Separator className="my-4" />
        
        {/* Quick Actions */}
        <div className="px-2 mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Rápido
          </p>
        </div>
        
        <Button 
          variant="ghost" 
          className="w-full h-10 relative flex items-center justify-between pl-11 pr-3 whitespace-nowrap text-sm font-medium hover:bg-sidebar-accent hover:translate-x-1 transition-all duration-200 group"
          onClick={onOpenSearch}
        >
          {/* Icono absoluto a la izquierda */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
          
          {/* Texto alineado a la izquierda */}
          <span className="text-sm font-medium text-left">Buscar...</span>
          
          {/* Shortcut absoluto a la derecha */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground opacity-60 group-hover:opacity-100 pointer-events-none">⌘K</span>
        </Button>
        
        <QuickActionsButton />
      </nav>
      
      {/* Footer Section */}
      <div className="mt-auto pt-4 space-y-2">
        <Separator className="mb-4" />
        
        {/* User Profile Section - Moved to bottom with settings functionality */}
        <Link
          to="/profile"
          onClick={onClose}
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1 border border-transparent hover:border-sidebar-accent/20",
            location.pathname === "/profile" && "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-accent/20"
          )}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src="" alt={userName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground">Configuración</p>
          </div>
          <Settings className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
        </Link>
        
        {/* Sign Out Button */}
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group px-3 py-2.5 gap-3"
          onClick={handleSignOut}
        >
          <div className="flex items-center justify-center w-4 h-4 shrink-0">
            <LogOut className="h-4 w-4" />
          </div>
          <span className="flex-1 text-left">Cerrar Sesión</span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          </div>
        </Button>
      </div>
    </div>
  );
};