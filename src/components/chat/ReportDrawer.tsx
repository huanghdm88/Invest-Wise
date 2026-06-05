import { useEffect, useState } from "react";

import { ChallengeListCard } from "@/src/components/chat/ChallengeListCard";
import { DiligenceReportCard } from "@/src/components/chat/DiligenceReportCard";
import { EnterpriseAnalysisCard } from "@/src/components/chat/EnterpriseAnalysisCard";
import { FactVerificationCard } from "@/src/components/chat/FactVerificationCard";
import { ValuationCard } from "@/src/components/chat/ValuationCard";
import { Button } from "@/src/components/ui/button";
import { SFIcon } from "@/src/components/ui/sf-icon";
import type { ReportBlock } from "@/src/lib/project-reports";
import {
  IconBuilding,
  IconCalculator,
  IconChecklist,
  IconClose,
  IconDownload,
  IconFactCheck,
  IconShieldAlert,
} from "@/src/lib/icons";
import { cn, formatRelative } from "@/src/lib/utils";
import type { SourceAnchor } from "@/src/types";

export interface ReportDrawerMeta {
  sourceLabel?: string;
  createdAt?: string;
}

interface ReportDrawerProps {
  block: ReportBlock | null;
  meta?: ReportDrawerMeta | null;
  onClose: () => void;
  onViewSource: (anchor: SourceAnchor) => void;
  onDownload?: () => void;
}

const headerMeta = {
  "fact-verification": {
    eyebrow: "事实交叉验证 · Fact Verification",
    icon: IconFactCheck,
    detailHint:
      "完整报告包含多源数据对照表、R4/R5 级偏差展开说明与证据锚点，可点击引用跳转原文。",
  },
  "challenge-list": {
    eyebrow: "挑战质询清单 · Challenge List",
    icon: IconChecklist,
    detailHint:
      "完整报告按 R1–R5 风险等级列出灵魂质询条目，含底层矛盾、证据底座与条款 / 对赌建议。",
  },
  valuation: {
    eyebrow: "估值平行测算 · Valuation",
    icon: IconCalculator,
    detailHint: "完整报告展示多种测算方法、关键假设与综合估值区间，不提供单一推荐值。",
  },
  "enterprise-analysis": {
    eyebrow: "企业分析评估 · Enterprise Assessment",
    icon: IconBuilding,
    detailHint:
      "基于最新企业信息、风险口径与知识库全量重算，输出分维度评估与关键结论。",
  },
  "diligence-report": {
    eyebrow: "尽调复核报告 · Diligence Review",
    icon: IconShieldAlert,
    detailHint:
      "对原始投决 / 尽调材料做独立复核：左侧目录可快捷跳转，章节可折叠，关键数字以可视化呈现，引用悬停看来源、点击跳转原文。",
  },
} as const;

export function ReportDrawer({
  block,
  meta,
  onClose,
  onViewSource,
  onDownload,
}: ReportDrawerProps) {
  const open = block !== null;

  const [lastBlock, setLastBlock] = useState<ReportBlock | null>(null);
  const [lastMeta, setLastMeta] = useState<ReportDrawerMeta | null>(null);
  useEffect(() => {
    if (block) {
      setLastBlock(block);
      if (meta) setLastMeta(meta);
    }
  }, [block, meta]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const showable = block ?? lastBlock;
  const displayMeta = meta ?? lastMeta;
  const hm = showable ? headerMeta[showable.kind] : null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 transition-all duration-300",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-gray-900/15 backdrop-blur-[1px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full max-w-[96vw] flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300",
          showable?.kind === "diligence-report" ? "w-[1040px]" : "w-[760px]",
          open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={showable?.title}
      >
        {showable && hm && (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  <SFIcon icon={hm.icon} size={11} />
                  {hm.eyebrow}
                </div>
                <h2 className="mt-1.5 truncate text-[17px] font-semibold leading-snug text-gray-900">
                  {showable.title}
                </h2>
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-gray-500">
                  {showable.summary}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {onDownload && (
                  <Button
                    variant="outline"
                    onClick={onDownload}
                    aria-label="下载报告"
                    title="下载报告（Markdown / Word）"
                    className="flex h-9 w-9 items-center justify-center rounded-lg p-0"
                  >
                    <SFIcon icon={IconDownload} size={13} />
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={onClose}
                  aria-label="关闭"
                  title="关闭 (Esc)"
                  className="flex h-9 w-9 items-center justify-center rounded-lg p-0"
                >
                  <SFIcon icon={IconClose} size={13} />
                </Button>
              </div>
            </div>

            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto bg-[#fafafa] px-6 py-6">
              <ReportDetailMeta
                sourceLabel={displayMeta?.sourceLabel}
                createdAt={displayMeta?.createdAt}
                detailHint={hm.detailHint}
              />

              {showable.kind === "fact-verification" && (
                <FactVerificationCard
                  title={showable.title}
                  level={showable.level}
                  summary={showable.summary}
                  compares={showable.compares}
                  anchors={showable.anchors}
                  citations={showable.citations}
                  onViewSource={onViewSource}
                />
              )}
              {showable.kind === "challenge-list" && (
                <ChallengeListCard
                  title={showable.title}
                  summary={showable.summary}
                  items={showable.items}
                  citations={showable.citations}
                  onViewSource={onViewSource}
                />
              )}
              {showable.kind === "valuation" && (
                <ValuationCard
                  title={showable.title}
                  summary={showable.summary}
                  methods={showable.methods}
                  conclusion={showable.conclusion}
                  citations={showable.citations}
                  onViewSource={onViewSource}
                />
              )}
              {showable.kind === "enterprise-analysis" && (
                <EnterpriseAnalysisCard
                  block={showable}
                  onViewSource={onViewSource}
                />
              )}
              {showable.kind === "diligence-report" && (
                <DiligenceReportCard
                  block={showable}
                  onViewSource={onViewSource}
                />
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function ReportDetailMeta({
  sourceLabel,
  createdAt,
  detailHint,
}: {
  sourceLabel?: string;
  createdAt?: string;
  detailHint: string;
}) {
  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-white px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
        报告详情
      </p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-gray-600">{detailHint}</p>
      {(sourceLabel || createdAt) && (
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-gray-100 pt-3 text-[11.5px]">
          {sourceLabel && (
            <div>
              <dt className="text-gray-400">来源</dt>
              <dd className="font-medium text-gray-800">{sourceLabel}</dd>
            </div>
          )}
          {createdAt && (
            <div>
              <dt className="text-gray-400">生成时间</dt>
              <dd className="font-medium text-gray-800">
                {formatRelative(createdAt)}
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
