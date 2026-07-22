// src/components/MessageBubble.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Message } from '@/types/chat';

export function MessageBubble({ message }: { message: Message }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: message.content,
    editable: false,
  });

  return (
    <div className={`group flex flex-col ${message.isMine ? 'items-end' : 'items-start'}`}>
      <div className={`flex flex-col ${message.isMine ? 'items-end' : 'items-start'}`}>
        <div
          className={`w-fit max-w-[70%] break-words rounded-lg px-4 py-2 text-sm ${
            message.isMine ? 'bg-brand-soft' : 'bg-bg-subtle'
          }`}>
          <EditorContent editor={editor} className="[&_p]:whitespace-pre-wrap [&_p]:break-words" />
        </div>
        <span className="mt-1 text-xs text-fg-tertiary opacity-0 transition-opacity group-hover:opacity-100">
          {message.time}
        </span>
      </div>
    </div>
  );
}
