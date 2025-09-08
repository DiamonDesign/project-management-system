import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Pencil, Save, X } from "lucide-react";
import { useProjectContext } from "@/context/ProjectContext";
import { showSuccess, showError } from "@/utils/toast";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import { Input } from "@/components/ui/input";

interface NotesSectionProps {
  projectId: string;
}

export const NotesSection = ({ projectId }: NotesSectionProps) => {
  const { projects, addNoteToProject, deleteNoteFromProject, updateProject } = useProjectContext();
  const project = projects.find(p => p.id === projectId);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState("");
  const [editingNoteContent, setEditingNoteContent] = useState("");

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link'
  ];

  const handleAddNote = () => {
    if ((newNoteTitle.trim() === "" && (newNoteContent.trim() === "" || newNoteContent === "<p><br></p>"))) {
      showError("La nota debe tener al menos un título o contenido.");
      return;
    }
    addNoteToProject(projectId, newNoteTitle.trim(), newNoteContent.trim());
    setNewNoteTitle("");
    setNewNoteContent("");
    showSuccess("Nota añadida.");
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNoteFromProject(projectId, noteId);
    showSuccess("Nota eliminada.");
  };

  const handleEditNote = (noteId: string, currentTitle: string, currentContent: string) => {
    setEditingNoteId(noteId);
    setEditingNoteTitle(currentTitle || "");
    setEditingNoteContent(currentContent || "");
  };

  const handleSaveNote = (noteId: string) => {
    if ((editingNoteTitle.trim() === "" && (editingNoteContent.trim() === "" || editingNoteContent === "<p><br></p>"))) {
      showError("La nota debe tener al menos un título o contenido.");
      return;
    }
    const updatedNotes = project?.notes.map(note =>
      note.id === noteId ? { ...note, title: editingNoteTitle.trim(), content: editingNoteContent.trim() } : note
    );
    if (project && updatedNotes) {
      updateProject(projectId, { notes: updatedNotes });
      showSuccess("Nota actualizada.");
      setEditingNoteId(null);
      setEditingNoteTitle("");
      setEditingNoteContent("");
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteTitle("");
    setEditingNoteContent("");
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
        <div className="mb-4">
          <Input placeholder="Título de la nota (opcional)" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} className="mb-2" />
          <ReactQuill
            theme="snow"
            value={newNoteContent}
            onChange={setNewNoteContent}
            modules={modules}
            formats={formats}
            placeholder="Añadir nueva nota..."
            className="mb-2 h-32"
          />
          <Button onClick={handleAddNote} className="w-full mt-2">Añadir Nota</Button>
        </div>
        {project.notes.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay notas para este proyecto.</p>
        ) : (
          <ScrollArea className="h-64 w-full rounded-md border p-4">
            <ul className="space-y-4">
              {project.notes.map((note) => (
                <li key={note.id} className="flex flex-col p-2 border rounded-md bg-secondary/20">
                  {editingNoteId === note.id ? (
                    <>
                      <Input placeholder="Título de la nota (opcional)" value={editingNoteTitle} onChange={(e) => setEditingNoteTitle(e.target.value)} className="mb-2" />
                      <ReactQuill
                        theme="snow"
                        value={editingNoteContent}
                        onChange={setEditingNoteContent}
                        modules={modules}
                        formats={formats}
                        className="mb-2 h-32"
                      />
                    </>
                  ) : (
                    <>
                      {note.title && <h4 className="font-semibold mb-2 text-sm">{note.title}</h4>}
                      <div className="flex-1 pr-2 text-sm quill-content" dangerouslySetInnerHTML={{ __html: note.content }} />
                    </>
                  )}
                  <div className="flex justify-end space-x-1 mt-2">
                    {editingNoteId === note.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveNote(note.id)}
                          className="text-green-600 hover:bg-green-600/10"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="text-gray-500 hover:bg-gray-500/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditNote(note.id, note.title || "", note.content)}
                        className="text-blue-600 hover:bg-blue-600/10"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};