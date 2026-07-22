# 문서 생성

Method: POST
Prefix: api/documents
상태: 완료
설명: 채팅방에서 버튼 클릭 시 동시 편집 문서 생성. 채팅방에 문서 메시지도 자동 생성

### API 내부 로직 흐름

- JWT 토큰 검증→ 실패 시 401 반환
- room_members 컬렉션에서 내가 이 방의 멤버인지 확인 → 아니면 403 반환
- documents 컬렉션 insert→ type: "document"→ collaborators에 채팅방 멤버 전원 등록
- messages 컬렉션 insert→ type: "document"로 채팅방에 문서 메시지 자동 생성
- Socket.io로 채팅방 멤버들에게 newMessage 전달
- 201 반환

## Request Header

<aside>

Content-Type: application/json
Authorization: Bearer {accessToken}

</aside>

## **Request**

```jsx
POST /api/documents

{
  "title": "7월 스프린트 회고",
  "roomId": "665f2a1b4c5d6e7f8a9b0c1d"
}
```

[Request Body ](Request%20Body%20dc8b1b3b8656820e934a810b566c468a.csv)

## Response 201

```json
{
  "documentId": "665f7f6a9b0c1d2e3f405162",
  "title": "7월 스프린트 회고",
  "type": "document",
  "roomId": "665f2a1b4c5d6e7f8a9b0c1d",
  "content": null,
  "collaborators": [
    { "userId": "665f1c2a3b4e5f6a7b8c9d0e", "name": "홍길동" },
    { "userId": "665f1c2a3b4e5f6a7b8c9d0f", "name": "김철수" }
  ],
  "createdBy": "665f1c2a3b4e5f6a7b8c9d0e",
  "createdAt": "2025-07-16T10:00:00.000Z",
  "updatedAt": "2025-07-16T10:00:00.000Z"
}
```

## Response 401

```json
{ "message": "인증이 필요합니다." }
```

## Response 403

```json
{ "message": "이 채팅방의 멤버가 아닙니다." }
```