# 문서 목록 조회

Method: GET
Prefix: api/documents
상태: 완료
설명: 내가 참여 중인 문서 목록 조회. 문서 탭에서 사용. roomId로 특정 채팅방 문서만 필터 가능

### API 내부 로직 흐름

- JWT 토큰 검증
→ 실패 시 401 반환
- documents 컬렉션 조회
→ collaborators에 내가 포함된 문서만
→ roomId 파라미터가 있으면 해당 채팅방 문서만 필터
→ 최신 수정순 정렬
- 200 반환

## Request Header

<aside>

Authorization: Bearer {accessToken}

</aside>

## **Request**

```jsx
GET /api/documents?roomId=665f2a1b4c5d6e7f8a9b0c1d
```

[Query Parameters](Query%20Parameters%20f10b1b3b8656820fa6f30153c4a7744b.csv)

## **Response 200**

```json
{
    "documents": [
        {
            "documentId": "6a5dc542a7af8fd7b5d4835c",
            "title": "7월 스프린트 회고",
            "type": "document",
            "roomId": "6a5d89dec6ddc8d04da6cd47",
            "roomName": null,
            "createdBy": {
                "userId": "6a585824d4ff166c998b9938",
                "name": "서지현"
            },
            "createdAt": "2026-07-20T06:50:42.622Z",
            "updatedAt": "2026-07-20T06:50:42.622Z"
        }
    ],
    "total": 1
}
```

## Response 401

```json
{ "message": "인증이 필요합니다." }
```