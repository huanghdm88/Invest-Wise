import { SFIcon } from "@/src/components/ui/sf-icon";
import { IconFileText } from "@/src/lib/icons";
import { cn } from "@/src/lib/utils";
import type { SourceAnchor } from "@/src/types";

interface CitationsFooterProps {
  citations?: SourceAnchor[];
  onView: (anchor: SourceAnchor) => void;
  /** 折叠成更紧凑的样式（默认 false，详情抽屉用展开版） */
  compact?: boolean;
  className?: string;
}

/**
 * 报告详情抽屉里的「知识库引用」聚合区。
 * 1-based 序号与正文里的 [N] 一一对应；点击任意一条打开 QuoteViewer 看完整原文。
 */
export function CitationsFooter({
  citations,
  onView,
  compact = false,
  className,
}: CitationsFooterProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <section
      aria-label="知识库引用列表"
      className={cn(
        "rounded-2xl border border-gray-200 bg-white",
        className
      )}
    >
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-500">
          <SFIcon icon={IconFileText} size={11} />
          知识库引用 · 共 {citations.length} 条
        </div>
        <span className="text-[10.5px] text-gray-400">
          颗粒度到句 · 点击查看完整原文
        </span>
      </header>
      <ul className={cn("divide-y divide-gray-100", compact ? "" : "")}>
        {citations.map((c, i) => {
          const refNum = i + 1;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onView(c)}
                className="group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <span className="mt-0.5 inline-flex h-[20px] min-w-[24px] shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-1 text-[11px] font-semibold tabular-nums text-gray-700 group-hover:border-gray-900 group-hover:bg-gray-900 group-hover:text-white">
                  {refNum}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <SFIcon icon={IconFileText} size={11} className="shrink-0 text-gray-400" />
                    <p className="truncate text-[12.5px] font-semibold text-gray-900">
                      《{c.document}》
                    </p>
                    <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] tabular-nums text-gray-500">
                      P{c.page}
                    </span>
                    {c.paragraph && (
                      <span className="truncate text-[10.5px] text-gray-400">
                        · {c.paragraph}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-gray-600">
                    「{c.excerpt}」
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
