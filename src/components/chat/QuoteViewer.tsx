import { Button } from "@/src/components/ui/button";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { IconClose, IconFileText } from "@/src/lib/icons";
import type { SourceAnchor } from "@/src/types";

interface QuoteViewerProps {
  anchor: SourceAnchor | null;
  onClose: () => void;
}

export function QuoteViewer({ anchor, onClose }: QuoteViewerProps) {
  if (!anchor) return null;

  const renderExcerpt = () => {
    const text = anchor.excerpt;
    if (!anchor.highlight || anchor.highlight.length === 0) return text;
    const escaped = anchor.highlight.map((h) => h.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));
    const re = new RegExp(`(${escaped.join("|")})`, "g");
    const parts = text.split(re);
    return parts.map((part, i) =>
      escaped.some((e) => new RegExp(`^${e}$`).test(part)) ? (
        <mark key={i} className="evidence-highlight">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex">
      <button
        type="button"
        className="pointer-events-auto flex-1 bg-black/30 backdrop-blur-[1px] transition-opacity"
        aria-label="关闭原文查看"
        onClick={onClose}
      />
      <div className="pointer-events-auto flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-staged-reveal">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">引文查看 · Quote Viewer</p>
            <div className="mt-1 flex items-center gap-2">
              <SFIcon icon={IconFileText} size={14} className="shrink-0 text-slate-700" />
              <p className="line-clamp-1 text-sm font-semibold text-slate-900">《{anchor.document}》</p>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              P{anchor.page} {anchor.paragraph && `· ${anchor.paragraph}`}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="关闭">
            <SFIcon icon={IconClose} size={14} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scroll px-5 py-5">
          <div className="rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3.5">
            <p className="text-xs font-medium text-amber-700">原始引文片段</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-800">{renderExcerpt()}</p>
          </div>

          <div className="mt-5 space-y-3 text-xs leading-relaxed text-slate-500">
            <p>
              <span className="font-semibold text-slate-700">说明：</span>
              本视图为轻量级文本片段展示，保留原段落换行；命中关键字以高亮形式标记。
              如需查看完整 PDF，请到「项目管理 - 资料库」中下载原始文件。
            </p>
            <p>
              <span className="font-semibold text-slate-700">数据可信度：</span>
              内部高信度文档（审计 / LDD / FDD） · 与外部数据源交叉验证后纳入证据链
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-3">
          <Button variant="outline" size="sm" className="w-full">
            打开完整文档
          </Button>
        </div>
      </div>
    </div>
  );
}
