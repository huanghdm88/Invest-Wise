import { useEffect, useMemo, useRef, useState } from "react";

import { CitationsFooter } from "@/src/components/chat/CitationsFooter";
import { CitedText } from "@/src/components/chat/CitedText";
import { PriorityBadge } from "@/src/components/chat/PriorityBadge";
import { VerificationCard } from "@/src/components/chat/VerificationCard";
import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconChecklist,
  IconChevronDown,
  IconChevronRight,
  IconInfo,
} from "@/src/lib/icons";
import { cn } from "@/src/lib/utils";
import type {
  AssistantBlock,
  DiligenceContent,
  DiligenceSection,
  SemanticTone,
  SourceAnchor,
} from "@/src/types";

type DiligenceBlock = Extract<AssistantBlock, { kind: "diligence-report" }>;

interface DiligenceReportCardProps {
  block: DiligenceBlock;
  onViewSource: (anchor: SourceAnchor) => void;
}

const toneText: Record<SemanticTone, string> = {
  danger: "text-rose-600",
  warning: "text-amber-600",
  neutral: "text-slate-700",
  positive: "text-emerald-600",
};

const toneDot: Record<SemanticTone, string> = {
  danger: "bg-rose-500",
  warning: "bg-amber-500",
  neutral: "bg-slate-300",
  positive: "bg-emerald-500",
};

const toneBar: Record<SemanticTone, string> = {
  danger: "bg-rose-400",
  warning: "bg-amber-400",
  neutral: "bg-slate-400",
  positive: "bg-emerald-400",
};

const calloutStyle: Record<
  SemanticTone,
  { wrap: string; title: string; icon: string }
> = {
  danger: {
    wrap: "border-rose-200 bg-rose-50/70",
    title: "text-rose-800",
    icon: "text-rose-500",
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50/70",
    title: "text-amber-800",
    icon: "text-amber-500",
  },
  neutral: {
    wrap: "border-slate-200 bg-slate-50/70",
    title: "text-slate-800",
    icon: "text-slate-500",
  },
  positive: {
    wrap: "border-emerald-200 bg-emerald-50/70",
    title: "text-emerald-800",
    icon: "text-emerald-500",
  },
};

/** 富文本：支持 **高亮** 与 [^N] 引用（引用悬停看来源、点击看原文） */
function RichText({
  text,
  citations,
  onView,
}: {
  text: string;
  citations?: SourceAnchor[];
  onView: (a: SourceAnchor) => void;
}) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (/^\*\*[^*]+\*\*$/.test(p)) {
          return (
            <mark
              key={i}
              className="rounded bg-amber-100/90 px-1 font-semibold text-amber-900"
            >
              <CitedText text={p.slice(2, -2)} citations={citations} onView={onView} />
            </mark>
          );
        }
        return (
          <CitedText key={i} text={p} citations={citations} onView={onView} />
        );
      })}
    </>
  );
}

