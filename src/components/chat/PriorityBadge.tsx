import { cn } from "@/src/lib/utils";
import type { Priority } from "@/src/types";

const priorityConfig: Record<
  Priority,
  { label: string; className: string; description: string }
> = {
  P0: {
    label: "P0 否决级",
    className: "border-red-200 bg-red-50 text-red-700",
    description: "国资红线 / 重大法务 / 数据造假",
  },
  P1: {
    label: "P1 博弈级",
    className: "border-orange-200 bg-orange-50 text-orange-700",
    description: "估值重构与条款重新考量",
  },
  P2: {
    label: "P2 管控级",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    description: "交割前提与投后管控",
  },
  P3: {
    label: "P3 噪音级",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    description: "口径差异 / 笔误 / 商业推测",
  },
};

export function PriorityBadge({
  priority,
  showDescription = false,
  size = "default",
}: {
  priority: Priority;
  showDescription?: boolean;
  size?: "default" | "sm";
}) {
  const cfg = priorityConfig[priority];
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center rounded-full border font-semibold",
          cfg.className,
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"
        )}
      >
        {cfg.label}
      </span>
      {showDescription && <span className="text-[11px] text-slate-500">{cfg.description}</span>}
    </div>
  );
}

export const priorityMeta = priorityConfig;
