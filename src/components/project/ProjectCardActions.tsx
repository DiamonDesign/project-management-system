import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Eye,
  Edit3,
  Settings,
  Archive,
  Trash2,
} from "lucide-react";

interface ProjectCardActionsProps {
  projectId: string;
  isArchived?: boolean;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  variant?: 'card' | 'list';
}

export const ProjectCardActions: React.FC<ProjectCardActionsProps> = ({
  projectId,
  isArchived = false,
  onView,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
  variant = 'card'
}) => {
  const handleView = () => onView?.(projectId);
  const handleEdit = () => onEdit?.(projectId);
  const handleArchive = () => onArchive?.(projectId);
  const handleUnarchive = () => onUnarchive?.(projectId);
  const handleDelete = () => onDelete?.(projectId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 opacity-60 hover:opacity-100"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleView} className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Ver proyecto
        </DropdownMenuItem>

        {!isArchived && (
          <>
            <DropdownMenuItem onClick={handleEdit} className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleArchive} className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archivar
            </DropdownMenuItem>
          </>
        )}

        {isArchived && (
          <>
            <DropdownMenuItem onClick={handleUnarchive} className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Desarchivar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar definitivamente
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};