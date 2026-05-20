import { cn } from "@/src/lib/utils";

/** Invest Wise 品牌 logo - 简洁的几何标记 */
export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path d="M4 18 L9 12 L13 15 L20 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="20" cy="6" r="1.6" fill="currentColor" />
        </svg>
      </div>
      {withText && (
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight text-slate-900">Invest Wise</span>
          <span className="text-[10px] font-medium text-slate-500">投决智能体</span>
        </div>
      )}
    </div>
  );
}
