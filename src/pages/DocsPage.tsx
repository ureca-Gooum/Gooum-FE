// src/pages/DocsPage.tsx
import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ undoRedo: false }),
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({ provider: provider, user: currentUser }),
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

  if (!editor) return <div>로딩 중...</div>;

  return (
    // 1. 뼈대: 불러온 Docs.png 사진을 화면 전체 배경으로 깝니다.
    <div
      className="relative h-full w-full"
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
        className="absolute"
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
    </div>
  );
};
