import { useState } from "react";

import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconChevronDown,
  IconChevronRight,
  IconFileText,
} from "@/src/lib/icons";
import { RISK_LEVEL_CONFIG } from "@/src/lib/risk-level";
import { cn } from "@/src/lib/utils";
import type {
  SourceAnchor,
  VerificationCardItem,
  VerificationCategory,
  VerificationVerdict,
} from "@/src/types";

interface VerificationCardProps {
  item: VerificationCardItem;
  onViewSource: (anchor: SourceAnchor) => void;
}

/** 7 个分类（与 HTML cat-xxx 配色对齐，但向项目设计风格做了去饱和处理） */
const CATEGORY_STYLE: Record<
  VerificationCategory,
  { wrap: string; dot: string }
> = {
  财务数据: {
    wrap: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  募资: {
    wrap: "border-violet-200 bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
  },
  融资数据: {
    wrap: "border-violet-200 bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
  },
  法务合规: {
    wrap: "border-cyan-200 bg-cyan-50 text-cyan-700",
    dot: "bg-cyan-500",
  },
  客户数据: {
    wrap: "border-orange-200 bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
  },
  业务数据: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  市场行业: {
    wrap: "border-pink-200 bg-pink-50 text-pink-700",
    dot: "bg-pink-500",
  },
  团队治理: {
    wrap: "border-indigo-200 bg-indigo-50 text-indigo-700",
    dot: "bg-indigo-500",
  },
};

/** 4 种结论的胶囊样式（参考 HTML c-ok / c-partial / c-insufficient / c-bad） */
const VERDICT_STYLE: Record<
  VerificationVerdict,
  { wrap: string; label: string }
> = {
  一致: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-700",
    label: "一致",
  },
  部分一致: {
    wrap: "border-amber-200 bg-amber-50 text-amber-700",
    label: "部分一致",
  },
  不一致: {
    wrap: "border-rose-200 bg-rose-50 text-rose-700",
    label: "不一致",
  },
  证据不足: {
    wrap: "border-slate-200 bg-slate-100 text-slate-600",
    label: "证据不足",
  },
};

/**
 * 单条「主张 ⇄ 证据」对照卡片：
 *  ┌──────────────────────────────────────────────┐
 *  │ [分类]  [风险等级]                  [结论]   │
 *  ├────────────────────────┬─────────────────────┤
 *  │ #N 投资备忘录 主张      │ 证据摘要             │
 *  │ ...                     │ ...                  │
 *  │ 来源锚点                │             证据来源 ›│
 *  └────────────────────────┴─────────────────────┘
 */
export function VerificationCard({ item, onViewSource }: VerificationCardProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const cat = CATEGORY_STYLE[item.category];
  const verdict = VERDICT_STYLE[item.verdict];
  const riskCfg = RISK_LEVEL_CONFIG[item.riskLevel];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {/* 顶部 chip 栏：纯白背景，左侧分类 + 风险等级；右侧结论 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
              cat.wrap
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", cat.dot)} />
            {item.category}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
              riskCfg.className
            )}
          >
            {riskCfg.label}
          </span>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
            verdict.wrap
          )}
        >
          {verdict.label}
        </span>
      </div>

      {/* 主体：左右两栏（主张为「主角」，证据为辅证） */}
      <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-[1.05fr_1fr] md:divide-x md:divide-y-0">
        {/* 左：投资备忘录主张 —— 主背景白 + 左侧蓝色强调条 + 加粗正文，突出"主张是被验证的源头" */}
        <div className="relative bg-white px-4 py-3.5 pl-5">
          <span
            aria-hidden
            className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-blue-500/80"
          />
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
            <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              #{item.index}
            </span>
            投资备忘录 · 主张
          </p>
          <p className="whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-slate-900">
            {item.claim}
          </p>
          {item.claimSources && item.claimSources.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {item.claimSources.map((a, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onViewSource(a)}
                  className="inline-flex max-w-full items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10.5px] text-slate-500 transition-colors hover:border-slate-900 hover:text-slate-900"
                  title={a.excerpt}
                >
                  <SFIcon icon={IconFileText} size={10} className="shrink-0" />
                  <span className="truncate">
                    {a.document} · P{a.page}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 右：证据摘要 —— 微灰底 + 常规字重，作为对照与支撑 */}
        <div className="flex flex-col bg-slate-50/60 px-4 py-3.5">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
            证据摘要
          </p>
          <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-600">
            {item.evidence}
          </p>
          {item.evidenceSources.length > 0 && (
            <div className="mt-3 flex flex-col items-end gap-1.5">
              <button
                type="button"
                onClick={() => setSourcesOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-blue-600 transition-colors hover:text-blue-800"
                aria-expanded={sourcesOpen}
              >
                证据来源 · {item.evidenceSources.length}
                <SFIcon
                  icon={sourcesOpen ? IconChevronDown : IconChevronRight}
                  size={11}
                />
              </button>
              {sourcesOpen && (
                <div className="flex w-full flex-col gap-1">
                  {item.evidenceSources.map((a, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onViewSource(a)}
                      className="group flex items-start gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-left text-[11.5px] text-slate-600 transition-colors hover:border-slate-900 hover:bg-slate-50 hover:text-slate-900"
                      title={a.excerpt}
                    >
                      <SFIcon
                        icon={IconFileText}
                        size={11}
                        className="mt-0.5 shrink-0 text-slate-400 group-hover:text-slate-700"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {a.document}
                        </span>
                        <span className="block text-[10.5px] text-slate-400">
                          P{a.page}
                          {a.paragraph && ` · ${a.paragraph}`}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
