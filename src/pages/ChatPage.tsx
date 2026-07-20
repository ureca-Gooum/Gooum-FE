import { ListPanel } from '@/components/layout/ListPanel';
import { MainPanel } from '@/components/layout/MainPanel';

export const ChatPage = () => {
  return (
    // flex: 3단 구조
    <div className="flex flex-1">
      <ListPanel header={<h2 className="font-semibold text-fg-primary">채팅</h2>}>
        <p className="p-4 text-sm text-fg-tertiary">채팅 목록 자리</p>
      </ListPanel>

      <MainPanel
        header={<h2 className="font-semibold text-fg-primary">Daichi Fukuda</h2>}
        footer={
          <input
            className="w-full rounded-lg border border-border-default px-4 py-2 text-sm"
            placeholder="메시지 보내기"
          />
        }>
        <p className="text-sm text-fg-tertiary">메시지 목록 자리</p>
      </MainPanel>
    </div>
  );
};
