import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProjectContext } from "@/context/ProjectContext";
import { showSuccess, showError } from "@/utils/toast";
import { PAGE_TYPE_CONFIG, PAGE_TEMPLATES, type PageType, type PageFormData } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface AddPageDialogProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AddPageDialog = ({ projectId, isOpen, onClose }: AddPageDialogProps) => {
  // TODO: Implement PageContext when separating page functionality
  // const { addPageToProject } = useProjectContext();
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<PageType>('general');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customIcon, setCustomIcon] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = () => {
    setTitle("");
    setSelectedType('general');
    setSelectedTemplate(null);
    setCustomIcon("");
    setTags([]);
    setNewTag("");
    setIsLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const availableTemplates = useMemo(() => {
    return PAGE_TEMPLATES.filter(template => 
      selectedType === 'general' || template.page_type === selectedType
    );
  }, [selectedType]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      showError("El título es obligatorio");
      return;
    }

    setIsLoading(true);

    try {
      const selectedTemplateData = selectedTemplate 
        ? PAGE_TEMPLATES.find(t => t.id === selectedTemplate)
        : null;

      const pageData: PageFormData = {
        title: title.trim(),
        content: selectedTemplateData?.content_template || "<p>Escribe aquí el contenido de tu página...</p>",
        page_type: selectedType,
        icon: customIcon || PAGE_TYPE_CONFIG[selectedType].icon,
        tags: tags.filter(tag => tag.trim() !== ""),
      };

      // TODO: Implement PageContext when separating page functionality
      // await addPageToProject(projectId, pageData);
      console.log("Page creation temporarily disabled - implement PageContext");
      showSuccess("Funcionalidad de páginas temporalmente deshabilitada");
      handleClose();
    } catch (error) {
      console.error("Error creating page:", error);
      showError("Error al crear la página");
    } finally {
      setIsLoading(false);
    }
  };

  const typeConfig = PAGE_TYPE_CONFIG[selectedType];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Página</DialogTitle>
          <DialogDescription>
            Crea una nueva página para organizar la información de tu proyecto
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Nombre de la página..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Page Type Selection */}
          <div className="space-y-3">
            <Label>Tipo de página</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(PAGE_TYPE_CONFIG).map(([type, config]) => (
                <Card
                  key={type}
                  className={`cursor-pointer transition-all ${
                    selectedType === type 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setSelectedType(type as PageType)}
                >
                  <CardContent className="p-3 text-center">
                    <div className="text-lg mb-1">{config.icon}</div>
                    <div className="text-xs font-medium">{config.name}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {typeConfig.description}
            </p>
          </div>

          {/* Template Selection */}
          {availableTemplates.length > 0 && (
            <div className="space-y-3">
              <Label>Plantilla (opcional)</Label>
              <div className="space-y-2">
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedTemplate === null 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setSelectedTemplate(null)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="text-lg">📄</div>
                      <div>
                        <div className="text-sm font-medium">Página en blanco</div>
                        <div className="text-xs text-muted-foreground">
                          Comenzar con una página vacía
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {availableTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate === template.id 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'hover:border-muted-foreground/30'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="text-lg">{template.icon}</div>
                        <div>
                          <div className="text-sm font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {template.description}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Custom Icon */}
          <div className="space-y-2">
            <Label htmlFor="icon">Icono personalizado (opcional)</Label>
            <Input
              id="icon"
              placeholder={`Por defecto: ${typeConfig.icon}`}
              value={customIcon}
              onChange={(e) => setCustomIcon(e.target.value)}
              disabled={isLoading}
              maxLength={4}
            />
            <p className="text-xs text-muted-foreground">
              Puedes usar emojis para personalizar tu página
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label>Etiquetas (opcional)</Label>
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
                disabled={isLoading}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddTag}
                disabled={!newTag.trim() || isLoading}
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

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !title.trim()}
            >
              {isLoading ? "Creando..." : "Crear Página"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};