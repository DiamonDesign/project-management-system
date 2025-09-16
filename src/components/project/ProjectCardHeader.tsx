import React from "react";
import { Badge } from "@/components/ui/badge";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PROJECT_TYPE_CONFIG, ProjectType } from "@/types";

interface ProjectCardHeaderProps {
  name: string;
  description: string;
  projectType?: ProjectType;
  status: 'pending' | 'in-progress' | 'completed';
}

export const ProjectCardHeader: React.FC<ProjectCardHeaderProps> = ({
  name,
  description,
  projectType,
  status
}) => {
  const typeConfig = projectType ? PROJECT_TYPE_CONFIG[projectType] : null;
  const statusConfig = {
    pending: { label: "Pendiente", variant: "secondary" as const },
    "in-progress": { label: "En Progreso", variant: "default" as const },
    completed: { label: "Completado", variant: "outline" as const }
  };

  return (
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base font-semibold leading-tight mb-1 line-clamp-2">
            {name}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </CardDescription>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          {typeConfig && (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 h-5 whitespace-nowrap"
              style={{
                backgroundColor: `${typeConfig.color}15`,
                borderColor: typeConfig.color,
                color: typeConfig.color
              }}
            >
              {typeConfig.label}
            </Badge>
          )}
          <Badge
            variant={statusConfig[status].variant}
            className="text-xs px-2 py-0.5 h-5 whitespace-nowrap"
          >
            {statusConfig[status].label}
          </Badge>
        </div>
      </div>
    </CardHeader>
  );
};