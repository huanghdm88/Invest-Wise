import { cn } from "@/src/lib/utils";

interface AnalyzingBadgeProps {
  label?: string;
  className?: string;
  /** sm：侧边栏；md：顶部 Header */
  size?: "sm" | "md";
}

/**
 * 动态「分析中」徽章：琥珀色圆点带 ping 动画。
 * 用于侧边栏项目行 & 顶部 WorkspaceHeader 项目名旁的状态指示。
 */
export function AnalyzingBadge({
  label = "分析中",
  className,
  size = "sm",
}: AnalyzingBadgeProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex select-none items-center gap-1 rounded-full border border-amber-200 bg-amber-50 font-medium text-amber-700",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
      </span>
      {label}
    </span>
  );
}
