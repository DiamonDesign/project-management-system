import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Star, StarOff } from "lucide-react";
import { useProjectContext } from "@/context/ProjectContext";
import { showSuccess, showError } from "@/utils/toast";
import { PAGE_TYPE_CONFIG, type Page } from "@/types";
import { sanitizeHtml } from "@/lib/security";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PageCardProps {
  page: Page;
  projectId: string;
  onEdit: () => void;
}

export const PageCard = ({ page, projectId, onEdit }: PageCardProps) => {
  const { updatePageInProject, deletePageFromProject } = useProjectContext();

  const typeConfig = PAGE_TYPE_CONFIG[page.page_type];
  
  const handleToggleFavorite = async () => {
    try {
      await updatePageInProject(projectId, page.id, {
        is_favorited: !page.is_favorited
      });
      showSuccess(page.is_favorited ? "Página quitada de favoritos" : "Página añadida a favoritos");
    } catch (error) {
      showError("Error al actualizar favorito");
    }
  };

  const handleDeletePage = async () => {
    try {
      await deletePageFromProject(projectId, page.id);
      showSuccess("Página eliminada");
    } catch (error) {
      showError("Error al eliminar la página");
    }
  };

  // Extract preview text from content (remove HTML tags)
  const getPreviewText = (content: string, maxLength: number = 120) => {
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    return textContent.length > maxLength 
      ? textContent.substring(0, maxLength) + '...'
      : textContent || 'Sin contenido';
  };

  // Format creation date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className={`group cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${typeConfig.color}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <span className="text-base shrink-0">{page.icon || typeConfig.icon}</span>
              <div className="min-w-0 flex-1">
                <h3 
                  className="font-medium text-sm line-clamp-2 text-foreground hover:text-primary transition-colors"
                  onClick={onEdit}
                  title={page.title}
                >
                  {page.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {typeConfig.name}
                  </span>
                  {page.tags && page.tags.length > 0 && (
                    <div className="flex gap-1">
                      {page.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block px-1.5 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                      {page.tags.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{page.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Favorite Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite();
              }}
            >
              {page.is_favorited ? (
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>
          </div>

          {/* Content Preview */}
          <div 
            className="text-xs text-muted-foreground line-clamp-3 cursor-pointer"
            onClick={onEdit}
          >
            {getPreviewText(page.content)}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatDate(page.updated_at || page.created_at)}
            </span>
            
            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar página?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. La página "{page.title}" será eliminada permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeletePage}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};