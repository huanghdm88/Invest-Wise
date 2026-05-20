import { useEffect, useRef } from "react";

import { Button } from "@/src/components/ui/button";
import { ClarificationCard } from "@/src/components/chat/ClarificationCard";
import { ModePickCard } from "@/src/components/chat/ModePickCard";
import { ReportSummaryCard } from "@/src/components/chat/ReportSummaryCard";
import { Logo } from "@/src/components/logo";
import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconAuto,
  IconChallenge,
  IconDownload,
  IconFactCheck,
  IconFile,
  IconInfo,
  IconThumbDown,
  IconThumbUp,
  IconUser,
} from "@/src/lib/icons";
import type { AssistantBlock, ChatMessage, SourceAnchor, WorkMode } from "@/src/types";

interface MessageListProps {
  messages: ChatMessage[];
  generating: boolean;
  onViewSource: (anchor: SourceAnchor) => void;
  onClarificationSubmit: (
    msgId: string,
    values: Record<string, string>,
    followUp?: AssistantBlock[]
  ) => void;
  onExport: () => void;
  /** 点击报告汇总卡片，在右侧 Canvas 抽屉中展开完整报告 */
  onOpenReport: (block: AssistantBlock) => void;
  /** 智能路由分歧时，用户选择具体模式继续执行 */
  onModePick: (
    msgId: string,
    mode: Extract<WorkMode, "fact-check" | "challenge">,
    originalQuery: string
  ) => void;
  /** 当前项目知识库为空时的提示 */
  hasKnowledge?: boolean;
}

const modeIconMap: Record<WorkMode, typeof IconAuto> = {
  auto: IconAuto,
  "fact-check": IconFactCheck,
  challenge: IconChallenge,
};

const modeLabel: Record<WorkMode, string> = {
  auto: "智能路由",
  "fact-check": "事实验证",
  challenge: "挑战质询",
};

export function MessageList({
  messages,
  generating,
  onViewSource,
  onClarificationSubmit,
  onExport,
  onOpenReport,
  onModePick,
  hasKnowledge = true,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, generating]);

  return (
    <div ref={scrollRef} className="thin-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {!hasKnowledge && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
              <Logo withText={false} />
            </div>
            <h2 className="mt-3 text-[14px] font-semibold text-gray-900">
              知识库为空 · 仍可与 Agent 对话
            </h2>
            <p className="mt-1.5 max-w-md text-[12px] leading-relaxed text-gray-500">
              你可以直接提问，Agent 将基于偏好设置与通用知识作答；上传议案 / BP / 尽调底稿后，
              事实交叉验证与挑战质询将更精准、可溯源。
            </p>
          </div>
        )}
        {messages.map((msg) => {
          if (msg.role === "system") {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className="inline-flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-2 text-xs text-emerald-800">
                  <SFIcon icon={IconInfo} size={13} className="mt-0.5" />
                  <span className="leading-relaxed">{msg.text}</span>
                </div>
              </div>
            );
          }

          if (msg.role === "user") {
            const ModeIcon = msg.mode ? modeIconMap[msg.mode] : null;
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="flex max-w-[78%] items-start gap-3">
                  <div className="flex flex-col items-end gap-1.5">
                    {msg.mode && (
                      <div className="inline-flex items-center gap-1 rounded-md bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        {ModeIcon && <SFIcon icon={ModeIcon} size={10} />}
                        {modeLabel[msg.mode]}
                      </div>
                    )}
                    {msg.text && (
                      <div className="rounded-2xl rounded-tr-md bg-slate-900 px-4 py-2.5 text-sm text-white shadow-sm">
                        {msg.text}
                      </div>
                    )}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {msg.attachments.map((a, i) => (
                          <div
                            key={i}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px]"
                          >
                            <SFIcon icon={IconFile} size={10} className="text-slate-400" />
                            <span className="font-medium text-slate-700">{a.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <SFIcon icon={IconUser} size={14} />
                  </div>
                </div>
              </div>
            );
          }

          const hasReportBlock = msg.blocks?.some(
            (b) =>
              b.kind === "fact-verification" ||
              b.kind === "challenge-list" ||
              b.kind === "valuation"
          );

          return (
            <div key={msg.id} className="flex items-start gap-3">
              <div className="shrink-0">
                <Logo withText={false} />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                {msg.blocks?.map((block, i) => {
                  switch (block.kind) {
                    case "text":
                      return (
                        <div
                          key={i}
                          className="px-1 text-sm leading-relaxed text-slate-800"
                        >
                          {block.text}
                        </div>
                      );
                    case "clarification":
                      return (
                        <ClarificationCard
                          key={i}
                          title={block.title}
                          reason={block.reason}
                          fields={block.fields}
                          onSubmit={(v) =>
                            onClarificationSubmit(msg.id, v, block.followUp)
                          }
                        />
                      );
                    case "mode-pick":
                      return (
                        <ModePickCard
                          key={i}
                          title={block.title}
                          reason={block.reason}
                          options={block.options}
                          onPick={(mode) =>
                            onModePick(msg.id, mode, block.originalQuery)
                          }
                        />
                      );
                    case "fact-verification":
                    case "challenge-list":
                    case "valuation":
                      return (
                        <ReportSummaryCard
                          key={i}
                          block={block}
                          onOpen={() => onOpenReport(block)}
                        />
                      );
                    default:
                      return null;
                  }
                })}

                <div className="flex items-center gap-1 pl-1">
                  <Button variant="ghost" size="icon-sm" aria-label="有帮助" title="有帮助">
                    <SFIcon icon={IconThumbUp} size={13} className="text-slate-400" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="不准确" title="不准确">
                    <SFIcon icon={IconThumbDown} size={13} className="text-slate-400" />
                  </Button>
                  {hasReportBlock && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-[11px] text-slate-500 hover:text-slate-900"
                      onClick={onExport}
                    >
                      <SFIcon icon={IconDownload} size={11} />
                      导出为报告（Markdown / Word）
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {generating && (
          <div className="flex items-start gap-3">
            <Logo withText={false} />
            <span className="thinking-shimmer-text px-1 text-sm font-medium leading-relaxed">
              Agent 正在分析中…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
