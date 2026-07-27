export function HeaderLogo() {
  return (
    <div className="group relative flex h-10 w-10 shrink-0 items-center">
      {/* 캐릭터: 항상 같은 자리, 텍스트보다 위에 그려짐 */}
      <img src="/favicon.png" alt="구움" className="hidden @md:block relative z-10 h-10 w-10 shrink-0" />

      <div className="relative z-0 -ml-3 w-0 shrink-0 overflow-hidden transition-[width] duration-300 ease-out group-hover:w-[76px]">
        <span className="whitespace-nowrap pl-4 text-[15px] font-extrabold tracking-tight text-brand-primary">
          GOOUM
        </span>
      </div>
    </div>
  );
}
