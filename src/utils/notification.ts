/**
 * 서버가 내려주는 newNotification.body는 "발신자명: 메시지" 형태로 이미 조합돼 있다.
 * (예: "김철수: 내일 회의 10시야")
 *
 * 채팅 리스트에서는 발신자 이름을 room.displayName으로 이미 별도 표시하고 있으므로,
 * 미리보기 텍스트에는 순수 메시지 내용만 남기고 "이름: " 접두어는 제거한다.
 */
export function stripSenderPrefix(body: string): string {
  const separatorIndex = body.indexOf(': ');
  if (separatorIndex === -1) return body;
  return body.slice(separatorIndex + 2);
}
