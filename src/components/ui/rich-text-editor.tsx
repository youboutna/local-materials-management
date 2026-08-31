/**
 * RichTextEditor — éditeur WYSIWYG minimal (tiptap) utilisé pour le corps
 * des contrats. Présentation uniquement : la valeur remonte en HTML.
 */
import * as React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Heading2, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Rédigez le contenu du contrat…',
  className,
  editable = true,
}) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editable,
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[160px] px-3 py-2 focus:outline-none text-foreground',
        'data-placeholder': placeholder,
      },
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    if ((value || '') !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const toolButton = (
    key: string,
    icon: React.ReactNode,
    action: () => void,
    active?: boolean,
  ) => (
    <Button
      key={key}
      type="button"
      size="sm"
      variant={active ? 'secondary' : 'ghost'}
      className="h-7 w-7 p-0"
      onClick={action}
      aria-label={key}
    >
      {icon}
    </Button>
  );

  return (
    <div className={cn('rounded-md border border-input bg-background', className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1">
        {toolButton('gras', <Bold className="h-3.5 w-3.5" />, () =>
          editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
        {toolButton('italique', <Italic className="h-3.5 w-3.5" />, () =>
          editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
        {toolButton('titre', <Heading2 className="h-3.5 w-3.5" />, () =>
          editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
        {toolButton('liste', <List className="h-3.5 w-3.5" />, () =>
          editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
        {toolButton('liste-ordonnee', <ListOrdered className="h-3.5 w-3.5" />, () =>
          editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
        <span className="mx-1 h-4 w-px bg-border" />
        {toolButton('annuler', <Undo2 className="h-3.5 w-3.5" />, () =>
          editor.chain().focus().undo().run())}
        {toolButton('refaire', <Redo2 className="h-3.5 w-3.5" />, () =>
          editor.chain().focus().redo().run())}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
