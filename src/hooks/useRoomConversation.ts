import { useEffect, useRef, useState } from 'react';
import {
  getSocket,
  joinRoom,
  leaveRoom as leaveSocketRoom,
  sendMessage as emitSendMessage,
  onNewMessage,
  offNewMessage,
  onMessageDeleted,
  offMessageDeleted,
} from '@/socket/socket';
import { fetchRoomDetail } from '@/api/rooms';
import { fetchUsers } from '@/api/users';
import { fetchMessages, deleteMessage as deleteMessageApi } from '@/api/messages';
import { createDocument, saveDocument } from '@/api/documents';
import { mapMessageFromApi } from '@/api/mappers/messageMapper';
import { extractMentionedUserIds } from '@/utils/tiptap';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { triggerBadgeRefresh } from '@/hooks/useUnreadBadge';
import type { Message, TiptapDoc } from '@/types/chat';
import type { RoomMember } from '@/types/room';
import type { NewMessagePayload, MessageDeletedPayload } from '@/types/socket';

interface UseRoomConversationOptions {
  /** 방 안에서 새 메시지를 "내가" 보냈을 때, 사이드바 미리보기 등을 갱신하고 싶을 때 사용 (raw 소켓 payload를 그대로 전달) */
  onMessageSent?: (payload: NewMessagePayload) => void;

  onMessageDeleted?: (payload: { roomId: string; messageId: string; wasLastMessage: boolean }) => void;
}

