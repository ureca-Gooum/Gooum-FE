// y-websocket-server.cjs
// y-websocket v3 호환 WebSocket 동시편집 서버
// 사용법: node y-websocket-server.cjs

const http = require("http");
const { WebSocketServer } = require("ws");
const Y = require("yjs");
const syncProtocol = require("y-protocols/dist/sync.cjs");
const awarenessProtocol = require("y-protocols/dist/awareness.cjs");
const encoding = require("lib0/dist/encoding.cjs");
const decoding = require("lib0/dist/decoding.cjs");

const messageSync = 0;
const messageAwareness = 1;

const PORT = parseInt(process.env.PORT || "1234", 10);

/** @type {Map<string, { doc: Y.Doc, awareness: awarenessProtocol.Awareness, conns: Map<object, Set<number>> }>} */
const rooms = new Map();

function getOrCreateRoom(roomName) {
  if (!rooms.has(roomName)) {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);
    awareness.setLocalState(null);

    const room = { doc, awareness, conns: new Map() };

    // doc 업데이트 발생 시 → 모든 클라이언트에 브로드캐스트
    doc.on("update", (update, origin) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeUpdate(encoder, update);
      const msg = encoding.toUint8Array(encoder);

      room.conns.forEach((_ids, conn) => {
        // origin이 해당 conn이면 보내지 않음 (자기 자신에게 에코 방지)
        if (conn !== origin && conn.readyState === 1) {
          try {
            conn.send(msg);
          } catch (e) {
            // ignore send errors
          }
        }
      });
    });

    // awareness 변경 시 → 모든 클라이언트에 브로드캐스트
    awareness.on("update", ({ added, updated, removed }, origin) => {
      const changedClients = added.concat(updated, removed);
      if (changedClients.length === 0) return;

      // origin conn이 제어하는 awareness ID 추적
      if (origin !== null && room.conns.has(origin)) {
        const controlledIds = room.conns.get(origin);
        added.forEach((id) => controlledIds.add(id));
        removed.forEach((id) => controlledIds.delete(id));
      }

      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients),
      );
      const msg = encoding.toUint8Array(encoder);

      room.conns.forEach((_ids, conn) => {
        if (conn.readyState === 1) {
          try {
            conn.send(msg);
          } catch (e) {
            // ignore
          }
        }
      });
    });

    rooms.set(roomName, room);
  }
  return rooms.get(roomName);
}

function handleConnection(conn, req) {
  const roomName = (req.url || "/").slice(1) || "default";
  const room = getOrCreateRoom(roomName);

  // 이 연결이 제어하는 awareness client ID를 추적
  room.conns.set(conn, new Set());

  // ── Step 1: 서버 → 클라이언트에게 SyncStep1 보내기
  {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, room.doc);
    conn.send(encoding.toUint8Array(encoder));
  }

  // ── Step 2: 서버 → 클라이언트에게 현재 doc 상태 (SyncStep2) 보내기
  {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep2(encoder, room.doc);
    conn.send(encoding.toUint8Array(encoder));
  }

  // ── 현재 awareness 상태 보내기
  {
    const states = room.awareness.getStates();
    if (states.size > 0) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(
          room.awareness,
          Array.from(states.keys()),
        ),
      );
      conn.send(encoding.toUint8Array(encoder));
    }
  }

  // ── 클라이언트로부터 메시지 수신 처리
  conn.on("message", (data) => {
    try {
      const message = new Uint8Array(data);
      const decoder = decoding.createDecoder(message);
      const msgType = decoding.readVarUint(decoder);

      switch (msgType) {
        case messageSync: {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, messageSync);
          // readSyncMessage가 doc에 업데이트를 적용하면
          // doc.on("update")가 자동으로 다른 클라이언트에 브로드캐스트
          syncProtocol.readSyncMessage(
            decoder,
            encoder,
            room.doc,
            conn, // origin — doc.on("update") 콜백에서 이 conn으로 전달됨
          );
          // 응답이 있으면 (SyncStep2 등) 보내기
          if (encoding.length(encoder) > 1) {
            conn.send(encoding.toUint8Array(encoder));
          }
          break;
        }
        case messageAwareness: {
          awarenessProtocol.applyAwarenessUpdate(
            room.awareness,
            decoding.readVarUint8Array(decoder),
            conn, // origin
          );
          break;
        }
        default:
          break;
      }
    } catch (err) {
      console.error("[y-ws] 메시지 처리 오류:", err.message);
    }
  });

  // ── 연결 종료 처리
  conn.on("close", () => {
    const controlledIds = room.conns.get(conn);
    room.conns.delete(conn);

    // awareness에서 이 클라이언트 제거
    if (controlledIds && controlledIds.size > 0) {
      awarenessProtocol.removeAwarenessStates(
        room.awareness,
        Array.from(controlledIds),
        null,
      );
    }

    // 방에 아무도 없으면 정리
    if (room.conns.size === 0) {
      room.awareness.destroy();
      room.doc.destroy();
      rooms.delete(roomName);
      console.log(`[y-ws] 방 "${roomName}" 정리됨 (접속자 0명)`);
    }

    console.log(
      `[y-ws] 클라이언트 연결 해제 (room: ${roomName}, 남은 연결: ${room.conns.size})`,
    );
  });

  conn.on("error", (err) => {
    console.error(`[y-ws] 연결 오류 (room: ${roomName}):`, err.message);
  });
}

// ── HTTP + WebSocket 서버
const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("y-websocket server running");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (conn, req) => {
  const roomName = (req.url || "/").slice(1) || "default";
  console.log(
    `[y-ws] 클라이언트 연결됨 (room: ${roomName}, 현재 연결 수: ${wss.clients.size})`,
  );
  handleConnection(conn, req);
});

server.listen(PORT, () => {
  console.log(`\n🟢 y-websocket 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`   WebSocket URL: ws://localhost:${PORT}\n`);
});
