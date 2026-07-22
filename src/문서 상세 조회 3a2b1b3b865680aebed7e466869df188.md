# 문서 상세 조회

Method: GET
Path: /{documentId}
Prefix: api/documents
상태: 완료
설명: 문서 상세 조회 (에디터 열 때 내용 불러오기)

### API 내부 로직 흐름

- JWT 토큰 검증
→ 실패 시 401 반환
- documents 컬렉션 조회
→ documentId로 조회
→ 존재하지 않으면 404 반환
- collaborators에 내가 포함되어 있는지 확인
→ 아니면 403 반환
- 200 반환

## Request Header

<aside>

Authorization: Bearer {accessToken}

</aside>

## **Request**

```jsx
GET /api/documents/{documentId}
```

[Path Parameters](Path%20Parameters%20131b1b3b86568228abfd81df1c9c3e27.csv)

## **Response 200**

```json
{
    "documentId": "6a5dc542a7af8fd7b5d4835c",
    "title": "7월 스프린트 회고",
    "type": "document",
    "roomId": "6a5d89dec6ddc8d04da6cd47",
    "content": null,
    "collaborators": [
        {
            "userId": "6a585824d4ff166c998b9938",
            "name": "서지현"
        },
        {
            "userId": "6a5870a057bb9e93f505f6b7",
            "name": "장준환"
        },
        {
            "userId": "6a5d8965c6ddc8d04da6cd45",
            "name": "소연"
        }
    ],
    "createdBy": {
        "userId": "6a585824d4ff166c998b9938",
        "name": "서지현"
    },
    "createdAt": "2026-07-20T06:50:42.622Z",
    "updatedAt": "2026-07-20T06:50:42.622Z"
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