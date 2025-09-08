import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Star, StarOff, Trash2, Edit3 } from "lucide-react";
import { useProjectContext } from "@/context/ProjectContext";
import { showSuccess, showError } from "@/utils/toast";
import { PAGE_TYPE_CONFIG, type Page, type PageType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { sanitizeHtml, validationSchemas } from "@/lib/security";
import LazyRichTextEditor from './LazyRichTextEditor';
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

interface PageEditorProps {
  projectId: string;
  page: Page;
  onClose: () => void;
}

export const PageEditor = ({ projectId, page, onClose }: PageEditorProps) => {
  const { updatePageInProject, deletePageFromProject } = useProjectContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [icon, setIcon] = useState(page.icon || '');
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<string[]>(page.tags || []);
  const [isSaving, setIsSaving] = useState(false);

  const typeConfig = PAGE_TYPE_CONFIG[page.page_type];

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean']
    ],
  }), []);

  const formats = useMemo(() => [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'blockquote', 'code-block',
    'list', 'bullet', 'indent',
    'link', 'image'
  ], []);

  const handleSave = async () => {
    try {
      // Validate input using Zod schemas
      const titleResult = validationSchemas.noteTitle.safeParse(title);
      const contentResult = validationSchemas.noteContent.safeParse(content);
      
      if (!titleResult.success) {
        showError(titleResult.error.errors[0].message);
        return;
      }
      
      if (!contentResult.success) {
        showError(contentResult.error.errors[0].message);
        return;
      }

      if (!title.trim()) {
        showError("El título es obligatorio");
        return;
      }

      setIsSaving(true);

      const updatedFields: Partial<Page> = {
        title: titleResult.data,
        content: contentResult.data,
        icon: icon || typeConfig.icon,
        tags: tags.filter(tag => tag.trim() !== ""),
      };

      await updatePageInProject(projectId, page.id, updatedFields);
      showSuccess("Página guardada");
      setIsEditing(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al guardar la página: " + errorMessage);
      console.error("Error saving page:", error);
    } finally {
      setIsSaving(false);
    }
  };

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
      onClose();
    } catch (error) {
      showError("Error al eliminar la página");
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleCancel = () => {
    setTitle(page.title);
    setContent(page.content);
    setIcon(page.icon || '');
    setTags(page.tags || []);
    setIsEditing(false);
  };

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex-1 min-w-0 space-y-2">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        placeholder={typeConfig.icon}
                        className="w-16 text-center"
                        maxLength={4}
                      />
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg font-semibold flex-1"
                        placeholder="Título de la página..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h1 className="text-xl font-semibold flex items-center gap-2">
                      <span>{icon || typeConfig.icon}</span>
                      <span>{page.title}</span>
                      {page.is_favorited && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {typeConfig.icon} {typeConfig.name}
                      </Badge>
                      <span>•</span>
                      <span>Creado {formatDate(page.created_at)}</span>
                      {page.updated_at && page.updated_at !== page.created_at && (
                        <>
                          <span>•</span>
                          <span>Editado {formatDate(page.updated_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || !title.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Guardando..." : "Guardar"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleFavorite}
                  >
                    {page.is_favorited ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
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
                </>
              )}
            </div>
          </div>

          {/* Tags */}
          {(tags.length > 0 || isEditing) && (
            <div className="space-y-2 pt-2 border-t">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Añadir etiqueta..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="text-sm"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                    >
                      Añadir
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Content */}
      <Card className="min-h-[500px]">
        <CardContent className="p-6">
          {isEditing ? (
            <LazyRichTextEditor
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              formats={formats}
              className="min-h-[400px]"
              placeholder="Escribe el contenido de tu página..."
            />
          ) : (
            <div 
              className="prose prose-sm max-w-none quill-content min-h-[400px]"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};