export function useRoomConversation(
  roomId: string | null,
  currentUserId: string | null,
  options: UseRoomConversationOptions = {},
) {
  const onMessageSentRef = useRef(options.onMessageSent);
  onMessageSentRef.current = options.onMessageSent;
  const onMessageDeletedRef = useRef(options.onMessageDeleted);
  onMessageDeletedRef.current = options.onMessageDeleted;
  const lastMessageIdRef = useRef<string | null>(null);

  const [roomMessages, setRoomMessages] = useState<Message[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  // 멘션 자동완성용 "가입된 모든 사람" 목록. 방과 무관하므로 컴포넌트 마운트 시 한 번만 불러온다.
  const [allMembers, setAllMembers] = useState<RoomMember[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { typingLabel, notifyTyping } = useTypingIndicator(roomId);

  // ── AI 회의록: 카톡 캡쳐처럼 메시지 범위를 선택하는 모드 상태 ──
  const [isSelectingMessages, setIsSelectingMessages] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(null);

  // 방을 옮기면 이전 방에서 실시간으로 받은 로컬 메시지는 비워준다 (과거 메시지는 아래 effect에서 새로 fetch)
  useEffect(() => {
    setLocalMessages([]);
    setIsSelectingMessages(false);
    setSelectedMessageIds([]);
    setSelectionAnchorId(null);
  }, [roomId]);

  // 가입된 모든 사용자 목록 (멘션 자동완성에서 "이 방 멤버만"이 아니라 전체 가입자를 보여주기 위함)
  useEffect(() => {
    let isMounted = true;
    fetchUsers()
      .then((users) => {
        if (!isMounted) return;
        setAllMembers(
          users.map((u) => ({
            userId: u.userId,
            name: u.name,
            profileImageUrl: u.profileImageUrl,
            presence: u.presence,
            statusMessage: u.statusMessage ?? undefined,
          })),
        );
      })
      .catch((err) => console.error('전체 사용자 목록을 불러오지 못했어요:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  // 방 멤버 목록 (멘션 자동완성용)
  useEffect(() => {
    if (!roomId) {
      setRoomMembers([]);
      return;
    }
    let isMounted = true;
    fetchRoomDetail(roomId)
      .then((res) => {
        if (isMounted) setRoomMembers(res.members);
      })
      .catch((err) => console.error('방 멤버 목록을 불러오지 못했어요:', err));
    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // 방 입장/퇴장 + 과거 메시지 불러오기
  useEffect(() => {
    if (!roomId) {
      setRoomMessages([]);
      return;
    }
    console.log('🚪 입장 시도하는 roomId:', roomId);

    const socket = getSocket();

    const doJoin = () => {
      joinRoom(roomId, (response: any) => {
        console.log('joinRoom 응답:', response);
      });
    };

    if (socket?.connected) {
      doJoin();
    } else {
      socket?.once('connect', doJoin);
    }

    // 새로고침(하드 리로드)은 React 언마운트 클린업이 안정적으로 실행되지 않는다.
    // usePresence의 beforeunload 처리와 동일한 이유로, 여기서도 leaveRoom을 명시적으로 한 번 더 보내야
    // 서버가 "읽음" 처리를 확정한다. 이게 없으면 방을 나가지 않고 새로고침했을 때 방금 내가 보낸
    // 메시지까지 안읽음으로 남는다.
    const handleBeforeUnload = () => {
      leaveSocketRoom(roomId);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    setIsMessagesLoading(true);
    lastMessageIdRef.current = null;
    fetchMessages({ roomId })
      .then((data) => {
        const mapped = data.messages.map(mapMessageFromApi).reverse();
        setRoomMessages(mapped);
        const lastMessage = mapped[mapped.length - 1];
        lastMessageIdRef.current = lastMessage && !lastMessage.isDeleted ? lastMessage.id : null;
        triggerBadgeRefresh(); // DM 방 입장 시 읽음 처리로 인한 배지 갱신
      })
      .catch((err) => console.error(err))
      .finally(() => setIsMessagesLoading(false));

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      leaveSocketRoom(roomId, (response: any) => {
        console.log('leaveRoom 응답:', response);
      });
    };
  }, [roomId]);

  // 새 메시지 수신
  useEffect(() => {
    const handleNewMessage = (payload: NewMessagePayload) => {
      if (payload.roomId !== roomId) return;
      console.log('🔔 newMessage 이벤트 도착!', payload);

      setLocalMessages((prev) => {
        if (prev.some((m) => m.id === payload.messageId)) return prev;
        const receivedMessage: Message = {
          id: payload.messageId,
          roomId: payload.roomId,
          senderId: payload.sender.userId,
          senderName: payload.sender.name,
          content: payload.content,
          type: payload.type,
          fileUrl: payload.fileUrl,
          fileName: payload.fileName,
          time: new Date(payload.createdAt).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }),
          createdAt: payload.createdAt,
          isMine: payload.sender.userId === currentUserId,
          isDeleted: false,
        };
        return [...prev, receivedMessage];
      });
      lastMessageIdRef.current = payload.messageId;

      if (payload.sender.userId === currentUserId) {
        onMessageSentRef.current?.(payload);
      }
    };

    onNewMessage(handleNewMessage);
    return () => offNewMessage(handleNewMessage);
  }, [currentUserId, roomId]);

  // 메시지 삭제
  const updateMessageAsDeleted = (messageId: string) => {
    setRoomMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true } : m)));
    setLocalMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true } : m)));
  };

  // 소켓으로 삭제 이벤트를 받았을 때든, 내가 직접 삭제 버튼을 눌렀을 때든 동일하게 타는 공용 처리.
  // (같은 messageId로 두 번 호출돼도 상태 갱신 자체는 멱등이라 문제 없다)
  const applyMessageDeleted = (targetRoomId: string, messageId: string) => {
    updateMessageAsDeleted(messageId);
    const wasLastMessage = lastMessageIdRef.current === messageId;
    onMessageDeletedRef.current?.({ roomId: targetRoomId, messageId, wasLastMessage });
  };

  useEffect(() => {
    const handleMessageDeleted = (payload: MessageDeletedPayload) => {
      if (payload.roomId !== roomId) return;
      applyMessageDeleted(payload.roomId, payload.messageId);
    };

    onMessageDeleted(handleMessageDeleted);
    return () => offMessageDeleted(handleMessageDeleted);
  }, [roomId]);

  const messages = [...roomMessages, ...localMessages.filter((m) => m.roomId === roomId)];

  // 스크롤을 항상 맨 아래로
  const prevRoomIdRef = useRef<string | null>(null);
  const wasLoadingRef = useRef(false);

  useEffect(() => {
    const justEnteredRoom = wasLoadingRef.current && !isMessagesLoading;
    wasLoadingRef.current = isMessagesLoading;
    const roomChanged = prevRoomIdRef.current !== roomId;
    prevRoomIdRef.current = roomId;

    if (isMessagesLoading) return;

    const behavior: ScrollBehavior = justEnteredRoom || roomChanged ? 'auto' : 'smooth';
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior });

    scrollToBottom();
    const raf1 = requestAnimationFrame(() => {
      scrollToBottom();
      requestAnimationFrame(scrollToBottom);
    });
    const timer = window.setTimeout(scrollToBottom, 150);

    return () => {
      cancelAnimationFrame(raf1);
      window.clearTimeout(timer);
    };
  }, [messages.length, isMessagesLoading, roomId]);

  const sendMessage = (content: TiptapDoc) => {
    if (!roomId) return;

    const mentions = extractMentionedUserIds(content);
    emitSendMessage(
      {
        roomId,
        type: 'text',
        content,
        ...(mentions.length > 0 ? { mentions } : {}),
      },
      (response: any) => {
        console.log('sendMessage 응답:', response);
      },
    );
  };

  // 파일 첨부(클립 아이콘) 업로드가 끝난 후 호출됨 - 이미지/파일 메시지 전송
  const sendFile = (payload: { type: 'image' | 'file'; fileUrl: string; fileName: string }) => {
    if (!roomId) return;

    emitSendMessage(
      { roomId, type: payload.type, fileUrl: payload.fileUrl, fileName: payload.fileName },
      (response: any) => {
        console.log('sendMessage(파일) 응답:', response);
      },
    );
  };

  // 채팅 입력창의 인라인 "문서 작성" 카드에서 전송을 눌렀을 때 호출됨.
  const createDocumentMessage = async ({
    title,
    content,
    isContentEmpty,
  }: {
    title: string;
    content: TiptapDoc;
    isContentEmpty: boolean;
  }) => {
    if (!roomId) return;

    const docTitle = title.trim() || '제목 없는 문서';
    try {
      const newDoc = await createDocument({ title: docTitle, roomId, type: 'document' });

      if (!isContentEmpty) {
        await saveDocument(newDoc.documentId, { title: docTitle, content });
      }

      emitSendMessage(
        {
          roomId,
          type: 'document',
          content: {
            type: 'doc',
            content: [
              {
                type: 'documentCard',
                attrs: {
                  documentId: newDoc.documentId,
                  title: docTitle,
                  roomId,
                  docType: 'document',
                },
              },
            ],
          },
        },
        (response: any) => {
          console.log('문서 카드 메시지 전송 응답:', response);
        },
      );
    } catch (err) {
      console.error('문서 생성 실패:', err);
      alert('문서를 만들지 못했어요. 다시 시도해주세요.');
    }
  };

  const deleteMessage = async (messageId: string) => {
    // 이제 UI 쪽(DeleteMessageModal)에서 삭제 확인을 받기 때문에, 여기서 또 confirm()으로
    // 이중 확인시키지 않는다.
    if (!roomId) return;
    try {
      await deleteMessageApi(messageId);
      applyMessageDeleted(roomId, messageId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ── AI 회의록 선택 모드 핸들러 ──
  const startSelecting = () => {
    if (!roomId) return;
    setIsSelectingMessages(true);
    setSelectedMessageIds([]);
    setSelectionAnchorId(null);
  };

  const cancelSelecting = () => {
    setIsSelectingMessages(false);
    setSelectedMessageIds([]);
    setSelectionAnchorId(null);
  };

  const resetSelection = () => {
    setSelectedMessageIds([]);
    setSelectionAnchorId(null);
  };

  const toggleMessageSelect = (messageId: string) => {
    const ids = messages.map((m) => m.id);
    const clickedIndex = ids.indexOf(messageId);
    if (clickedIndex === -1) return;

    if (selectedMessageIds.length === 0) {
      setSelectionAnchorId(messageId);
      setSelectedMessageIds([messageId]);
      return;
    }

    if (selectedMessageIds.length === 1 && selectionAnchorId === messageId) {
      setSelectionAnchorId(null);
      setSelectedMessageIds([]);
      return;
    }

    if (selectionAnchorId) {
      const anchorIndex = ids.indexOf(selectionAnchorId);
      if (anchorIndex !== -1) {
        const [from, to] = anchorIndex < clickedIndex ? [anchorIndex, clickedIndex] : [clickedIndex, anchorIndex];
        setSelectedMessageIds(ids.slice(from, to + 1));
        return;
      }
    }

    setSelectionAnchorId(messageId);
    setSelectedMessageIds([messageId]);
  };

  /** 선택 완료 시 실제로 무엇을 할지는 페이지마다 다를 수 있어 콜백으로 위임한다 (예: /app/docs로 이동) */
  const confirmSelection = (onConfirm: (selectedMessages: Message[]) => void) => {
    if (!roomId || selectedMessageIds.length === 0) return;
    const selectedMessages = messages.filter((m) => selectedMessageIds.includes(m.id));
    onConfirm(selectedMessages);
    setIsSelectingMessages(false);
    setSelectedMessageIds([]);
    setSelectionAnchorId(null);
  };

  return {
    messages,
    isMessagesLoading,
    roomMembers,
    allMembers,
    messagesEndRef,
    typingLabel,
    notifyTyping,

    isSelectingMessages,
    selectedMessageIds,
    startSelecting,
    cancelSelecting,
    resetSelection,
    toggleMessageSelect,
    confirmSelection,

    sendMessage,
    sendFile,
    createDocumentMessage,
    deleteMessage,
  };
}
