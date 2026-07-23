import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, FileText, MessageCircle, HelpCircle, Minus, Square, X, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DUMMY_SEARCH_DATA = [
  { id: '1', type: 'message', title: '프론트엔드 개발팀', content: '프론트 화면 기획안 언제 나오나요?' },
  { id: '2', type: 'message', title: 'Daichi Fukuda', content: '프론트엔드 빌드 에러가 발생했습니다.' },
  { id: '3', type: 'document', title: '프론트엔드 온보딩 문서', content: '새로 오신 프론트엔드 개발자를 위한 가이드' },
  { id: '4', type: 'document', title: '디자인 시스템', content: '이번에 새로 추가된 프론트 컴포넌트 목록입니다.' },
  { id: '5', type: 'message', title: 'Park Soyeon', content: '리액트 관련 질문 있습니다.' },
];

interface HeaderProps {
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  isMaximized?: boolean;
}

export function Header({ onMinimize, onMaximize, onClose, isMaximized = true }: HeaderProps = {}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
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

  const filteredResults = DUMMY_SEARCH_DATA.filter(
    (item) => item.content.includes(searchQuery) || item.title.includes(searchQuery)
  );

  return (
    <header className="flex h-14 shrink-0 items-center bg-bg-canvas px-3">
      {/* 왼쪽: 로고 */}
      <img src="/favicon.svg" alt="구움" className="h-10 w-10" />

      <div className="flex flex-1 items-center justify-center gap-2">
        <button className="rounded-md p-1.5 text-fg-tertiary hover:bg-bg-subtle" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
        </button>
        <button className="rounded-md p-1.5 text-fg-tertiary hover:bg-bg-subtle" onClick={() => navigate(1)}>
          <ChevronRight size={18} />
        </button>

        <div className="relative w-full max-w-md" ref={dropdownRef}>
          <div className={`flex w-full items-center gap-2 rounded-lg border bg-bg-default px-3 py-1.5 transition-colors ${
            isFocused ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-border-default'
          }`}>
            <Search size={16} className={isFocused ? 'text-brand-primary' : 'text-fg-tertiary'} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (isLoggedIn) setIsFocused(true) }}
              placeholder={isLoggedIn ? "검색" : "로그인 후 이용 가능"}
              disabled={!isLoggedIn}
              className="w-full bg-transparent text-sm outline-none placeholder:text-fg-tertiary text-fg-primary disabled:opacity-50"
            />
          </div>

          {/* 검색 연관검색어 드롭다운 */}
          {isFocused && searchQuery.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-full max-h-96 overflow-y-auto rounded-lg border border-border-default bg-bg-default shadow-lg z-50">
              <div className="px-3 py-2 border-b border-border-default bg-bg-canvas">
                <span className="text-xs font-semibold text-fg-tertiary">
                  '{searchQuery}' 검색 결과
                </span>
              </div>
              
              <div className="flex flex-col py-1">
                {filteredResults.length > 0 ? (
                  filteredResults.map((result) => (
                    <button
                      key={result.id}
                      className="flex items-start gap-3 px-3 py-2 hover:bg-bg-subtle transition-colors text-left"
                      onClick={() => {
                        setSearchQuery('');
                        setIsFocused(false);
                      }}
                    >
                      <div className="mt-0.5 shrink-0 text-fg-tertiary">
                        {result.type === 'message' ? <MessageCircle size={16} /> : <FileText size={16} />}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold text-fg-primary truncate">
                          {result.title}
                        </span>
                        <span className="text-xs text-fg-secondary truncate">
                          {/* 검색어 하이라이팅 처리도 가능하지만 임시로 그대로 렌더링 */}
                          {result.content.split(searchQuery).map((part, i, arr) => (
                            <span key={i}>
                              {part}
                              {i < arr.length - 1 && (
                                <span className="font-bold text-brand-primary bg-brand-soft px-0.5 rounded">
                                  {searchQuery}
                                </span>
                              )}
                            </span>
                          ))}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-6 text-center text-sm text-fg-tertiary">
                    검색 결과가 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="flex h-7 w-7 items-center justify-center rounded hover:bg-bg-subtle text-fg-tertiary" title="도움말">
          <HelpCircle size={16} />
        </button>
        <div className="w-px h-4 bg-border-default mx-1" />
        <button 
          onClick={onMinimize}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-bg-subtle text-fg-tertiary" 
          title="최소화"
        >
          <Minus size={16} />
        </button>
        <button 
          onClick={onMaximize}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-bg-subtle text-fg-tertiary" 
          title={isMaximized ? "이전 크기로 복원" : "최대화"}
        >
          {isMaximized ? <Copy size={14} /> : <Square size={14} />}
        </button>
        <button 
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-error hover:text-white text-fg-tertiary transition-colors" 
          title="닫기"
        >
          <X size={16} />
        </button>
      </div>
    </header>
  );
}
