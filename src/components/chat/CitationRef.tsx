import { Tooltip, TooltipContent, TooltipTrigger } from "@/src/components/ui/tooltip";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { IconFileText } from "@/src/lib/icons";
import { cn } from "@/src/lib/utils";
import type { SourceAnchor } from "@/src/types";

interface CitationRefProps {
  /** 1-based 引用序号 */
  index: number;
  anchor: SourceAnchor;
  onView: (anchor: SourceAnchor) => void;
  className?: string;
}

/** 高亮 excerpt 中的命中关键字（与 QuoteViewer 一致的轻量实现） */
function renderHighlighted(text: string, highlight?: string[]) {
  if (!highlight || highlight.length === 0) return text;
  const escaped = highlight.map((h) => h.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(re);
  return parts.map((part, i) =>
    escaped.some((e) => new RegExp(`^${e}$`).test(part)) ? (
      <mark
        key={i}
        className="rounded-sm bg-amber-400/30 px-0.5 font-medium text-amber-200"
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/**
 * 内联引用标识符 — 视觉上类似上标 [N]，悬停展开 tooltip，点击打开 QuoteViewer 看完整原文。
 * 颗粒度到一句话，excerpt 即引用片段。
 */
export function CitationRef({ index, anchor, onView, className }: CitationRefProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView(anchor);
          }}
          aria-label={`引用 ${index}：《${anchor.document}》P${anchor.page}`}
          className={cn(
            "mx-0.5 -translate-y-0.5 inline-flex h-[15px] min-w-[18px] items-center justify-center rounded border px-1 align-text-top text-[10px] font-semibold tabular-nums transition-colors",
            "border-gray-200 bg-gray-100 text-gray-700",
            "hover:border-gray-900 hover:bg-gray-900 hover:text-white focus-visible:border-gray-900 focus-visible:bg-gray-900 focus-visible:text-white focus-visible:outline-none",
            className
          )}
        >
          {index}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        sideOffset={4}
        className="z-50 max-w-[360px] rounded-xl border border-gray-700 bg-gray-900 p-0 text-white shadow-xl"
      >
        <div className="flex items-start gap-2 border-b border-gray-700 px-3 py-2">
          <span className="mt-0.5 inline-flex h-[18px] min-w-[22px] shrink-0 items-center justify-center rounded bg-white px-1 text-[10px] font-semibold text-gray-900">
            {index}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              <SFIcon icon={IconFileText} size={10} className="text-gray-400" />
              知识库引用
            </div>
            <p className="mt-0.5 truncate text-[12px] font-semibold text-white">
              《{anchor.document}》
            </p>
            <p className="text-[10.5px] text-gray-400">
              P{anchor.page}
              {anchor.paragraph && ` · ${anchor.paragraph}`}
            </p>
          </div>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[12px] leading-relaxed text-gray-100">
            「{renderHighlighted(anchor.excerpt, anchor.highlight)}」
          </p>
          <p className="mt-2 text-[10.5px] text-gray-500">点击查看完整原文片段</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
