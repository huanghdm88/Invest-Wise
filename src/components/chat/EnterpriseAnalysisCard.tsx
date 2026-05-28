import { CitationsFooter } from "@/src/components/chat/CitationsFooter";
import { CitedText } from "@/src/components/chat/CitedText";
import { PriorityBadge } from "@/src/components/chat/PriorityBadge";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { IconBuilding } from "@/src/lib/icons";
import { cn } from "@/src/lib/utils";
import type { AssistantBlock, SourceAnchor } from "@/src/types";

type EnterpriseBlock = Extract<AssistantBlock, { kind: "enterprise-analysis" }>;

interface EnterpriseAnalysisCardProps {
  block: EnterpriseBlock;
  onViewSource: (anchor: SourceAnchor) => void;
}

export function EnterpriseAnalysisCard({
  block,
  onViewSource,
}: EnterpriseAnalysisCardProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
            <SFIcon icon={IconBuilding} size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                企业分析评估
              </span>
              <PriorityBadge priority={block.overallLevel} size="sm" />
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-gray-700">
              {block.citations && block.citations.length > 0 ? (
                <CitedText
                  text={block.summary}
                  citations={block.citations}
                  onView={onViewSource}
                />
              ) : (
                block.summary
              )}
            </p>
          </div>
        </div>
      </div>

      <section>
        <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
          分维度评估
        </h3>
        <ul className="space-y-2">
          {block.dimensions.map((d) => (
            <li
              key={d.key}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-gray-900">
                  {d.label}
                </span>
                <PriorityBadge priority={d.level} size="sm" />
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-gray-600">
                {d.finding}
              </p>
              <p
                className={cn(
                  "mt-2 rounded-lg bg-gray-50 px-3 py-2 text-[11.5px] leading-relaxed text-gray-700"
                )}
              >
                <span className="font-medium text-gray-900">建议 · </span>
                {d.recommendation}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
          关键结论
        </h3>
        <ul className="space-y-1.5 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
          {block.highlights.map((h, i) => (
            <li
              key={i}
              className="flex gap-2 text-[12.5px] leading-relaxed text-amber-950/90"
            >
              <span className="shrink-0 font-semibold text-amber-700">
                {i + 1}.
              </span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </section>

      {block.citations && block.citations.length > 0 && (
        <CitationsFooter citations={block.citations} onView={onViewSource} />
      )}
    </div>
  );
}
