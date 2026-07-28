export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 알림/메시지 목록을 날짜별로 묶을 때 쓰는 구분선 라벨.
 * 오늘/어제는 그대로, 그 이전은 "7월 24일 금요일" 형태로 보여준다.
 */
export function getDateGroupLabel(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}요일`;
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? '오전' : '오후';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinute = minutes.toString().padStart(2, '0');
  return `${period} ${displayHour}:${displayMinute}`;
}
