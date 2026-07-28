import { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  MessageCircle,
  HelpCircle,
  Minus,
  Square,
  X,
  Copy,
  User,
  Hash,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HeaderLogo } from './HeaderLogo';
import { fetchSearch } from '@/api/search';
import type { SearchApiResponse } from '@/types/search';

interface HeaderProps {
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  isMaximized?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onHelpClick?: () => void;
}

export function Header({ onMinimize, onMaximize, onClose, isMaximized = true, onMouseDown, onHelpClick }: HeaderProps = {}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchApiResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!localStorage.getItem('accessToken');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || !isLoggedIn) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await fetchSearch(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error(err);
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isLoggedIn]);

  const handleResultClick = (type: string, data: any) => {
    setSearchQuery('');
    setIsFocused(false);

    if (type === 'user') {
      navigate('/app', { state: { action: 'open_dm', userId: data.userId } });
    } else if (type === 'room') {
      navigate('/app', { state: { roomId: data.roomId } });
    } else if (type === 'message') {
      navigate('/app', { state: { roomId: data.roomId, targetMessageId: data.messageId } });
    } else if (type === 'document') {
      navigate(`/app/docs?document=${data.documentId}&room=${data.roomId}`);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="font-bold text-brand-primary bg-brand-soft px-0.5 rounded">
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </>
    );
  };

  return (
    <header
      className={`flex h-14 shrink-0 items-center px-3 ${!isMaximized ? 'cursor-move' : ''}`}
      onMouseDown={onMouseDown}>
      {/* 왼쪽: 로고 (PC) / 뒤로가기 (모바일) */}
      <div className="hidden @md:block">
        <HeaderLogo />
      </div>
      <div className="flex @md:hidden w-10 shrink-0 items-center">
        <button 
          className="flex items-center justify-center p-1.5 -ml-1 rounded-md text-fg-tertiary hover:bg-bg-subtle" 
          onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center gap-2 px-2 @md:px-0">
        <button className="hidden @md:flex rounded-md p-1.5 text-fg-tertiary hover:bg-bg-subtle" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
        </button>
        <button className="hidden @md:flex rounded-md p-1.5 text-fg-tertiary hover:bg-bg-subtle" onClick={() => navigate(1)}>
          <ChevronRight size={18} />
        </button>

        <div className="relative w-full max-w-[400px] @md:max-w-md" ref={dropdownRef}>
          <div
            className={`flex w-full items-center gap-2 rounded-lg border bg-bg-default px-3 py-1.5 transition-colors ${
              isFocused ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-border-default'
            }`}>
            <Search size={16} className={isFocused ? 'text-brand-primary' : 'text-fg-tertiary'} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (isLoggedIn) setIsFocused(true);
              }}
              placeholder={isLoggedIn ? '검색' : '로그인 후 이용 가능'}
              disabled={!isLoggedIn}
              className="w-full bg-transparent text-sm outline-none placeholder:text-fg-tertiary text-fg-primary disabled:opacity-50"
            />
          </div>

          {/* 검색 연관검색어 드롭다운 */}
          {isFocused && searchQuery.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-full max-h-[400px] overflow-y-auto rounded-lg border border-border-default bg-bg-default shadow-lg z-50">
              <div className="sticky top-0 px-3 py-2 border-b border-border-default bg-bg-canvas flex items-center justify-between z-10">
                <span className="text-xs font-semibold text-fg-tertiary">'{searchQuery}' 검색 결과</span>
                {isSearching && <span className="text-xs text-brand-primary">검색 중...</span>}
              </div>

              <div className="flex flex-col py-1">
                {!searchResults && !isSearching && (
                  <div className="px-3 py-6 text-center text-sm text-fg-tertiary">검색 결과가 없습니다.</div>
                )}

                {searchResults && (
                  <>
                    {/* 유저 */}
                    {searchResults.users.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1 text-[11px] font-bold text-fg-tertiary uppercase tracking-wider">
                          사용자
                        </div>
                        {searchResults.users.map((user) => (
                          <button
                            key={user.userId}
                            onClick={() => handleResultClick('user', user)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-subtle transition-colors text-left">
                            <User size={16} className="text-fg-tertiary shrink-0" />
                            <span className="text-sm font-semibold text-fg-primary truncate">
                              {highlightText(user.name, searchQuery)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 채팅방 */}
                    {searchResults.rooms.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1 text-[11px] font-bold text-fg-tertiary uppercase tracking-wider">
                          채팅방
                        </div>
                        {searchResults.rooms.map((room) => (
                          <button
                            key={room.roomId}
                            onClick={() => handleResultClick('room', room)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-subtle transition-colors text-left">
                            <Hash size={16} className="text-fg-tertiary shrink-0" />
                            <span className="text-sm font-semibold text-fg-primary truncate">
                              {highlightText(room.name || '알 수 없는 채팅방', searchQuery)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 메시지 */}
                    {searchResults.messages.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1 text-[11px] font-bold text-fg-tertiary uppercase tracking-wider">
                          메시지
                        </div>
                        {searchResults.messages.map((msg) => (
                          <button
                            key={msg.messageId}
                            onClick={() => handleResultClick('message', msg)}
                            className="w-full flex items-start gap-3 px-3 py-2 hover:bg-bg-subtle transition-colors text-left">
                            <MessageCircle size={16} className="text-fg-tertiary shrink-0 mt-0.5" />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-[11px] text-fg-tertiary truncate mb-0.5">
                                {msg.roomName} • {msg.sender.name}
                              </span>
                              <span className="text-sm text-fg-primary line-clamp-2 leading-tight">
                                {highlightText(msg.content, searchQuery)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 문서 */}
                    {searchResults.documents.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1 text-[11px] font-bold text-fg-tertiary uppercase tracking-wider">
                          문서
                        </div>
                        {searchResults.documents.map((doc) => (
                          <button
                            key={doc.documentId}
                            onClick={() => handleResultClick('document', doc)}
                            className="w-full flex items-start gap-3 px-3 py-2 hover:bg-bg-subtle transition-colors text-left">
                            <FileText size={16} className="text-fg-tertiary shrink-0 mt-0.5" />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm font-semibold text-fg-primary truncate">
                                {highlightText(doc.title, searchQuery)}
                              </span>
                              <span className="text-[11px] text-fg-tertiary truncate">{doc.roomName}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.users.length === 0 &&
                      searchResults.rooms.length === 0 &&
                      searchResults.messages.length === 0 &&
                      searchResults.documents.length === 0 && (
                        <div className="px-3 py-10 text-center text-sm text-fg-tertiary">검색 결과가 없습니다.</div>
                      )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div id="header-tabs-portal" className="flex @md:hidden w-10 shrink-0 items-center justify-end min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden pr-1" />

      <div className="hidden @md:flex items-center gap-1 ml-auto">
        <button
          onClick={onHelpClick}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-bg-subtle text-fg-tertiary"
          title="도움말">
          <HelpCircle size={16} />
        </button>
        <div className="w-px h-4 bg-border-default mx-1" />
        <button
          onClick={onMinimize}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-bg-subtle text-fg-tertiary"
          title="최소화">
          <Minus size={16} />
        </button>
        <button
          onClick={onMaximize}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-bg-subtle text-fg-tertiary"
          title={isMaximized ? '이전 크기로 복원' : '최대화'}>
          {isMaximized ? <Copy size={14} /> : <Square size={14} />}
        </button>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-error hover:text-white text-fg-tertiary transition-colors"
          title="닫기">
          <X size={16} />
        </button>
      </div>
    </header>
  );
}
