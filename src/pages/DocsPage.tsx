// src/pages/DocsPage.tsx
import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { axiosInstance } from "@/api/axiosInstance";

// ✨ 아까 옮겨두신 사진 파일을 불러옵니다! (경로가 다르면 수정해주세요)
import docsBgImage from "../assets/Docs.png";

const userColors = ["#958DF1", "#F98181", "#FBCE76", "#8AE234", "#3498DB"];
const userNames = ["기획자", "디자이너", "프론트엔드", "백엔드", "PM"];

const getRandomItem = (array: string[]) =>
  array[Math.floor(Math.random() * array.length)];
const currentUser = {
  name: getRandomItem(userNames),
  color: getRandomItem(userColors),
};

export const DocsPage = () => {
  const [ydoc] = useState(() => new Y.Doc());
  const [provider] = useState(
    () => new WebsocketProvider("ws://localhost:1234", "gooum-docs-room", ydoc),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ undoRedo: false }),
      Collaboration.configure({ document: ydoc }),
      CollaborationCaret.configure({ provider: provider, user: currentUser }),
    ],
    // 초기 텍스트 비우기 (사진에 이미 글씨가 적혀있다면 비우는 게 자연스럽습니다)
    content: "",
    editorProps: {
      attributes: {
        // 투명하게 만들고 테두리 없애기
        class: "focus:outline-none w-full h-full bg-transparent",
      },
    },
  });

  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    setToastMessage("저장 중...");

    try {
      const contentHTML = editor.getHTML();
      const contentText = editor.getText();
      const contentJSON = JSON.stringify(editor.getJSON());

      // 1. 로컬 스토리지 저장 (Fallback)
      localStorage.setItem("gooum_doc_content", contentHTML);

      // 2. API 서버 저장 요청
      await axiosInstance.post("/docs/save", {
        html: contentHTML,
        text: contentText,
        json: contentJSON,
        updatedAt: new Date().toISOString(),
      });

      setToastMessage("문서가 성공적으로 저장되었습니다!");
    } catch (error) {
      console.warn("API 저장 실패 (로컬 스토리지에 임시 저장됨):", error);
      setToastMessage("저장 완료! (서버 연결 실패로 로컬에 임시 저장됨)");
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    }
  };

  if (!editor) return <div>로딩 중...</div>;

  return (
    // 1. 뼈대: 불러온 Docs.png 사진을 화면 전체 배경으로 깝니다.
    <div
      className="relative h-full w-full select-none"
      style={{
        backgroundImage: `url(${docsBgImage})`,
        backgroundSize: "cover", // 사진 찌그러짐 방지
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* 
        2. 투명 에디터 영역: 
        사진 속 '하얀색 문서 종이' 영역에 맞춰 투명한 입력창의 위치와 크기를 잡아줍니다. 
        (현재 임의로 사진 우측 중앙쯤에 배치했습니다. top, left, width, height 숫자를 조절해서 사진 위에 딱 맞게 덮어보세요!)
      */}
      <div
        className="absolute select-text"
        style={{
          top: "25%", // 위에서부터 떨어지는 거리
          left: "30%", // 왼쪽에서부터 떨어지는 거리
          width: "60%", // 입력창 가로 길이
          height: "65%", // 입력창 세로 길이
          padding: "20px",
        }}
        onClick={() => editor.commands.focus()}
      >
        <EditorContent
          editor={editor}
          className="h-full w-full text-lg text-gray-800"
        />
      </div>

      {/* 
        3. 저장 버튼 영역 (이미지 우측 상단/상단 영역에 위치 매핑):
        사진 속 '저장' 버튼 영역에 투명한 영역을 겹쳐서 클릭할 수 있게 만듭니다.
        (사용자 모니터 해상도와 사진 비율에 맞춰 top, right, width, height를 미세 조정하세요!)
      */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="absolute cursor-pointer rounded-md hover:bg-black/5 active:bg-black/10 transition-all flex items-center justify-center text-transparent hover:text-gray-500 font-medium text-xs select-none"
        style={{
          top: "3%", // 사진 오른쪽 위의 저장 버튼 위치 (임의 지정)
          right: "4.5%", // 사진 오른쪽 위의 저장 버튼 위치 (임의 지정)
          width: "80px", // 버튼 가로 크기
          height: "36px", // 버튼 세로 크기
        }}
        title="문서 저장하기"
      >
        저장
      </button>

      {/* 4. 애니메이션 알림 토스트 */}
      {toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/90 text-white px-6 py-3 rounded-full shadow-lg backdrop-blur-sm transition-all border border-slate-700/50 animate-bounce">
          {isSaving ? (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
