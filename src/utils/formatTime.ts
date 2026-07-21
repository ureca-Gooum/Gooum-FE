export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? '오전' : '오후';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinute = minutes.toString().padStart(2, '0');
  return `${period} ${displayHour}:${displayMinute}`;
}
