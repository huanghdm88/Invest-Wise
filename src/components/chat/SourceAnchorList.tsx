import { SFIcon } from "@/src/components/ui/sf-icon";
import { IconFileText } from "@/src/lib/icons";
import { cn } from "@/src/lib/utils";
import type { SourceAnchor } from "@/src/types";

interface SourceAnchorListProps {
  anchors: SourceAnchor[];
  onView: (anchor: SourceAnchor) => void;
  compact?: boolean;
}

export function SourceAnchorList({ anchors, onView, compact = false }: SourceAnchorListProps) {
  if (!anchors || anchors.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className={cn("text-[10px] font-semibold uppercase tracking-wider text-slate-400", compact && "mb-1")}>
        证据锚点 · {anchors.length}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {anchors.map((a, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onView(a)}
            className="group inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            title="查看原文片段"
          >
            <SFIcon icon={IconFileText} size={11} className="text-slate-400 group-hover:text-slate-700" />
            <span className="font-medium">《{a.document}》</span>
            <span className="text-slate-500">P{a.page}{a.paragraph && ` · ${a.paragraph}`}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
