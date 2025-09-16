import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { 
  Zap, 
  Plus, 
  FileText, 
  Users, 
  Calendar, 
  BarChart3,
  Clock,
  CheckSquare,
  Folder
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddProjectDialog } from "@/components/AddProjectDialog";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { useProjectContext } from "@/context/ProjectContext";

export const QuickActionsButton = () => {
  const navigate = useNavigate();
  const { addProject } = useProjectContext();
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  const quickActions = [
    {
      label: "Nuevo Proyecto",
      icon: Folder,
      action: () => setIsProjectDialogOpen(true),
      shortcut: "⌘+P"
    },
    {
      label: "Nueva Tarea",
      icon: CheckSquare,
      action: () => setIsTaskDialogOpen(true),
      shortcut: "⌘+T"
    },
    {
      separator: true
    },
    {
      label: "Ver Analíticas",
      icon: BarChart3,
      action: () => navigate("/analytics"),
      shortcut: "⌘+A"
    },
    {
      label: "Ver Tareas Pendientes",
      icon: Clock,
      action: () => navigate("/tasks"),
      shortcut: "⌘+Shift+T"
    },
    {
      label: "Ir al Dashboard",
      icon: Calendar,
      action: () => navigate("/dashboard"),
      shortcut: "⌘+D"
    }
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full h-10 relative flex items-center justify-between pl-11 pr-8 whitespace-nowrap text-sm font-medium hover:bg-sidebar-accent hover:translate-x-1 transition-all duration-200 group"
          >
            {/* Icono absoluto a la izquierda */}
            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
            
            {/* Texto alineado a la izquierda */}
            <span className="text-sm font-medium text-left">Acciones rápidas</span>
            
            {/* Icono Plus absoluto a la derecha */}
            <Plus className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="start" 
          side="right"
          className="w-64 ml-2"
        >
          <DropdownMenuLabel className="flex items-center gap-2 font-medium">
            <Zap className="h-4 w-4" />
            Acciones Rápidas
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {quickActions.map((action, index) => {
            if (action.separator) {
              return <DropdownMenuSeparator key={index} />;
            }
            
            return (
              <DropdownMenuItem
                key={index}
                onClick={action.action}
                className="flex items-center gap-3 py-2.5 cursor-pointer group"
              >
                <div className="flex items-center justify-center w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
                  <action.icon className="h-4 w-4" />
                </div>
                <span className="flex-1">{action.label}</span>
                {action.shortcut && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">
                    {action.shortcut}
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog Components */}
      <AddProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        onAddProject={addProject}
      />
      <AddTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
      />
    </>
  );
};