import React, { Suspense } from 'react';
import { PageLoading } from '@/components/ui/loading';

// Lazy load ReactQuill to reduce main bundle size
const LazyReactQuill = React.lazy(() => 
  import('react-quill').then(module => ({ 
    default: module.default 
  }))
);

// Import styles asynchronously
const loadQuillStyles = () => {
  import('react-quill/dist/quill.snow.css');
};

interface LazyRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  modules?: any;
  formats?: string[];
  style?: React.CSSProperties;
  className?: string;
}

// Loading component for the editor
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

export const LazyRichTextEditor: React.FC<LazyRichTextEditorProps> = (props) => {
  // Load styles on mount
  React.useEffect(() => {
    loadQuillStyles();
  }, []);

  return (
    <Suspense fallback={<EditorSkeleton />}>
      <LazyReactQuill {...props} />
    </Suspense>
  );
};

export default LazyRichTextEditor;