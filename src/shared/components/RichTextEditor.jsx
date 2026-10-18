import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import clsx from 'clsx';

function ToolbarButton({ onClick, active, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        'px-2 py-1 text-sm rounded transition-colors',
        active ? 'bg-brand-100 text-brand-800' : 'text-dark-600 hover:bg-dark-100'
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[120px] px-3 py-2 text-sm prose prose-sm max-w-none [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  return (
    <div className="border border-dark-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-700">
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-dark-200 bg-dark-50">
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive('strike')} title="Strikethrough">
          <s>S</s>
        </ToolbarButton>
        <div className="w-px bg-dark-200 mx-1" />
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet list">
          • List
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Ordered list">
          1. List
        </ToolbarButton>
        <div className="w-px bg-dark-200 mx-1" />
        <ToolbarButton onClick={() => editor?.chain().focus().setParagraph().run()} active={editor?.isActive('paragraph')} title="Paragraph">
          P
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="Heading">
          H3
        </ToolbarButton>
      </div>
      {editor && !editor.getText() && placeholder && (
        <div className="absolute pointer-events-none px-3 py-2 text-sm text-dark-400">{placeholder}</div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;
