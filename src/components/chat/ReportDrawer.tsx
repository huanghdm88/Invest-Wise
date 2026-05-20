import { useEffect, useState } from "react";

import { ChallengeListCard } from "@/src/components/chat/ChallengeListCard";
import { FactVerificationCard } from "@/src/components/chat/FactVerificationCard";
import { ValuationCard } from "@/src/components/chat/ValuationCard";
import { Button } from "@/src/components/ui/button";
import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconCalculator,
  IconChecklist,
  IconClose,
  IconFactCheck,
} from "@/src/lib/icons";
import { cn } from "@/src/lib/utils";
import type { AssistantBlock, SourceAnchor } from "@/src/types";

interface ReportDrawerProps {
  block: AssistantBlock | null;
  onClose: () => void;
  onViewSource: (anchor: SourceAnchor) => void;
}

const meta = {
  "fact-verification": { eyebrow: "事实交叉验证 · Fact Verification", icon: IconFactCheck },
  "challenge-list":    { eyebrow: "挑战质询清单 · Challenge List",    icon: IconChecklist  },
  valuation:           { eyebrow: "估值平行测算 · Valuation",          icon: IconCalculator },
} as const;

export function ReportDrawer({ block, onClose, onViewSource }: ReportDrawerProps) {
  const open = block !== null;

  // 关闭动画期间继续显示最后一次的报告内容，避免抽屉滑出时画面瞬间变空
  const [lastBlock, setLastBlock] = useState<AssistantBlock | null>(null);
  useEffect(() => {
    if (block) setLastBlock(block);
  }, [block]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const renderBlock = block ?? lastBlock;
  const showable =
    renderBlock &&
    (renderBlock.kind === "fact-verification" ||
      renderBlock.kind === "challenge-list" ||
      renderBlock.kind === "valuation")
      ? renderBlock
      : null;

  const headerMeta = showable ? meta[showable.kind] : null;

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
          "absolute right-0 top-0 flex h-full w-[760px] max-w-[94vw] flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={showable?.kind === "fact-verification" ? showable.title : undefined}
      >
        {showable && headerMeta && (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  <SFIcon icon={headerMeta.icon} size={11} />
                  {headerMeta.eyebrow}
                </div>
                <h2 className="mt-1.5 truncate text-[17px] font-semibold leading-snug text-gray-900">
                  {showable.title}
                </h2>
                {"summary" in showable && (
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-gray-500">
                    {showable.summary}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={onClose}
                aria-label="关闭"
                title="关闭 (Esc)"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg p-0"
              >
                <SFIcon icon={IconClose} size={13} />
              </Button>
            </div>

            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto bg-[#fafafa] px-6 py-6">
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
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
