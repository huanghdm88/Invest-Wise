import { CitationsFooter } from "@/src/components/chat/CitationsFooter";
import { CitedText } from "@/src/components/chat/CitedText";
import { PriorityBadge } from "@/src/components/chat/PriorityBadge";
import { SourceAnchorList } from "@/src/components/chat/SourceAnchorList";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { IconArrowRight, IconFactCheck } from "@/src/lib/icons";
import { cn } from "@/src/lib/utils";
import type { FactCompare, Priority, SourceAnchor } from "@/src/types";

interface FactVerificationCardProps {
  title: string;
  level: Priority;
  summary: string;
  compares: FactCompare[];
  anchors: SourceAnchor[];
  citations?: SourceAnchor[];
  onViewSource: (anchor: SourceAnchor) => void;
}

function deltaClass(delta?: string) {
  if (!delta) return "text-slate-500";
  if (delta.includes("0%") && !delta.includes(".")) return "text-slate-500";
  if (delta.startsWith("+")) return "text-orange-600";
  if (delta.startsWith("-")) return "text-emerald-600";
  return "text-slate-600";
}

export function FactVerificationCard({
  title,
  level,
  summary,
  compares,
  anchors,
  citations,
  onViewSource,
}: FactVerificationCardProps) {
  const hasCitations = citations && citations.length > 0;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <SFIcon icon={IconFactCheck} size={14} className="text-slate-700" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              事实交叉验证
            </span>
            <PriorityBadge priority={level} size="sm" />
          </div>
          <h3 className="mt-1.5 text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            <CitedText text={summary} citations={citations} onView={onViewSource} />
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            证据对比
          </p>
          <div className="space-y-2.5">
            {compares.map((c, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    材料宣称值
                  </span>
                  <span className="mt-0.5 text-sm font-semibold text-slate-900 font-mono tabular-nums">
                    {c.claim.value}
                  </span>
                  <span className="mt-1 text-[11px] text-slate-500">
                    <CitedText text={c.claim.source} citations={citations} onView={onViewSource} />
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 px-2">
                  <span className="text-[10px] text-slate-400">{c.label}</span>
                  <div
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                      c.level === "P0" && "border-red-200 bg-red-50 text-red-700",
                      c.level === "P1" && "border-orange-200 bg-orange-50 text-orange-700",
                      c.level === "P2" && "border-amber-200 bg-amber-50 text-amber-700",
                      c.level === "P3" && "border-slate-200 bg-slate-50 text-slate-600"
                    )}
                  >
                    <SFIcon icon={IconArrowRight} size={10} />
                    <span className={cn("font-mono", deltaClass(c.delta))}>{c.delta ?? "—"}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    实证 / 校验值
                  </span>
                  <span className="mt-0.5 text-sm font-semibold text-slate-900 font-mono tabular-nums">
                    {c.reality.value}
                  </span>
                  <span className="mt-1 text-[11px] text-slate-500">
                    <CitedText text={c.reality.source} citations={citations} onView={onViewSource} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 旧版「证据锚点」摘要：当未提供 citations 时退回展示，避免影响历史数据 */}
        {!hasCitations && anchors && anchors.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
            <SourceAnchorList anchors={anchors} onView={onViewSource} compact />
          </div>
        )}
      </div>

      <CitationsFooter citations={citations} onView={onViewSource} />
    </div>
  );
}
