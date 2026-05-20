import { useState } from "react";

import { CitationsFooter } from "@/src/components/chat/CitationsFooter";
import { CitedText } from "@/src/components/chat/CitedText";
import { PriorityBadge } from "@/src/components/chat/PriorityBadge";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { IconChecklist, IconChevronDown, IconChevronUp, IconTarget } from "@/src/lib/icons";
import { cn } from "@/src/lib/utils";
import type { ChallengeItem, SourceAnchor } from "@/src/types";

interface ChallengeListCardProps {
  title: string;
  summary: string;
  items: ChallengeItem[];
  citations?: SourceAnchor[];
  onViewSource: (anchor: SourceAnchor) => void;
}

const categoryClass: Record<ChallengeItem["category"], string> = {
  行业: "border-sky-200 bg-sky-50 text-sky-700",
  团队: "border-violet-200 bg-violet-50 text-violet-700",
  产品: "border-cyan-200 bg-cyan-50 text-cyan-700",
  财务: "border-emerald-200 bg-emerald-50 text-emerald-700",
  合规: "border-rose-200 bg-rose-50 text-rose-700",
  估值: "border-amber-200 bg-amber-50 text-amber-700",
};

export function ChallengeListCard({
  title,
  summary,
  items,
  citations,
  onViewSource,
}: ChallengeListCardProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-5 py-4">
          <div className="flex items-center gap-2">
            <SFIcon icon={IconChecklist} size={14} className="text-slate-700" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              挑战质询清单
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            <CitedText text={summary} citations={citations} onView={onViewSource} />
          </p>
        </div>

        <ul className="divide-y divide-slate-100">
          {items.map((item, idx) => {
            const open = openId === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.id)}
                  className={cn(
                    "flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50/60",
                    open && "bg-slate-50/40"
                  )}
                >
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[11px] font-semibold text-white">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={item.priority} size="sm" />
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          categoryClass[item.category]
                        )}
                      >
                        {item.category}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-700 line-clamp-2">
                      <CitedText
                        text={item.coreLogic}
                        citations={citations}
                        onView={onViewSource}
                      />
                    </p>
                  </div>
                  <div className="mt-1.5 shrink-0 text-slate-400">
                    <SFIcon icon={open ? IconChevronUp : IconChevronDown} size={13} />
                  </div>
                </button>

                {open && (
                  <div className="space-y-4 border-t border-slate-100 bg-slate-50/40 px-5 py-4 pl-14 animate-staged-reveal">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        核心矛盾
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-900">
                        <CitedText
                          text={item.coreLogic}
                          citations={citations}
                          onView={onViewSource}
                        />
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        事实底座 · {item.evidence.length} 条
                      </p>
                      <div className="mt-1.5 space-y-1.5">
                        {item.evidence.map((ev, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onViewSource(ev)}
                            className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
                          >
                            <p className="text-xs leading-relaxed text-slate-700 line-clamp-2">
                              {ev.excerpt}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-500">
                              《{ev.document}》P{ev.page}
                              {ev.paragraph && ` · ${ev.paragraph}`}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-900/10 bg-slate-900 px-4 py-3 text-white">
                      <div className="flex items-center gap-1.5">
                        <SFIcon icon={IconTarget} size={12} />
                        <p className="text-[10px] font-semibold uppercase tracking-wider">
                          Agent 条款建议
                        </p>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {item.actionAdvice.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/60" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <CitationsFooter citations={citations} onView={onViewSource} />
    </div>
  );
}
