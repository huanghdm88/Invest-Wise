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
  IconLightbulb,
  IconSettings,
  IconThumbDown,
  IconThumbUp,
  IconUpload,
  IconUser,
} from "@/src/lib/icons";
import type { AssistantBlock, ChatMessage, SourceAnchor, WorkMode } from "@/src/types";

interface MessageListProps {
  messages: ChatMessage[];
  generating: boolean;
  onViewSource: (anchor: SourceAnchor) => void;
  onClarificationSubmit: (msgId: string, values: Record<string, string>) => void;
  onExport: () => void;
  /** 点击报告汇总卡片，在右侧 Canvas 抽屉中展开完整报告 */
  onOpenReport: (block: AssistantBlock) => void;
  /** 智能路由分歧时，用户选择具体模式继续执行 */
  onModePick: (
    msgId: string,
    mode: Extract<WorkMode, "fact-check" | "challenge">,
    originalQuery: string
  ) => void;
  /** 项目尚未就绪（草稿态：偏好未配 / 知识库未上传） */
  awaitingSetup?: boolean;
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
  awaitingSetup = false,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, generating]);

  if (awaitingSetup) {
    return (
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-5 py-10">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
            <Logo withText={false} />
          </div>
          <h2 className="mt-4 text-[15px] font-semibold text-gray-900">项目尚未就绪</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
            请先在右侧面板完成项目偏好设置，并上传投决议案、商业计划书、财务底稿等核心材料。完成「分析评估」后，即可在此发起事实交叉验证与挑战质询。
          </p>

          <ol className="mt-6 w-full space-y-2 text-left">
            <SetupStep
              index={1}
              icon={<SFIcon icon={IconSettings} size={13} />}
              title="完善「偏好」"
              desc="选择风险容忍度、投资阶段，并填写自定义分析指令"
            />
            <SetupStep
              index={2}
              icon={<SFIcon icon={IconUpload} size={13} />}
              title="上传「知识库」"
              desc="支持 PDF / Word / PPT / Excel，建议含议案、BP、FDD、LDD"
            />
            <SetupStep
              index={3}
              icon={<SFIcon icon={IconLightbulb} size={13} />}
              title="点击「分析评估」"
              desc="Agent 将解析资料并构建项目知识图谱，随后即可开始提问"
            />
          </ol>

          <p className="mt-6 text-[11px] text-gray-400">
            完成以上准备后，对话区将自动激活
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="thin-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
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
                        <div key={i} className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-sm">
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
                          onSubmit={(v) => onClarificationSubmit(msg.id, v)}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-[11px] text-slate-500 hover:text-slate-900"
                    onClick={onExport}
                  >
                    <SFIcon icon={IconDownload} size={11} />
                    导出为报告（Markdown / Word）
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {generating && (
          <div className="flex items-start gap-3">
            <Logo withText={false} />
            <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
              <span className="thinking-shimmer-text text-sm font-medium">Agent 正在分析中…</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SetupStep({
  index,
  icon,
  title,
  desc,
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-semibold text-white">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-900">
          <span className="text-gray-500">{icon}</span>
          {title}
        </div>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-gray-500">{desc}</p>
      </div>
    </li>
  );
}
