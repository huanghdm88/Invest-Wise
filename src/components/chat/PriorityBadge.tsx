import { cn } from "@/src/lib/utils";
import { RISK_LEVEL_CONFIG } from "@/src/lib/risk-level";
import type { RiskLevel } from "@/src/types";

export function PriorityBadge({
  level,
  showDescription = false,
  size = "default",
}: {
  level: RiskLevel;
  showDescription?: boolean;
  size?: "default" | "sm";
}) {
  const cfg = RISK_LEVEL_CONFIG[level];
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
      {showDescription && (
        <span className="text-[11px] text-slate-500">{cfg.description}</span>
      )}
    </div>
  );
}

export const riskLevelMeta = RISK_LEVEL_CONFIG;
