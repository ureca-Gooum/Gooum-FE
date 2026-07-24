import Mention from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import { PluginKey } from '@tiptap/pm/state';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { MentionList, type MentionListRef } from '@/components/MentionList';
import type { RoomMember } from '@/types/room';

// 멘션 추천 목록(팝업)이 지금 열려 있는지 바깥(ChatMessageInput)에서도 확인할 수 있도록
// 플러그인 키를 고정해서 내보낸다. Enter 키를 "메시지 전송"과 "멘션 선택"이 서로 가로채지
// 않도록 하기 위함.
export const mentionSuggestionPluginKey = new PluginKey('mentionSuggestion');

export function createMentionExtension(getMembers: () => RoomMember[], _getCurrentUserId?: () => string | null) {
  return Mention.configure({
    HTMLAttributes: { class: 'mention' },
    suggestion: {
      pluginKey: mentionSuggestionPluginKey,
      char: '@',
      items: ({ query }) => {
        const q = query.toLowerCase();
        // 가입된(=이 방에 참여 중인) 모든 사람이 대상이 되어야 하므로 별도로 걸러내지 않는다.
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
