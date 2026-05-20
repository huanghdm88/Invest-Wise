import { PriorityBadge } from "@/src/components/chat/PriorityBadge";
import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconArrowRight,
  IconCalculator,
  IconChecklist,
  IconFactCheck,
} from "@/src/lib/icons";
import { cn } from "@/src/lib/utils";
import type { AssistantBlock, Priority } from "@/src/types";

type ReportBlock = Extract<
  AssistantBlock,
  { kind: "fact-verification" | "challenge-list" | "valuation" }
>;

interface ReportSummaryCardProps {
  block: ReportBlock;
  onOpen: () => void;
}

interface SummaryConfig {
  eyebrow: string;
  icon: typeof IconFactCheck;
  accent: string; // tailwind classes for eyebrow accent
  stats: Array<{ label: string; value: string; tone?: "default" | "p1" | "p2" | "neutral" }>;
  level?: Priority;
}

function buildConfig(block: ReportBlock): SummaryConfig {
  if (block.kind === "fact-verification") {
    const p1Count = block.compares.filter((c) => c.level === "P1" || c.level === "P0").length;
    return {
      eyebrow: "事实交叉验证",
      icon: IconFactCheck,
      accent: "text-sky-600",
      stats: [
        { label: "对比项", value: `${block.compares.length} 项` },
        { label: "高优先级偏差", value: `${p1Count} 项`, tone: p1Count > 0 ? "p1" : "neutral" },
        { label: "证据锚点", value: `${block.anchors.length} 条` },
      ],
      level: block.level,
    };
  }

  if (block.kind === "challenge-list") {
    const p1 = block.items.filter((i) => i.priority === "P0" || i.priority === "P1").length;
    const p2 = block.items.filter((i) => i.priority === "P2").length;
    return {
      eyebrow: "挑战质询清单",
      icon: IconChecklist,
      accent: "text-violet-600",
      stats: [
        { label: "质询总数", value: `${block.items.length} 条` },
        { label: "P0/P1", value: `${p1} 条`, tone: p1 > 0 ? "p1" : "neutral" },
        { label: "P2", value: `${p2} 条`, tone: "p2" },
      ],
    };
  }

  // valuation
  return {
    eyebrow: "估值平行测算",
    icon: IconCalculator,
    accent: "text-amber-600",
    stats: [
      { label: "测算方法", value: `${block.methods.length} 种` },
      { label: "综合区间", value: extractRange(block.conclusion) ?? "—" },
    ],
  };
}

/** 从结论文案中粗略截取「9.4 – 12.1 亿元」这类区间字符串 */
function extractRange(conclusion: string): string | null {
  const match = conclusion.match(/([\d.]+\s*[–\-~至]\s*[\d.]+\s*(?:亿|万)?元?)/);
  return match ? match[1].replace(/\s+/g, "") : null;
}

const toneClass: Record<NonNullable<SummaryConfig["stats"][number]["tone"]>, string> = {
  default: "text-gray-900",
  neutral: "text-gray-500",
  p1: "text-rose-600",
  p2: "text-amber-600",
};

export function ReportSummaryCard({ block, onOpen }: ReportSummaryCardProps) {
  const cfg = buildConfig(block);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition-all",
        "hover:-translate-y-px hover:border-gray-300 hover:shadow-md"
      )}
    >
      <div className="border-b border-gray-100 bg-gradient-to-br from-white to-gray-50/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <SFIcon icon={cfg.icon} size={12} className={cfg.accent} />
          <span className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]", cfg.accent)}>
            {cfg.eyebrow}
          </span>
          <span className="text-[10px] font-medium text-gray-300">·</span>
          <span className="text-[10px] font-medium text-gray-400">报告汇总</span>
          {cfg.level && <PriorityBadge priority={cfg.level} size="sm" />}
        </div>
        <h3 className="mt-2 text-[15px] font-semibold leading-snug text-gray-900">{block.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-gray-600">
          {"summary" in block ? block.summary : ""}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          {cfg.stats.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-gray-400">{stat.label}</span>
              <span className={cn("text-[12px] font-semibold tabular-nums", toneClass[stat.tone ?? "default"])}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-medium text-gray-500 transition-colors group-hover:text-gray-900">
          查看完整报告
          <SFIcon
            icon={IconArrowRight}
            size={11}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </button>
  );
}
