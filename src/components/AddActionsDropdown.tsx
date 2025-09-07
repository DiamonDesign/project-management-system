import React from "react";
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Añadir Nuevo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <AddProjectDialog onAddProject={addProject}>
            <Button variant="ghost" className="w-full justify-start">
              Proyecto
            </Button>
          </AddProjectDialog>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <AddTaskDialog>
            <Button variant="ghost" className="w-full justify-start">
              Tarea
            </Button>
          </AddTaskDialog>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};