function ContentRenderer({
  content,
  citations,
  onView,
}: {
  content: DiligenceContent;
  citations?: SourceAnchor[];
  onView: (a: SourceAnchor) => void;
}) {
  switch (content.type) {
    case "paragraph":
      return (
        <p className="text-[13px] leading-relaxed text-slate-700">
          <RichText text={content.text} citations={citations} onView={onView} />
        </p>
      );

    case "bullets": {
      const ListTag = content.ordered ? "ol" : "ul";
      return (
        <ListTag
          className={cn(
            "space-y-1.5 text-[13px] leading-relaxed text-slate-700",
            content.ordered ? "list-decimal pl-5" : "pl-1"
          )}
        >
          {content.items.map((it, i) => (
            <li key={i} className={cn(!content.ordered && "flex gap-2")}>
              {!content.ordered && (
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              )}
              <span className={cn(!content.ordered && "min-w-0 flex-1")}>
                <RichText text={it} citations={citations} onView={onView} />
              </span>
            </li>
          ))}
        </ListTag>
      );
    }

    case "callout": {
      const s = calloutStyle[content.tone];
      return (
        <div className={cn("rounded-xl border px-4 py-3", s.wrap)}>
          {content.title && (
            <p
              className={cn(
                "mb-1 flex items-center gap-1.5 text-[12px] font-semibold",
                s.title
              )}
            >
              <SFIcon icon={IconInfo} size={12} className={s.icon} />
              {content.title}
            </p>
          )}
          <p className="text-[12.5px] leading-relaxed text-slate-700">
            <RichText text={content.text} citations={citations} onView={onView} />
          </p>
        </div>
      );
    }

    case "stats":
      return (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {content.items.map((s, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-3"
            >
              <p className="text-[10.5px] font-medium leading-tight text-slate-400">
                {s.label}
              </p>
              <p
                className={cn(
                  "mt-1 text-[18px] font-semibold tabular-nums leading-none",
                  toneText[s.tone ?? "neutral"]
                )}
              >
                {s.value}
              </p>
              {s.sub && (
                <p className="mt-1 text-[10.5px] leading-tight text-slate-400">
                  {s.sub}
                </p>
              )}
            </div>
          ))}
        </div>
      );

    case "bars":
      return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
          {content.caption && (
            <p className="mb-2.5 text-[11px] font-medium text-slate-400">
              {content.caption}
            </p>
          )}
          <div className="space-y-2.5">
            {content.items.map((b, i) => (
              <div key={i}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-[12px] text-slate-600">{b.label}</span>
                  <span
                    className={cn(
                      "text-[12px] font-semibold tabular-nums",
                      toneText[b.tone ?? "neutral"]
                    )}
                  >
                    {b.display}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      toneBar[b.tone ?? "neutral"]
                    )}
                    style={{ width: `${Math.max(2, Math.min(100, b.value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "table":
      return (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-slate-50">
                {content.headers.map((h, i) => (
                  <th
                    key={i}
                    className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.rows.map((row, ri) => (
                <tr key={ri} className="even:bg-slate-50/40">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        "border-b border-slate-100 px-3 py-2 align-top text-slate-700",
                        content.emphasizeCol === ci &&
                          "font-semibold text-slate-900"
                      )}
                    >
                      <RichText text={cell} citations={citations} onView={onView} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "verification-cards":
      return (
        <VerificationCardsBlock content={content} onView={onView} />
      );

    default:
      return null;
  }
}

/** 「证据不足项 / 一致项」等长清单默认折叠；点击行标题展开 */
function VerificationCardsBlock({
  content,
  onView,
}: {
  content: Extract<DiligenceContent, { type: "verification-cards" }>;
  onView: (a: SourceAnchor) => void;
}) {
  const [collapsed, setCollapsed] = useState(content.defaultCollapsed ?? false);
  if (!content.caption) {
    return (
      <div className="space-y-2">
        {content.items.map((it) => (
          <VerificationCard key={it.index} item={it} onViewSource={onView} />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
        aria-expanded={!collapsed}
      >
        <span>{content.caption}</span>
        <SFIcon
          icon={IconChevronDown}
          size={12}
          className={cn(
            "text-slate-400 transition-transform",
            !collapsed && "rotate-180"
          )}
        />
      </button>
      {!collapsed && (
        <div className="space-y-2">
          {content.items.map((it) => (
            <VerificationCard key={it.index} item={it} onViewSource={onView} />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionBlock({
  section,
  open,
  onToggle,
  citations,
  onView,
  registerRef,
}: {
  section: DiligenceSection;
  open: boolean;
  onToggle: () => void;
  citations?: SourceAnchor[];
  onView: (a: SourceAnchor) => void;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={registerRef}
      id={`dr-${section.id}`}
      className="scroll-mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-50"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 text-[14px] font-semibold text-slate-900">
          {section.title}
        </span>
        <SFIcon
          icon={IconChevronDown}
          size={13}
          className={cn(
            "shrink-0 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="space-y-3.5 border-t border-slate-100 px-4 py-4">
          {section.content.map((c, i) => (
            <ContentRenderer
              key={i}
              content={c}
              citations={citations}
              onView={onView}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DiligenceReportCard({
  block,
  onViewSource,
}: DiligenceReportCardProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(block.sections.filter((s) => s.defaultOpen ?? true).map((s) => s.id))
  );
  const [tocCollapsed, setTocCollapsed] = useState(false);
  const [activeId, setActiveId] = useState<string>(
    () => block.sections[0]?.id ?? ""
  );
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rootRef = useRef<HTMLDivElement>(null);

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const jumpTo = (id: string) => {
    setActiveId(id);
    setOpenIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // 等展开后再滚动
    requestAnimationFrame(() => {
      sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  /** 滚动联动：高亮当前滚动到的章节（监听抽屉滚动容器） */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let scroller: HTMLElement | null = root.parentElement;
    while (scroller && scroller !== document.body) {
      const oy = getComputedStyle(scroller).overflowY;
      if (oy === "auto" || oy === "scroll") break;
      scroller = scroller.parentElement;
    }
    const target: HTMLElement | Window = scroller ?? window;

    const computeActive = () => {
      const containerTop = scroller ? scroller.getBoundingClientRect().top : 0;
      const threshold = 100;
      let current = block.sections[0]?.id ?? "";
      for (const s of block.sections) {
        const el = sectionRefs.current[s.id];
        if (!el) continue;
        const top = el.getBoundingClientRect().top - containerTop;
        if (top <= threshold) current = s.id;
      }
      setActiveId(current);
    };

    computeActive();
    target.addEventListener("scroll", computeActive, { passive: true });
    return () => target.removeEventListener("scroll", computeActive);
  }, [block.sections, openIds, tocCollapsed]);

  const allOpen = useMemo(
    () => block.sections.every((s) => openIds.has(s.id)),
    [block.sections, openIds]
  );

  const setAll = (open: boolean) =>
    setOpenIds(open ? new Set(block.sections.map((s) => s.id)) : new Set());

  return (
    <div ref={rootRef} className="space-y-4">
      {/* —— 结论概览 —— */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/60 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            尽调复核结论
          </span>
          <PriorityBadge level={block.verdict.riskLevel} size="sm" />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
            <p className="text-[10.5px] text-slate-400">最终建议</p>
            <p className="mt-0.5 text-[15px] font-semibold text-rose-600">
              {block.verdict.recommendation}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
            <p className="text-[10.5px] text-slate-400">整体风险评级</p>
            <p className="mt-0.5 text-[15px] font-semibold text-slate-900">
              {block.verdict.riskLevel} · 高
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
            <p className="text-[10.5px] text-slate-400">估值判断</p>
            <p className="mt-0.5 text-[15px] font-semibold text-amber-600">
              {block.verdict.valuation}
            </p>
          </div>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-slate-600">
          <RichText
            text={block.summary}
            citations={block.citations}
            onView={onViewSource}
          />
        </p>
      </div>

      {/* —— 关键指标可视化 —— */}
      {block.metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {block.metrics.map((m, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-3"
            >
              <p className="text-[10.5px] font-medium leading-tight text-slate-400">
                {m.label}
              </p>
              <p
                className={cn(
                  "mt-1 text-[19px] font-semibold tabular-nums leading-none",
                  toneText[m.tone ?? "neutral"]
                )}
              >
                {m.value}
              </p>
              {m.sub && (
                <p className="mt-1 text-[10.5px] leading-tight text-slate-400">
                  {m.sub}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* —— 正文 + 右侧快捷目录 ——
          目录始终在「右侧」，折叠态只是从 200px 列收缩成 36px 小窄列，
          位置保持原地，避免视觉跳转 */}
      <div
        className={cn(
          "lg:grid lg:gap-5",
          tocCollapsed
            ? "lg:grid-cols-[minmax(0,1fr)_36px]"
            : "lg:grid-cols-[minmax(0,1fr)_200px]"
        )}
      >
        {/* 正文章节 —— 永远在左侧 */}
        <div className="order-2 min-w-0 space-y-3 lg:order-1">
          {block.sections.map((s) => (
            <SectionBlock
              key={s.id}
              section={s}
              open={openIds.has(s.id)}
              onToggle={() => toggle(s.id)}
              citations={block.citations}
              onView={onViewSource}
              registerRef={(el) => {
                sectionRefs.current[s.id] = el;
              }}
            />
          ))}

          {block.citations.length > 0 && (
            <CitationsFooter citations={block.citations} onView={onViewSource} />
          )}
        </div>

        {/* 目录 —— 永远在右侧；折叠态只显示一颗 36×36 的图标按钮 */}
        <nav className="order-1 mb-4 lg:order-2 lg:mb-0">
          <div className="lg:sticky lg:top-2">
            {tocCollapsed ? (
              <button
                type="button"
                onClick={() => setTocCollapsed(false)}
                title="展开目录"
                aria-label="展开目录"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <SFIcon icon={IconChecklist} size={14} />
              </button>
            ) : (
              <>
                <div className="flex items-center justify-between px-1 pb-2">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    目录
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAll(!allOpen)}
                      className="text-[10.5px] font-medium text-slate-400 hover:text-slate-700"
                    >
                      {allOpen ? "全部折叠" : "全部展开"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTocCollapsed(true)}
                      title="收起目录"
                      aria-label="收起目录"
                      className="flex h-5 w-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      <SFIcon icon={IconChevronRight} size={12} />
                    </button>
                  </div>
                </div>
                <ul className="space-y-0.5">
                  {block.sections.map((s) => {
                    const active = activeId === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => jumpTo(s.id)}
                          aria-current={active ? "true" : undefined}
                          className={cn(
                            "group flex w-full items-center rounded-lg px-2 py-1.5 text-left transition-colors",
                            active ? "bg-slate-900/[0.06]" : "hover:bg-slate-100"
                          )}
                        >
                          <span
                            className={cn(
                              "min-w-0 flex-1 truncate text-[12px] leading-snug",
                              active
                                ? "font-semibold text-slate-900"
                                : "text-slate-600 group-hover:text-slate-900"
                            )}
                          >
                            {s.title}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
