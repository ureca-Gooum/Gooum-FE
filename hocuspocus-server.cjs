// hocuspocus-server.cjs
const { Server } = require("@hocuspocus/server");

const server = new Server({
  port: parseInt(process.env.PORT || "1234", 10),
  onListen: async (data) => {
    console.log(`\n🟢 Hocuspocus 서버가 포트 ${data.port}에서 실행 중입니다.`);
    console.log(`   WebSocket URL: ws://localhost:${data.port}\n`);
  },
  onConnect: async (data) => {
    console.log(`[hocuspocus] 클라이언트 연결됨 (문서명: ${data.documentName})`);
  },
  onDisconnect: async (data) => {
    console.log(`[hocuspocus] 클라이언트 연결 종료 (문서명: ${data.documentName})`);
  },
});

server.listen();
