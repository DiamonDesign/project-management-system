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
import { useProjectContext } from "@/context/ProjectContext"; // Importar useProjectContext

export const AddActionsDropdown = () => {
  const { addProject } = useProjectContext(); // Obtener addProject del contexto
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false); // State for project dialog
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false); // State for task dialog

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Añadir Nuevo
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsProjectDialogOpen(true)}> {/* Open project dialog */}
            Proyecto
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsTaskDialogOpen(true)}> {/* Open task dialog */}
            Tarea
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
    </>
  );
};