# 문서 삭제

Method: DELETE
Path: /{documentId}
Prefix: api/documents
상태: 완료
설명: 문서 삭제. 생성자만 삭제 가능

### API 내부 로직 흐름

- JWT 토큰 검증
→ 실패 시 401 반환
- documents 컬렉션 조회
→ 존재하지 않으면 404 반환
- created_by가 본인인지 확인
→ 아니면 403 반환
- documents 컬렉션에서 삭제
- messages 컬렉션에서 해당 document_id를 참조하는 메시지의 is_deleted를 true로 변경
- 200 반환

## Request Header

<aside>

Authorization: Bearer {accessToken}

</aside>

## **Request**

```jsx
DELETE /api/documents/{documentId}
```

[Path Parameters](Path%20Parameters%20036b1b3b86568297959f01a9e265285e.csv)

## **Response 200**

```json
{ "message": "문서가 삭제되었어요." }
```

## Response 401

```json
{ "message": "인증이 필요합니다." }
```

## Response 403

```json
{ "message": "문서 생성자만 삭제할 수 있어요." }
```

## Response 404

```json
{ "message": "문서를 찾을 수 없어요." }
```