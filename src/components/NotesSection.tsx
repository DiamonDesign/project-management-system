import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import { useProjectContext } from "@/context/ProjectContext";
import { showSuccess, showError } from "@/utils/toast";

interface NotesSectionProps {
  projectId: string;
}

export const NotesSection = ({ projectId }: NotesSectionProps) => {
  const { projects, addNoteToProject, deleteNoteFromProject } = useProjectContext();
  const project = projects.find(p => p.id === projectId);
  const [newNoteContent, setNewNoteContent] = useState("");

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      addNoteToProject(projectId, newNoteContent.trim());
      setNewNoteContent("");
      showSuccess("Nota añadida.");
    } else {
      showError("La nota no puede estar vacía.");
    }
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNoteFromProject(projectId, noteId);
    showSuccess("Nota eliminada.");
  };

  if (!project) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Notas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="Añadir nueva nota..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddNote();
              }
            }}
          />
          <Button onClick={handleAddNote}>Añadir</Button>
        </div>
        {project.notes.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay notas para este proyecto.</p>
        ) : (
          <ScrollArea className="h-48 w-full rounded-md border p-4">
            <ul className="space-y-2">
              {project.notes.map((note) => (
                <li key={note.id} className="flex items-center justify-between text-sm">
                  <span className="flex-1 pr-2">{note.content}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};