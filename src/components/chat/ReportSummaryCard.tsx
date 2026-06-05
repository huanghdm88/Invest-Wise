import { PriorityBadge } from "@/src/components/chat/PriorityBadge";
import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconArrowRight,
  IconBuilding,
  IconCalculator,
  IconChecklist,
  IconFactCheck,
  IconShieldAlert,
} from "@/src/lib/icons";
import { cn, formatRelative } from "@/src/lib/utils";
import { isElevatedRisk, isHighRisk } from "@/src/lib/risk-level";
import type { AssistantBlock, RiskLevel } from "@/src/types";

type ReportBlock = Extract<
  AssistantBlock,
  {
    kind:
      | "fact-verification"
      | "challenge-list"
      | "valuation"
      | "enterprise-analysis"
      | "diligence-report";
  }
>;

interface ReportSummaryCardProps {
  block: ReportBlock;
  onOpen: () => void;
  /** 来源（仅项目主页历史报告：显示在卡片右上角） */
  sourceLabel?: string;
  /** 生成时间（仅项目主页历史报告：显示在标题下方） */
  createdAt?: string;
  /** 新报告 yellow fade */
  isNew?: boolean;
  onAnimated?: () => void;
}

interface SummaryConfig {
  eyebrow: string;
  icon: typeof IconFactCheck;
  accent: string; // tailwind classes for eyebrow accent
  stats: Array<{ label: string; value: string; tone?: "default" | "high" | "medium" | "neutral" }>;
  level?: RiskLevel;
}

function buildConfig(block: ReportBlock): SummaryConfig {
  if (block.kind === "fact-verification") {
    const highCount = block.compares.filter((c) => isHighRisk(c.level)).length;
    return {
      eyebrow: "事实交叉验证",
      icon: IconFactCheck,
      accent: "text-sky-600",
      stats: [
        { label: "对比项", value: `${block.compares.length} 项` },
        { label: "R4/R5 偏差", value: `${highCount} 项`, tone: highCount > 0 ? "high" : "neutral" },
        { label: "证据锚点", value: `${block.anchors.length} 条` },
      ],
      level: block.level,
    };
  }

  if (block.kind === "challenge-list") {
    const high = block.items.filter((i) => isHighRisk(i.riskLevel)).length;
    const medium = block.items.filter((i) => i.riskLevel === "R3").length;
    return {
      eyebrow: "挑战质询清单",
      icon: IconChecklist,
      accent: "text-violet-600",
      stats: [
        { label: "质询总数", value: `${block.items.length} 条` },
        { label: "R4/R5", value: `${high} 条`, tone: high > 0 ? "high" : "neutral" },
        { label: "R3", value: `${medium} 条`, tone: "medium" },
      ],
    };
  }

  if (block.kind === "enterprise-analysis") {
    const elevated = block.dimensions.filter((d) => isElevatedRisk(d.level)).length;
    return {
      eyebrow: "企业分析评估",
      icon: IconBuilding,
      accent: "text-indigo-600",
      stats: [
        { label: "评估维度", value: `${block.dimensions.length} 项` },
        {
          label: "R3+ 维度",
          value: `${elevated} 项`,
          tone: elevated > 0 ? "high" : "neutral",
        },
        { label: "关键结论", value: `${block.highlights.length} 条` },
      ],
      level: block.overallLevel,
    };
  }

  if (block.kind === "diligence-report") {
    return {
      eyebrow: "尽调复核报告",
      icon: IconShieldAlert,
      accent: "text-rose-600",
      stats: [
        { label: "复核章节", value: `${block.sections.length} 章` },
        { label: "最终建议", value: block.verdict.recommendation, tone: "high" },
        { label: "引用来源", value: `${block.citations.length} 条` },
      ],
      level: block.verdict.riskLevel,
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
  high: "text-rose-600",
  medium: "text-amber-600",
};

export function ReportSummaryCard({
  block,
  onOpen,
  sourceLabel,
  createdAt,
  isNew,
  onAnimated,
}: ReportSummaryCardProps) {
  const cfg = buildConfig(block);
  const showHistoryMeta = Boolean(sourceLabel || createdAt);

  return (
    <div
      className={cn("relative", isNew && "animate-yellow-card-ring")}
      onAnimationEnd={(e) => {
        if (isNew && e.animationName === "yellow-card-ring") {
          onAnimated?.();
        }
      }}
    >
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition-all",
        "hover:-translate-y-px hover:border-gray-300 hover:shadow-md"
      )}
    >
      <div className="border-b border-gray-100 bg-gradient-to-br from-white to-gray-50/60 px-5 py-4">
        <div
          className={cn(
            "flex gap-3",
            showHistoryMeta ? "items-start justify-between" : "items-center"
          )}
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <SFIcon icon={cfg.icon} size={12} className={cfg.accent} />
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.16em]",
                cfg.accent
              )}
            >
              {cfg.eyebrow}
            </span>
            {cfg.level && <PriorityBadge level={cfg.level} size="sm" />}
          </div>
          {sourceLabel && (
            <span
              className="max-w-[42%] shrink-0 truncate text-right text-[10.5px] font-medium text-gray-400"
              title={sourceLabel}
            >
              {sourceLabel}
            </span>
          )}
        </div>
        <h3 className="mt-2 text-[15px] font-semibold leading-snug text-gray-900">
          {block.title}
        </h3>
        {createdAt && (
          <p className="mt-1 text-[11px] text-gray-400">{formatRelative(createdAt)}</p>
        )}
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
    {isNew && (
      <span
        aria-hidden
        className="animate-yellow-card-overlay pointer-events-none absolute inset-0 rounded-2xl bg-yellow-200/30"
      />
    )}
    </div>
  );
}
