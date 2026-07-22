# 문서 저장 (자동 저장)

Method: PATCH
Path: /{documentId}
Prefix: api/documents
상태: 완료
설명: 프론트에서 일정 간격으로 호출하여 에디터 내용을 DB에 저장

### API 내부 로직 흐름

- JWT 토큰 검증
→ 실패 시 401 반환
- documents 컬렉션 조회
→ 존재하지 않으면 404 반환
- collaborators에 내가 포함되어 있는지 확인
→ 아니면 403 반환
- documents 컬렉션 update
→ content, title 업데이트
- 200 반환

## Request Header

<aside>

Content-Type: application/json
Authorization: Bearer {accessToken}

</aside>

## **Request**

```jsx
PATCH /api/documents/{documentId}

{
  "title": "7월 스프린트 회고 (수정)",
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 1 },
        "content": [
          { "type": "text", "text": "7월 스프린트 회고 (수정)" }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "수정된 내용..." }
        ]
      }
    ]
  }
}
```

[Path Parameters](Path%20Parameters%20f14b1b3b86568258aa230192287b8277.csv)

[Request Body ](Request%20Body%203a2b1b3b86568049b949c3add5471996.csv)

## **Response 200**

```json
{
  "documentId": "665f7f6a9b0c1d2e3f405162",
  "title": "7월 스프린트 회고 (수정)",
  "updatedAt": "2025-07-16T17:00:00.000Z"
}
```

## Response 401

```json
{ "message": "인증이 필요합니다." }
```

## Response 403

```json
{ "message": "이 문서에 접근 권한이 없어요." }
```

## Response 404

```json
{ "message": "문서를 찾을 수 없어요." }
```