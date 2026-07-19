# Gooum Frontend (구움 프론트엔드)

실시간 공동 문서 편집 및 채팅 기능을 지원하는 Gooum 프로젝트의 프론트엔드 저장소입니다.

## 📋 사전 준비 사항 (Prerequisites)

이 프로젝트를 실행하려면 컴퓨터에 **Node.js**가 설치되어 있어야 합니다.
- [Node.js 공식 다운로드](https://nodejs.org/) (LTS 버전 권장, v18 이상)

## 🚀 설치 및 시작 방법 (Setup & Run)

GitHub에서 프로젝트를 클론(또는 Pull)한 후 아래 단계를 따라 실행해 주세요.

### 1. 프로젝트 폴더로 이동 및 패키지 설치
터미널을 열고 프로젝트 폴더로 이동한 후, 필요한 패키지들을 설치합니다.

```bash
# 의존성 패키지 설치
npm install
```

### 2. 환경 변수 설정
프로젝트 루트 경로에 `.env` 파일을 생성하고 필요한 설정을 입력합니다. (기본적으로 `.env.example` 파일을 복사하여 사용할 수 있습니다.)

```bash
# 환경 변수 파일 복사 (MacOS/Linux)
cp .env.example .env

# 환경 변수 파일 복사 (Windows PowerShell)
Copy-Item .env.example .env
```

### 3. 실시간 공동 편집 웹소켓 서버 실행 (Terminal 1)
동시 편집 기능을 위해 Yjs 웹소켓 서버를 먼저 실행합니다. (기본 포트: `1234`)

```bash
npm run y-server
```

### 4. 프론트엔드 개발 서버 실행 (Terminal 2)
새로운 터미널을 열고 프론트엔드 개발 서버를 실행합니다. (기본 주소: `http://localhost:5173`)

```bash
npm run dev
```

---

## 🛠️ 주요 기술 스택
- **Framework:** React 18, Vite 8, TypeScript
- **Styling:** Tailwind CSS v4
- **Collaboration:** Tiptap Editor, Yjs, y-websocket (실시간 동시 편집)
