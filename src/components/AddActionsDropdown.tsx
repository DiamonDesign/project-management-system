import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle } from "lucide-react";
import { AddProjectDialog } from "@/components/AddProjectDialog";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { AddClientDialog } from "@/components/AddClientDialog";
import { useProjectContext } from "@/context/ProjectContext"; // Importar useProjectContext

export const AddActionsDropdown = () => {
  const { addProject } = useProjectContext(); // Obtener addProject del contexto
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false); // State for project dialog
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false); // State for task dialog
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false); // State for client dialog

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-10 relative flex items-center justify-center pl-9 pr-4 whitespace-nowrap text-sm font-medium">
            {/* Icono absoluto a la izquierda */}
            <PlusCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
            
            {/* Texto centrado */}
            <span className="text-sm font-medium">Añadir Nuevo</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsProjectDialogOpen(true)}> {/* Open project dialog */}
            Proyecto
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsTaskDialogOpen(true)}> {/* Open task dialog */}
            Tarea
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsClientDialogOpen(true)}> {/* Open client dialog */}
            Cliente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Render the dialogs outside the DropdownMenu, controlled by state */}
      <AddProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        onAddProject={addProject}
      />
      <AddTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
      />
      <AddClientDialog
        open={isClientDialogOpen}
        onOpenChange={setIsClientDialogOpen}
      />
    </>
  );
};