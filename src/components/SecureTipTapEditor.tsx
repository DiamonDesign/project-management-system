import React, { Suspense, useState, useCallback } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import DOMPurify from 'dompurify';
import { PageLoading } from '@/components/ui/loading';
import { AlertTriangle, Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SecureTipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

// Toolbar component
const EditorToolbar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('URL del enlace:');
    if (url) {
      // Sanitize URL
      const sanitizedUrl = DOMPurify.sanitize(url);
      editor.chain().focus().setLink({ href: sanitizedUrl }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('URL de la imagen:');
    if (url) {
      // Sanitize URL and add image
      const sanitizedUrl = DOMPurify.sanitize(url);
      editor.chain().focus().setImage({ src: sanitizedUrl }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border-b bg-gray-50 p-2 flex gap-1 flex-wrap">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-gray-200' : ''}
        title="Negrita"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-gray-200' : ''}
        title="Cursiva"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
        title="Lista con viñetas"
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
        title="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={addLink}
        className={editor.isActive('link') ? 'bg-gray-200' : ''}
        title="Agregar enlace"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={addImage}
        title="Agregar imagen"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Loading skeleton for the editor
const EditorSkeleton = () => (
  <div className="border rounded-md">
    <div className="h-12 bg-gray-100 border-b animate-pulse"></div>
    <div className="h-32 bg-white p-3">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
      </div>
    </div>
  </div>
);

// Fallback editor component
const FallbackEditor: React.FC<SecureTipTapEditorProps> = ({ value, onChange, placeholder, className, readOnly }) => {
  const textValue = typeof value === 'string' ? value.replace(/<[^>]*>/g, '') : '';

  return (
    <div className={`border rounded-md bg-white ${className || ''}`}>
      <div className="flex items-center gap-2 text-amber-600 p-2 border-b bg-amber-50">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">Editor básico</span>
      </div>
      <textarea
        className="w-full h-24 min-h-[100px] resize-none border-0 bg-transparent outline-none p-3"
        value={textValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Escribe aquí...'}
        readOnly={readOnly}
      />
    </div>
  );
};

// Main editor component
const TipTapEditor: React.FC<SecureTipTapEditorProps> = ({ value, onChange, placeholder, className, readOnly = false }) => {
  const [isError, setIsError] = useState(false);

  // Sanitize content before setting it
  const sanitizedValue = React.useMemo(() => {
    if (!value) return '';
    return DOMPurify.sanitize(value, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
      ALLOW_DATA_ATTR: false,
    });
  }, [value]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
    ],
    content: sanitizedValue,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Sanitize output before calling onChange
      const sanitizedHtml = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
        ALLOW_DATA_ATTR: false,
      });
      onChange(sanitizedHtml);
    },
    onError: (error) => {
      console.error('TipTap editor error:', error);
      setIsError(true);
    },
  });

  // Update editor content when value changes externally
  React.useEffect(() => {
    if (editor && sanitizedValue !== editor.getHTML()) {
      editor.commands.setContent(sanitizedValue);
    }
  }, [editor, sanitizedValue]);

  if (isError) {
    return <FallbackEditor value={value} onChange={onChange} placeholder={placeholder} className={className} readOnly={readOnly} />;
  }

  if (!editor) {
    return <EditorSkeleton />;
  }

  return (
    <div className={`border rounded-md bg-white ${className || ''}`}>
      {!readOnly && <EditorToolbar editor={editor} />}
      <div className="prose prose-sm max-w-none p-3 min-h-[100px] focus-within:outline-none">
        <EditorContent
          editor={editor}
          className="outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[100px]"
        />
      </div>
      {editor.isEmpty && placeholder && (
        <div className="absolute top-16 left-3 text-gray-400 pointer-events-none text-sm">
          {placeholder}
        </div>
      )}
    </div>
  );
};

// Error boundary for the editor
interface EditorErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class EditorErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackProps: SecureTipTapEditorProps },
  EditorErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallbackProps: SecureTipTapEditorProps }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): EditorErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TipTap editor error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <FallbackEditor {...this.props.fallbackProps} />;
    }

    return this.props.children;
  }
}

// Main exported component with error boundary
export const SecureTipTapEditor: React.FC<SecureTipTapEditorProps> = (props) => {
  return (
    <EditorErrorBoundary fallbackProps={props}>
      <Suspense fallback={<EditorSkeleton />}>
        <TipTapEditor {...props} />
      </Suspense>
    </EditorErrorBoundary>
  );
};

export default SecureTipTapEditor;