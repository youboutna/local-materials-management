// src/components/ui/rich-text-editor.tsx

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Undo2,
} from 'lucide-react';
import * as React from 'react';

// ============================================================================
// INTERFACES
// ============================================================================

interface RichTextEditorProps {
  /** Contenu HTML de l'éditeur */
  value: string;
  /** Callback déclenché à chaque modification */
  onChange: (html: string) => void;
  /** Placeholder affiché lorsque l'éditeur est vide */
  placeholder?: string;
  /** Classes CSS supplémentaires */
  className?: string;
  /** Mode lecture seule */
  editable?: boolean;
  /** Hauteur minimale en pixels */
  minHeight?: number;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Rédigez le contenu du contrat…',
  className,
  editable = true,
  minHeight = 160,
}) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editable,
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none px-3 py-2 text-foreground',
          'placeholder:text-muted-foreground',
          !editable && 'cursor-default'
        ),
        style: `min-height:${minHeight}px`,
        'data-placeholder': placeholder,
      },
    },
  });

  // Synchroniser la valeur externe
  React.useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if ((value || '') !== currentHtml) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  // ==========================================================================
  // RENDU
  // ==========================================================================

  if (!editor) return null;

  const renderToolButton = (
    key: string,
    icon: React.ReactNode,
    action: () => void,
    isActive?: boolean,
    disabled?: boolean
  ) => {
    const active = isActive !== undefined ? isActive : false;
    const isDisabled = disabled !== undefined ? disabled : !editable;

    return (
      <Button
        key={key}
        type="button"
        size="sm"
        variant={active ? 'secondary' : 'ghost'}
        className="h-7 w-7 p-0"
        onClick={action}
        disabled={isDisabled}
        aria-label={key}
      >
        {icon}
      </Button>
    );
  };

  return (
    <div className={cn('rounded-md border border-input bg-background', className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
        {/* Formatage du texte */}
        {renderToolButton(
          'gras',
          <Bold className="h-3.5 w-3.5" />,
          () => editor.chain().focus().toggleBold().run(),
          editor.isActive('bold')
        )}
        {renderToolButton(
          'italique',
          <Italic className="h-3.5 w-3.5" />,
          () => editor.chain().focus().toggleItalic().run(),
          editor.isActive('italic')
        )}
        {renderToolButton(
          'titre',
          <Heading2 className="h-3.5 w-3.5" />,
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          editor.isActive('heading', { level: 2 })
        )}
        {renderToolButton(
          'liste',
          <List className="h-3.5 w-3.5" />,
          () => editor.chain().focus().toggleBulletList().run(),
          editor.isActive('bulletList')
        )}
        {renderToolButton(
          'liste-ordonnee',
          <ListOrdered className="h-3.5 w-3.5" />,
          () => editor.chain().focus().toggleOrderedList().run(),
          editor.isActive('orderedList')
        )}

        <span className="mx-1 h-5 w-px bg-border" />

        {/* Annuler/Refaire */}
        {renderToolButton(
          'annuler',
          <Undo2 className="h-3.5 w-3.5" />,
          () => editor.chain().focus().undo().run(),
          false,
          !editor.can().undo()
        )}
        {renderToolButton(
          'refaire',
          <Redo2 className="h-3.5 w-3.5" />,
          () => editor.chain().focus().redo().run(),
          false,
          !editor.can().redo()
        )}
      </div>

      {/* Contenu de l'éditeur */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;