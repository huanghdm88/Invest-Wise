import { useEffect, useRef, useState } from "react";

import { Button } from "@/src/components/ui/button";
import { AnalysisAbortedCard } from "@/src/components/chat/AnalysisAbortedCard";
import { ClarificationCard } from "@/src/components/chat/ClarificationCard";
import { ModePickCard } from "@/src/components/chat/ModePickCard";
import { ReportSummaryCard } from "@/src/components/chat/ReportSummaryCard";
import { Logo } from "@/src/components/logo";
import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconAuto,
  IconChallenge,
  IconChevronDown,
  IconChevronUp,
  IconDownload,
  IconExternalLink,
  IconFactCheck,
  IconFile,
  IconFileSpreadsheet,
  IconFileText,
  IconInfo,
  IconThumbDown,
  IconThumbUp,
  IconUser,
} from "@/src/lib/icons";
import type { FileKind } from "@/src/types";
import { isReportBlock } from "@/src/lib/project-reports";
import { cn } from "@/src/lib/utils";
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
  onExport: (block: AssistantBlock) => void;
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
  /** 由长任务刚刚注入到对话流的 assistant 消息 id 集合：报告卡片会有一次 yellow fade 动画 */
  newReportMessageIds?: Set<string>;
  /** yellow fade 动画播放完成的回调；MessageList 会把 id 上抛，由父级从 newReportMessageIds 中移除，确保动画只播一次 */
  onReportAnimated?: (msgId: string) => void;
  /** 用户在 analysis-aborted 卡片里通过快速上传补传文件时触发，由父级写入项目知识库并追加重启分析消息 */
  onQuickUpload?: (msgId: string, files: FileList) => void;
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

const fileKindIconMap: Record<FileKind, typeof IconFile> = {
  pdf: IconFileText,
  word: IconFileText,
  ppt: IconFileText,
  excel: IconFileSpreadsheet,
  other: IconFile,
};

/**
 * 把 assistant 文本中的 http(s) 链接自动渲染成可点击的蓝色超链接。
 * 兼容中文/全角空白前后的 URL；不修改其余文字。
 */
const URL_REGEX = /https?:\/\/[^\s\u3000\u4e00-\u9fa5]+[^\s\u3000\u4e00-\u9fa5\p{P}]/gu;

function AutoLinkText({ text }: { text: string }) {
  const parts: Array<{ type: "text" | "link"; value: string }> = [];
  let lastIndex = 0;
  for (const match of text.matchAll(URL_REGEX)) {
    const start = match.index ?? 0;
    if (start > lastIndex) parts.push({ type: "text", value: text.slice(lastIndex, start) });
    parts.push({ type: "link", value: match[0] });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ type: "text", value: text.slice(lastIndex) });
  if (parts.length === 0) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) =>
        p.type === "link" ? (
          <a
            key={i}
            href={p.value}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-sky-600 underline decoration-sky-300 underline-offset-2 transition-colors hover:text-sky-700 hover:decoration-sky-500"
          >
            {p.value}
            <SFIcon icon={IconExternalLink} size={11} className="ml-0.5 inline-block align-[-2px]" />
          </a>
        ) : (
          <span key={i}>{p.value}</span>
        )
      )}
    </>
  );
}

/** 用户消息下方的附件标签条：单个直接展示；超过 3 个时收起 + 「+N」展开 */
function UserAttachmentTags({
  attachments,
}: {
  attachments: NonNullable<ChatMessage["attachments"]>;
}) {
  const [expanded, setExpanded] = useState(false);
  const overflow = attachments.length > 3;
  const visible = !overflow || expanded ? attachments : attachments.slice(0, 3);
  const hiddenCount = overflow && !expanded ? attachments.length - 3 : 0;

  return (
    <div className="flex max-w-full flex-wrap justify-end gap-1.5">
      {visible.map((a, i) => {
        const Icon = fileKindIconMap[a.kind] ?? IconFile;
        return (
          <div
            key={`${a.name}-${i}`}
            className="inline-flex max-w-[220px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] shadow-sm"
            title={`${a.name} · ${a.size}`}
          >
            <SFIcon icon={Icon} size={12} className="shrink-0 text-slate-400" />
            <span className="truncate font-medium text-slate-700">{a.name}</span>
          </div>
        );
      })}
      {overflow && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-900"
          aria-label={expanded ? "收起附件" : `展开剩余 ${hiddenCount} 个附件`}
        >
          {expanded ? (
            <>
              收起 <SFIcon icon={IconChevronUp} size={10} />
            </>
          ) : (
            <>
              +{hiddenCount} <SFIcon icon={IconChevronDown} size={10} />
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function MessageList({
  messages,
  generating,
  onViewSource,
  onClarificationSubmit,
  onExport,
  onOpenReport,
  onModePick,
  hasKnowledge = true,
  newReportMessageIds,
  onReportAnimated,
  onQuickUpload,
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
                      <div className="rounded-tl-2xl rounded-bl-2xl rounded-br-2xl bg-slate-900 px-4 py-2.5 text-sm text-white shadow-sm">
                        {msg.text}
                      </div>
                    )}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <UserAttachmentTags attachments={msg.attachments} />
                    )}
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <SFIcon icon={IconUser} size={14} />
                  </div>
                </div>
              </div>
            );
          }

          const reportBlock = msg.blocks?.find((b) => isReportBlock(b));
          const hasReportBlock = Boolean(reportBlock);
          const isNewReport = newReportMessageIds?.has(msg.id) ?? false;

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
                          className="whitespace-pre-wrap px-1 text-sm leading-relaxed text-slate-800"
                        >
                          <AutoLinkText text={block.text} />
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
                    case "analysis-aborted":
                      return (
                        <AnalysisAbortedCard
                          key={i}
                          block={block}
                          onQuickUpload={(files) =>
                            onQuickUpload?.(msg.id, files)
                          }
                        />
                      );
                    case "fact-verification":
                    case "challenge-list":
                    case "valuation":
                    case "diligence-report":
                      return (
                        <div
                          key={i}
                          className={cn(
                            "relative",
                            isNewReport && "animate-yellow-card-ring"
                          )}
                          // ring 动画跑完后通知父级清掉 id，避免下次重挂载又播一次
                          onAnimationEnd={(e) => {
                            if (
                              isNewReport &&
                              e.animationName === "yellow-card-ring"
                            ) {
                              onReportAnimated?.(msg.id);
                            }
                          }}
                        >
                          <ReportSummaryCard
                            block={block}
                            onOpen={() => onOpenReport(block)}
                          />
                          {isNewReport && (
                            <span
                              aria-hidden
                              className="animate-yellow-card-overlay pointer-events-none absolute inset-0 rounded-2xl bg-yellow-200/30"
                            />
                          )}
                        </div>
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
                  {reportBlock && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-[11px] text-slate-500 hover:text-slate-900"
                      onClick={() => onExport(reportBlock)}
                    >
                      <SFIcon icon={IconDownload} size={11} />
                      导出为 HTML
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
              Agent 正在解析中…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
