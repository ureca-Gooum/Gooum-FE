export function HeaderLogo() {
  return (
    <div className="group relative flex h-10 w-10 shrink-0 items-center">
      {/* 캐릭터: 항상 같은 자리, 텍스트보다 위에 그려짐 */}
      <img src="/favicon.svg" alt="구움" className="relative z-10 h-10 w-10 shrink-0" />

      {/*
        GOOUM 텍스트: 캐릭터 뒤(z-0)에서 시작해서, 부모(group)에 호버하면 오른쪽으로 펼쳐진다.
        부모가 flex인데 이 div에 shrink-0이 없으면, 부모 폭(w-10=40px)보다 커지는 순간
        flex-shrink 때문에 다시 눌려버려서 width가 76px로 찍혀도 실제로는 안 벌어져 보인다.
      */}
      <div className="relative z-0 -ml-3 w-0 shrink-0 overflow-hidden transition-[width] duration-300 ease-out group-hover:w-[76px]">
        <span className="whitespace-nowrap pl-4 text-[15px] font-extrabold tracking-tight text-brand-primary">
          GOOUM
        </span>
      </div>
    </div>
  );
}
