import Mention from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import { PluginKey } from '@tiptap/pm/state';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { MentionList, type MentionListRef } from '@/components/MentionList';
import type { RoomMember } from '@/types/room';

export const mentionSuggestionPluginKey = new PluginKey('mentionSuggestion');

export function createMentionExtension(getMembers: () => RoomMember[], _getCurrentUserId?: () => string | null) {
  return Mention.configure({
    HTMLAttributes: { class: 'mention' },
    suggestion: {
      pluginKey: mentionSuggestionPluginKey,
      char: '@',
      items: ({ query }) => {
        const q = query.toLowerCase();
        return getMembers()
          .filter((m) => m.name.toLowerCase().includes(q))
          .slice(0, 8);
      },
      render: () => {
        let component: ReactRenderer<MentionListRef>;
        let popup: TippyInstance[] | undefined;

        return {
          onStart: (props) => {
            component = new ReactRenderer(MentionList, {
              props,
              editor: props.editor,
            });
            if (!props.clientRect) return;

            popup = tippy('body', {
              getReferenceClientRect: props.clientRect as () => DOMRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'top-start',
            });
          },
          onUpdate(props) {
            component.updateProps(props);
            if (!props.clientRect) return;
            popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect as () => DOMRect });
          },
          onKeyDown(props) {
            if (props.event.key === 'Escape') {
              popup?.[0]?.hide();
              return true;
            }
            return component.ref?.onKeyDown(props) ?? false;
          },
          onExit() {
            popup?.[0]?.destroy();
            component.destroy();
          },
        };
      },
    },
  });
}
