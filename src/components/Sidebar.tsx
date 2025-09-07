import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Users, Briefcase, LogOut, ListChecks, Settings } from "lucide-react"; // Importar Settings
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isMobile = false, onClose }: SidebarProps) => {
  const { signOut } = useSession();
  const location = useLocation();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      requiresAuth: true,
    },
    {
      name: "Proyectos",
      href: "/projects",
      icon: Briefcase,
      requiresAuth: true,
    },
    {
      name: "Tareas",
      href: "/tasks",
      icon: ListChecks,
      requiresAuth: true,
    },
    {
      name: "Clientes",
      href: "/clients",
      icon: Users,
      requiresAuth: true,
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    if (onClose) onClose();
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
        isMobile ? "w-64 p-4" : "w-64 p-4"
      )}
    >
      <div className="flex items-center justify-center h-16 border-b border-sidebar-border mb-6">
        <Link to="/dashboard" className="text-2xl font-bold text-sidebar-primary-foreground flex items-center gap-2">
          <Briefcase className="h-7 w-7 text-sidebar-primary-foreground" />
          FreelanceFlow
        </Link>
      </div>
      <nav className="flex-grow space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              location.pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-sidebar-border">
        <Link
          to="/profile" // Enlace a la página de perfil/ajustes
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground mb-2",
            location.pathname === "/profile" && "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
        >
          <Settings className="h-5 w-5" />
          Ajustes de Usuario
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};