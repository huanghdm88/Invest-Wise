import { useState } from "react";

import { CitationsFooter } from "@/src/components/chat/CitationsFooter";
import { CitedText } from "@/src/components/chat/CitedText";
import { PriorityBadge } from "@/src/components/chat/PriorityBadge";
import { SourceAnchorList } from "@/src/components/chat/SourceAnchorList";
import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconArrowRight,
  IconChevronDown,
  IconChevronUp,
  IconFactCheck,
  IconTarget,
} from "@/src/lib/icons";
import { isHighRisk, RISK_LEVEL_CONFIG } from "@/src/lib/risk-level";
import { cn } from "@/src/lib/utils";
import type { FactCompare, RiskLevel, SourceAnchor } from "@/src/types";

interface FactVerificationCardProps {
  title: string;
  level: RiskLevel;
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

function isZeroDelta(delta?: string) {
  if (!delta) return true;
  return /^0(\.0+)?%$/.test(delta.trim());
}

/** 按 R 级风险返回偏差行配色：R5 / R4 高亮，R3 琥珀，R1 / R2 中性 */
function levelTone(level: RiskLevel, open: boolean) {
  if (level === "R5") {
    return {
      card: open ? "border-red-300 bg-red-50/40 shadow-sm" : "border-red-200 bg-red-50/20",
      toggleClosed: "bg-red-50/70 text-red-700 hover:bg-red-100 hover:text-red-800",
      toggleOpen: "bg-red-100/80 text-red-900",
      toggleIcon: open ? "text-red-700" : "text-red-500",
      toggleChevron: "text-red-500",
      detailBg: "border-red-100 bg-red-50/50",
      indicatorBar: "bg-red-500",
      detailLabel: "text-red-700",
    };
  }
  if (level === "R4") {
    return {
      card: open
        ? "border-orange-300 bg-orange-50/40 shadow-sm"
        : "border-orange-200 bg-orange-50/20",
      toggleClosed: "bg-orange-50/70 text-orange-700 hover:bg-orange-100 hover:text-orange-800",
      toggleOpen: "bg-orange-100/80 text-orange-900",
      toggleIcon: open ? "text-orange-700" : "text-orange-500",
      toggleChevron: "text-orange-500",
      detailBg: "border-orange-100 bg-orange-50/50",
      indicatorBar: "bg-orange-500",
      detailLabel: "text-orange-700",
    };
  }
  if (level === "R3") {
    return {
      card: open ? "border-amber-300 bg-amber-50/40 shadow-sm" : "border-amber-200 bg-amber-50/20",
      toggleClosed: "bg-amber-50/70 text-amber-800 hover:bg-amber-100",
      toggleOpen: "bg-amber-100/80 text-amber-900",
      toggleIcon: open ? "text-amber-700" : "text-amber-500",
      toggleChevron: "text-amber-500",
      detailBg: "border-amber-100 bg-amber-50/50",
      indicatorBar: "bg-amber-500",
      detailLabel: "text-amber-800",
    };
  }
  return {
    card: open ? "border-slate-300 shadow-sm" : "border-slate-200",
    toggleClosed: "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900",
    toggleOpen: "bg-slate-50/80 text-slate-900",
    toggleIcon: open ? "text-slate-700" : "text-slate-400",
    toggleChevron: "text-slate-400",
    detailBg: "border-slate-100 bg-slate-50/40",
    indicatorBar: "",
    detailLabel: "text-slate-400",
  };
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

  // 默认展开第一个 R4/R5 偏差，方便用户直接看到关键差异
  const initialOpen = compares.findIndex(
    (c) => !isZeroDelta(c.delta) && isHighRisk(c.level)
  );
  const [openIdx, setOpenIdx] = useState<number | null>(
    initialOpen >= 0 ? initialOpen : null
  );

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <SFIcon icon={IconFactCheck} size={14} className="text-slate-700" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              事实交叉验证
            </span>
            <PriorityBadge level={level} size="sm" />
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
            {compares.map((c, idx) => {
              const zero = isZeroDelta(c.delta);
              const expandable = !zero && Boolean(c.deviationDetail);
              const open = openIdx === idx;
              const highRisk = !zero && isHighRisk(c.level);
              const tone = levelTone(highRisk ? c.level : "R2", open);
              return (
                <div
                  key={idx}
                  className={cn(
                    "relative overflow-hidden rounded-xl border bg-white transition-shadow",
                    tone.card
                  )}
                >
                  {highRisk && (
                    <span
                      className={cn(
                        "absolute inset-y-0 left-0 w-[3px]",
                        tone.indicatorBar
                      )}
                      aria-hidden
                    />
                  )}
                  <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 px-3 py-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        材料宣称值
                      </span>
                      <span className="mt-0.5 text-sm font-semibold text-slate-900 font-mono tabular-nums">
                        {c.claim.value}
                      </span>
                      <span className="mt-1 text-[11px] text-slate-500">
                        <CitedText
                          text={c.claim.source}
                          citations={citations}
                          onView={onViewSource}
                        />
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-1 px-2">
                      <span className="text-[10px] text-slate-400">{c.label}</span>
                      <div
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                          RISK_LEVEL_CONFIG[c.level].className
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
                        <CitedText
                          text={c.reality.source}
                          citations={citations}
                          onView={onViewSource}
                        />
                      </span>
                    </div>
                  </div>

                  {expandable && (
                    <button
                      type="button"
                      onClick={() => setOpenIdx(open ? null : idx)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 border-t border-slate-100 px-3 py-2 text-[11px] font-medium transition-colors",
                        open ? tone.toggleOpen : tone.toggleClosed
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <SFIcon icon={IconTarget} size={11} className={tone.toggleIcon} />
                        偏差详情 · 成因 / 影响 / 处置建议
                      </span>
                      <SFIcon
                        icon={open ? IconChevronUp : IconChevronDown}
                        size={11}
                        className={tone.toggleChevron}
                      />
                    </button>
                  )}

                  {expandable && open && c.deviationDetail && (
                    <div
                      className={cn(
                        "space-y-3 border-t px-4 py-3 animate-staged-reveal",
                        tone.detailBg
                      )}
                    >
                      <DeviationRow
                        label="差异成因"
                        text={c.deviationDetail.explanation}
                        labelClassName={highRisk ? tone.detailLabel : undefined}
                        citations={citations}
                        onViewSource={onViewSource}
                      />
                      <DeviationRow
                        label="业务影响"
                        text={c.deviationDetail.impact}
                        tone="warning"
                        citations={citations}
                        onViewSource={onViewSource}
                      />
                      {c.deviationDetail.recommendation && (
                        <DeviationRow
                          label="处置建议"
                          text={c.deviationDetail.recommendation}
                          tone="action"
                          citations={citations}
                          onViewSource={onViewSource}
                        />
                      )}

                      {c.deviationDetail.evidence && c.deviationDetail.evidence.length > 0 && (
                        <div>
                          <p
                            className={cn(
                              "mb-1.5 text-[10px] font-semibold uppercase tracking-wider",
                              highRisk ? tone.detailLabel : "text-slate-400"
                            )}
                          >
                            关键证据锚点 · {c.deviationDetail.evidence.length} 条
                          </p>
                          <div className="space-y-1.5">
                            {c.deviationDetail.evidence.map((ev, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => onViewSource(ev)}
                                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
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
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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

function DeviationRow({
  label,
  text,
  tone = "default",
  labelClassName,
  citations,
  onViewSource,
}: {
  label: string;
  text: string;
  tone?: "default" | "warning" | "action";
  /** 当行需要随宿主 R 级风险高亮时由外层传入（如 R5 红色 / R4 橙色） */
  labelClassName?: string;
  citations?: SourceAnchor[];
  onViewSource: (anchor: SourceAnchor) => void;
}) {
  return (
    <div>
      <p
        className={cn(
          "mb-1 text-[10px] font-semibold uppercase tracking-wider",
          tone === "warning" && "text-orange-600",
          tone === "action" && "text-emerald-600",
          tone === "default" && (labelClassName ?? "text-slate-400")
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "text-[12px] leading-relaxed",
          tone === "warning" && "text-slate-800",
          tone === "action" && "text-slate-800",
          tone === "default" && "text-slate-700"
        )}
      >
        <CitedText text={text} citations={citations} onView={onViewSource} />
      </p>
    </div>
  );
}
