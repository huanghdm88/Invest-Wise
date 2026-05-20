import { CitationsFooter } from "@/src/components/chat/CitationsFooter";
import { CitedText } from "@/src/components/chat/CitedText";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { IconCalculator, IconTrendUp } from "@/src/lib/icons";
import type { SourceAnchor } from "@/src/types";

interface ValuationCardProps {
  title: string;
  summary: string;
  methods: Array<{
    method: string;
    range: string;
    assumption: string;
    applicability: string;
  }>;
  conclusion: string;
  citations?: SourceAnchor[];
  onViewSource?: (anchor: SourceAnchor) => void;
}

const noop = () => undefined;

export function ValuationCard({
  title,
  summary,
  methods,
  conclusion,
  citations,
  onViewSource,
}: ValuationCardProps) {
  const handleView = onViewSource ?? noop;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <SFIcon icon={IconCalculator} size={14} className="text-slate-700" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              估值平行测算
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            <CitedText text={summary} citations={citations} onView={handleView} />
          </p>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-100">
          {methods.map((m, i) => (
            <div key={i} className="grid grid-cols-[2fr_3fr] gap-4 px-5 py-3.5">
              <div>
                <p className="text-xs font-semibold text-slate-900">{m.method}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">
                  独立估值区间
                </p>
                <p className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                  {m.range}
                </p>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  <CitedText text={m.applicability} citations={citations} onView={handleView} />
                </p>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <SFIcon icon={IconTrendUp} size={13} className="mt-0.5 text-slate-500" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    隐含假设
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-700">
                    <CitedText text={m.assumption} citations={citations} onView={handleView} />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 bg-amber-50/40 px-5 py-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
            综合估值区间
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-800">
            <CitedText text={conclusion} citations={citations} onView={handleView} />
          </p>
          <p className="mt-2 text-[10px] text-amber-700/80">
            ※ Agent 严禁给出"推荐估值"或"建议投资价"，最终判断权留给用户。
          </p>
        </div>
      </div>

      <CitationsFooter citations={citations} onView={handleView} />
    </div>
  );
}
