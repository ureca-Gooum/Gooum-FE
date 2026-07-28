/**
 * window.alert()을 대체하는 커스텀 알림 모달용 전역 트리거.
 * 리덕스/줄스탄드 같은 상태관리 라이브러리 없이, 아주 가벼운 pub-sub으로 구현했다.
 * 앱 루트(main.tsx)에 <AlertModal />을 한 번 마운트해두면, 어디서든 showAlert()만
 * 호출해서 같은 디자인의 알림창을 띄울 수 있다.
 */

export interface AlertOptions {
  title?: string;
  message: string;
  isDestructive?: boolean;
}

type Listener = (options: AlertOptions) => void;

let listener: Listener | null = null;

export function subscribeAlert(fn: Listener) {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

export function showAlert(message: string, options?: Omit<AlertOptions, 'message'>) {
  if (!listener) {
    // 혹시 AlertModal이 아직 마운트되기 전이라면(아주 드문 경우) 최소한의 안전장치로 네이티브 alert를 쓴다.
    window.alert(message);
    return;
  }
  listener({ message, ...options });
}
